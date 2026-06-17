import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { EChatMessageRole } from '../entity/enums/EChatMessageRole';
import { IChatMessage } from '../entity/interfaces/chat-message.interface';
import { IAgentTrainingExportService } from '../interfaces/agent-training-export.service.interface';
import { IAgentModelVersionRepositoryWrite } from '../repository/agent-model-version.repository';
import { IChatMessageRepositoryRead } from '../repository/chat-message.repository.read';
import { IChatMessageRepositoryWrite } from '../repository/chat-message.repository.write';

const MAX_EXPORT_MESSAGES = 10000;

const PII_PATTERNS = [
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/i,
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,
  /\bR\$\s?\d+([.,]\d+)?\b/i,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
];

interface IParamsAgentTrainingExportService {
  chatMessageRepositoryRead: IChatMessageRepositoryRead;
  chatMessageRepositoryWrite: IChatMessageRepositoryWrite;
  agentModelVersionRepositoryWrite: IAgentModelVersionRepositoryWrite;
  minSamples: number;
  modelTag: string;
}

interface ITrainingPair {
  instruction: string;
  response: string;
  messageIds: string[];
}

export class AgentTrainingExportService implements IAgentTrainingExportService {
  private readonly chatMessageRepositoryRead: IChatMessageRepositoryRead;
  private readonly chatMessageRepositoryWrite: IChatMessageRepositoryWrite;
  private readonly agentModelVersionRepositoryWrite: IAgentModelVersionRepositoryWrite;
  private readonly minSamples: number;
  private readonly modelTag: string;

  constructor({
    chatMessageRepositoryRead,
    chatMessageRepositoryWrite,
    agentModelVersionRepositoryWrite,
    minSamples,
    modelTag,
  }: IParamsAgentTrainingExportService) {
    this.chatMessageRepositoryRead = chatMessageRepositoryRead;
    this.chatMessageRepositoryWrite = chatMessageRepositoryWrite;
    this.agentModelVersionRepositoryWrite = agentModelVersionRepositoryWrite;
    this.minSamples = minSamples;
    this.modelTag = modelTag;
  }

  async exportAnonymizedDataset(outputPath: string): Promise<{ sampleCount: number }> {
    const pendingMessages = await this.chatMessageRepositoryRead.listMessagesPendingTrainingExport(
      MAX_EXPORT_MESSAGES,
    );

    const pairs = this.buildPairsFromMessages(pendingMessages);
    const anonymizedPairs = pairs.filter((pair) => this.isAnonymizedPairSafe(pair));

    if (anonymizedPairs.length < this.minSamples) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: `Not enough anonymized samples. Required: ${this.minSamples}, found: ${anonymizedPairs.length}`,
      } as IThrowedError;
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const jsonlLines = anonymizedPairs.map((pair) =>
      JSON.stringify({
        instruction: pair.instruction,
        response: pair.response,
      }),
    );

    await fs.writeFile(outputPath, `${jsonlLines.join('\n')}\n`, 'utf8');

    const exportedMessageIds = anonymizedPairs.flatMap((pair) => pair.messageIds);
    await this.chatMessageRepositoryWrite.markMessagesIndexedForTraining(exportedMessageIds);

    await this.agentModelVersionRepositoryWrite.createModelVersion({
      id: randomUUID(),
      modelTag: this.modelTag,
      sampleCount: anonymizedPairs.length,
      createdAt: new Date(),
    });

    return { sampleCount: anonymizedPairs.length };
  }

  isAnonymizedPairSafe(pair: ITrainingPair): boolean {
    const combined = `${pair.instruction}\n${pair.response}`;
    return !PII_PATTERNS.some((pattern) => pattern.test(combined));
  }

  private buildPairsFromMessages(messages: IChatMessage[]): ITrainingPair[] {
    const pairs: ITrainingPair[] = [];

    for (let index = 0; index < messages.length - 1; index += 1) {
      const currentMessage = messages[index];
      const nextMessage = messages[index + 1];

      if (
        currentMessage.role === EChatMessageRole.USER &&
        nextMessage.role === EChatMessageRole.ASSISTANT &&
        currentMessage.conversationId === nextMessage.conversationId
      ) {
        pairs.push({
          instruction: currentMessage.content.trim(),
          response: nextMessage.content.trim(),
          messageIds: [currentMessage.id, nextMessage.id],
        });
      }
    }

    return pairs.filter((pair) => pair.instruction && pair.response);
  }
}
