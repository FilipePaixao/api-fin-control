import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { EIncomeStatus } from '../entity/enums/EIncomeStatus';
import { IncomeServiceEntity } from '../entity/income.entity';
import {
  IIncomeFilters,
  IIncomeService,
  IParamsIncomeService,
  IReceiveIncomeInput,
  IUpdateIncomeInput,
} from '../interfaces/income.service.interface';
import { ICreateIncomeInput, IIncome } from '../entity/interfaces/income.interface';

export class IncomeService implements IIncomeService {
  private readonly incomeRepositoryRead: IParamsIncomeService['incomeRepositoryRead'];
  private readonly incomeRepositoryWrite: IParamsIncomeService['incomeRepositoryWrite'];

  constructor({ incomeRepositoryRead, incomeRepositoryWrite }: IParamsIncomeService) {
    this.incomeRepositoryRead = incomeRepositoryRead;
    this.incomeRepositoryWrite = incomeRepositoryWrite;
  }

  async createIncome(userId: string, payload: ICreateIncomeInput): Promise<IIncome> {
    const incomeEntity = new IncomeServiceEntity({
      ...payload,
      userId,
    });
    return this.incomeRepositoryWrite.createIncome(incomeEntity);
  }

  async listIncomes(userId: string, filters: IIncomeFilters): Promise<IIncome[]> {
    return this.incomeRepositoryRead.listIncomes({
      userId,
      category: filters.category,
      status: filters.status,
      referenceMonth: filters.referenceMonth,
    });
  }

  async getIncomeById(userId: string, incomeId: string): Promise<IIncome> {
    const income = await this.incomeRepositoryRead.findIncomeById(incomeId);
    this.assertIncomeOwnershipOrNotFound(income, userId, incomeId);
    return income;
  }

  async updateIncomeById(
    userId: string,
    incomeId: string,
    payload: IUpdateIncomeInput,
  ): Promise<IIncome> {
    const currentIncome = await this.incomeRepositoryRead.findIncomeById(incomeId);
    this.assertIncomeOwnershipOrNotFound(currentIncome, userId, incomeId);

    if (payload.amount !== undefined && payload.amount <= 0) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Income amount must be greater than zero',
      } as IThrowedError;
    }

    const mergedIncome = {
      ...currentIncome,
      ...payload,
      updatedAt: new Date(),
    };

    try {
      IncomeServiceEntity.validateIncomeInput(mergedIncome);
    } catch (error) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: error instanceof Error ? error.message : 'Invalid income payload',
      } as IThrowedError;
    }

    const updatedIncome = await this.incomeRepositoryWrite.updateIncomeById(incomeId, {
      ...payload,
      updatedAt: new Date(),
    });
    this.assertIncomeOwnershipOrNotFound(updatedIncome, userId, incomeId);
    return updatedIncome;
  }

  async deleteIncomeById(userId: string, incomeId: string): Promise<void> {
    const income = await this.incomeRepositoryRead.findIncomeById(incomeId);
    this.assertIncomeOwnershipOrNotFound(income, userId, incomeId);
    await this.incomeRepositoryWrite.deleteIncomeById(incomeId);
  }

  async receiveIncomeById(
    userId: string,
    incomeId: string,
    payload: IReceiveIncomeInput,
  ): Promise<IIncome> {
    const income = await this.incomeRepositoryRead.findIncomeById(incomeId);
    this.assertIncomeOwnershipOrNotFound(income, userId, incomeId);

    const updatedIncome = await this.incomeRepositoryWrite.updateIncomeById(incomeId, {
      status: EIncomeStatus.RECEIVED,
      receivedAt: payload.receivedAt || new Date(),
      updatedAt: new Date(),
    });
    this.assertIncomeOwnershipOrNotFound(updatedIncome, userId, incomeId);
    return updatedIncome;
  }

  private assertIncomeOwnershipOrNotFound(
    income: IIncome | null,
    userId: string,
    incomeId: string,
  ): asserts income is IIncome {
    if (!income || income.userId !== userId) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'Income not found',
        details: { incomeId },
      } as IThrowedError;
    }
  }
}
