import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const { outcome, income } = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') acc.income += transaction.value;
        else acc.outcome += transaction.value;

        return acc;
      },
      {
        outcome: 0,
        income: 0,
      },
    );

    const total = income - outcome;

    return {
      income,
      outcome,
      total,
    };
  }
}

export default TransactionsRepository;
