import { Response, Request } from "express";
import { z } from "zod";
import knex from "../database/dbConnect";
import { CategoryModel } from "../models/categories";
import { TransactionModel } from "../models/transactions";
import { MyReq } from "../../@types";
import { schemaBodyTransaction } from "../validation/schemaTransactions";

const paginationParamsSchema = z.object({
  skip: z.number(),
  take: z.number(),
});

export const listTransactions = async (req: MyReq, res: Response) => {
  const userId = req.userData?.id;

  const skip = parseInt(req.query.skip as string, 10);
  const take = parseInt(req.query.take as string, 10);
  let categoryIds: number[] = [];
  if (typeof req.query.categories === "string") {
    categoryIds = req.query.categories
      .split(",")
      .map((categoryId) => parseInt(categoryId, 10));
  } else if (Array.isArray(req.query.categories)) {
    categoryIds = req.query.categories.map((categoryId) =>
      parseInt(categoryId as string, 10)
    );
  }
  const { skip: validatedSkip, take: validatedTake } =
    paginationParamsSchema.parse({ skip, take });

  try {
    let transactionsQuery = knex("transactions").where({
      user_id: userId,
    });

    if (categoryIds.length > 0) {
      transactionsQuery = transactionsQuery.whereIn("category_id", categoryIds);
    }

    const totalTransactionsCount = await transactionsQuery
      .clone()
      .count("id as count")
      .first();

    const totalCount = totalTransactionsCount?.count
      ? Number(totalTransactionsCount.count)
      : 0;

    const userTransactions: TransactionModel[] = await transactionsQuery
      .clone()
      .offset(validatedSkip)
      .limit(validatedTake);

    const listUserTransactions = await Promise.all(
      userTransactions.map(async (transaction) => {
        const category: CategoryModel = await knex("categories")
          .where({ id: transaction.category_id })
          .first();

        const transactionWithCategoryName = {
          ...transaction,
          category_name: category?.title || "Uncategorized", // Definindo um nome padrão caso a categoria não seja encontrada
        };

        return transactionWithCategoryName;
      })
    );

    return res.status(200).json({ total: totalCount, listUserTransactions });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to list transactions: " + error.message });
  }
};

export const createTransaction = async (req: MyReq, res: Response) => {
  const userId = req.userData?.id;

  try {
    const { description, value, type, date, category_id } =
      schemaBodyTransaction.parse(req.body);

    if (type != "output" && type != "entry") {
      return res.status(400).json({ message: "Invalid transaction type" });
    }
    const authenticateCategory: CategoryModel = await knex("categories")
      .where({
        id: category_id,
      })
      .first();

    if (!authenticateCategory) {
      return res
        .status(400)
        .json({ message: "The category specified not found" });
    }

    const newTransaction: TransactionModel[] = await knex("transactions")
      .insert({
        description,
        value,
        type,
        date,
        user_id: userId,
        category_id: authenticateCategory.id,
      })
      .returning("*");

    return res.status(201).json(newTransaction);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(500).json(error.errors);
    }
    return res
      .status(500)
      .json({ message: "Failed to create transaction: " + error.message });
  }
};

export const detailTransaction = async (req: MyReq, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    const transaction: TransactionModel = await knex("transactions")
      .where({ id })
      .first();

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res
      .status(200)
      .json({ ...transaction, value: transaction.value / 100 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(500).json(error.errors);
    }

    return res
      .status(500)
      .json({ message: "Failed to detail transaction: " + error.message });
  }
};

export const updateTransaction = async (req: MyReq, res: Response) => {
  const userId = req.userData?.id;
  try {
    const id = parseInt(req.params.id as string);

    const { description, value, type, date, category_id } =
      schemaBodyTransaction.parse(req.body);

    const transaction: TransactionModel = await knex("transactions")
      .where({ id })
      .first();

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await knex("transactions")
      .update({ description, value, type, date, category_id, user_id: userId })
      .where({ id });

    return res.status(200).json({ message: "Updated successfully" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }

    return res
      .status(500)
      .json({ message: "Failed to update transaction: " + error.message });
  }
};

export const deleteTransaction = async (req: MyReq, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    const transaction = await knex("transactions").where({ id }).first();

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await knex("transactions").delete().where({ id });

    return res.status(204).json();
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to delete transaction: " + error.message });
  }
};

export const getSummary = async (req: MyReq, res: Response) => {
  try {
    const id = req.userData?.id;

    const earnings = await knex("transactions")
      .sum({ totalEarnings: "value" })
      .where({ user_id: id })
      .andWhere({ type: "entry" })
      .first();

    const expenses = await knex("transactions")
      .sum({ totalExpenses: "value" })
      .where({ user_id: id })
      .andWhere({ type: "output" })
      .first();

    const response = {
      earnings: Number(earnings?.totalEarnings) || 0,
      expenses: Number(expenses?.totalExpenses) || 0,
      balance: earnings?.totalEarnings - expenses?.totalExpenses,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to get summary: " + error.message });
  }
};
