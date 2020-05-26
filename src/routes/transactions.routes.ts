import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository } from 'typeorm';
import uploadConfig from '../config/upload';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import AppError from '../errors/AppError';

const transactionsRouter = Router();

const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const { month = currentMonth } = request.query;
    const queryMonth = month || currentMonth;

    const startDate = new Date(`2020-${queryMonth}-01`);
    const endDate = new Date(2020, Number(queryMonth), 0);

    const transactionRepository = getCustomRepository(TransactionsRepository);
    const transactions = await transactionRepository
      .createQueryBuilder('t')
      .orderBy('t.created_at', 'DESC')
      .innerJoinAndSelect('t.category', 'category')
      .andWhere(
        `t.created_at BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'`,
      )
      .getMany();

    const balance = await transactionRepository.getBalance();

    return response.json({ transactions, balance });
  } catch (error) {
    console.log(error);
    throw new AppError(
      'Não foi possível buscar as transações. Tente mais tarde.',
    );
  }
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category: categoryTitle } = request.body;
  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    categoryTitle,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute(id);

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransaction = new ImportTransactionsService();

    const fileName = request.file.filename;

    const transactions = await importTransaction.execute(fileName);

    return response.json(transactions);
  },
);

export default transactionsRouter;
