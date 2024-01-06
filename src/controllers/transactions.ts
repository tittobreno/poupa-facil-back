import { Response } from "express";
import { z } from "zod";
import knex from "../database/dbConnect";
import { CategoryModel } from "../models/categories";
import { TransactionModel } from "../models/transactions";
import { MyReq } from "../types";
import { schemaBodyTransaction } from "../validation/schemaTransactions";

export const listTransactions = async (req: MyReq, res: Response) => {
  const userId = req.userData?.id;
  try {
    const userTransactions: TransactionModel[] = await knex(
      "transactions"
    ).where({
      user_id: userId,
    });

    const listUserTransactions = await Promise.all(
      userTransactions.map(async (transaction) => {
        const category: CategoryModel = await knex("categories")
          .where({ id: transaction.category_id })
          .first();

        const transactionWithCategoryName = {
          ...transaction,
          category_name: category.title,
        };

        return transactionWithCategoryName;
      })
    );

    return res.status(200).json(listUserTransactions);
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
    const id = parseInt(req.params.id);

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
    const id = parseInt(req.params.id);

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
    const id = parseInt(req.params.id);

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
