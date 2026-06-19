import '../src/configuration/dotenv';
import mongoose from 'mongoose';
import { DATABASE_URI } from '../src/configuration/env-constants/env.constants';
import { ExpenseModel } from '../src/infraestructure/db/mongo/models/expense.model';
import { dbToInternal } from '../src/infraestructure/repository/expense/adapters/expense.adapter';
import { OpenSearchExpenseIndexRepository } from '../src/infraestructure/repository/search/opensearch-expense-index.repository';
import { toExpenseIndexDocument } from '../src/domain/expense/utils/expense-index-document.utils';
import { RagServiceFactory } from '../src/configuration/factory/rag.service.factory';

async function main(): Promise<void> {
  if (!DATABASE_URI) {
    throw new Error('DATABASE_URI is required');
  }

  await mongoose.connect(DATABASE_URI);

  const expenseIndexRepository = new OpenSearchExpenseIndexRepository();
  const ragService = RagServiceFactory.create();

  await expenseIndexRepository.recreateIndex();

  const expenseDocs = await ExpenseModel.find({});
  const userIds = new Set<string>();

  for (const expenseDoc of expenseDocs) {
    const expense = dbToInternal(expenseDoc);
    userIds.add(expense.userId);
    await expenseIndexRepository.upsert(toExpenseIndexDocument(expense));
    await ragService.syncExpense(expense.userId, expense);
  }

  console.log(`Reindexed ${expenseDocs.length} expenses for ${userIds.size} users.`);
}

main()
  .catch((error) => {
    console.error('Expense reindex failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
