import bcrypt from "bcrypt";
import "dotenv/config";
import { Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import z from "zod";
import knex from "../database/dbConnect";
import { UserModel } from "../models/user";
import { MyReq, TokenPayload } from "../../@types";
import {
  createUserBody,
  editPasswordBody,
  editUserAvatar,
  editUserBody,
  signInBody,
} from "../validation/schemaUser";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = createUserBody.parse(req.body);

    const checkEmailExists = await knex("users").where({ email }).first();

    if (checkEmailExists) {
      return res
        .status(400)
        .json({ message: "The email provided already exists" });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    await knex("users").insert({
      name,
      email,
      password: encryptedPassword,
      created_at: new Date(),
    });

    return res.status(201).json();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(500).json({ message: error });
    }

    return res
      .status(500)
      .json({ message: "Failed to create user: " + error.message });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, currentPassword } = signInBody.parse(req.body);

    const user: UserModel = await knex("users").where({ email }).first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const checkIfPasswordIsCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!checkIfPasswordIsCorrect) {
      return res
        .status(401)
        .send({ message: "Email and/or password is incorrect" });
    }

    const createTokenData: TokenPayload = {
      id: user.id,
      name: user.name,
    };

    const token = jwt.sign(
      createTokenData,
      process.env.PASSWORD_JWT as Secret,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({ token });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(500).json({ message: error });
    }

    return res
      .status(500)
      .json({ message: "Failed when trying to login: " + error.message });
  }
};

export const updateUser = async (req: MyReq, res: Response) => {
  const idUser = req.userData?.id;
  const data: UserModel = req.body;

  try {
    let { newPassword, currentPassword } = editPasswordBody.parse(data);
    let { name, email } = editUserBody.parse(data);
    let { avatar } = editUserAvatar.parse(data);

    if (avatar) {
      await knex("users").update({ avatar }).where({ id: idUser });
      return res.status(200).json();
    }

    if (name || email) {
      if (name) {
        await knex("users").update({ name }).where({ id: idUser });
        return res.status(200).json();
      }

      if (email) {
        const checkEmail = await knex("users")
          .whereNot({ id: idUser })
          .andWhere({ email })
          .first();
        if (checkEmail) {
          return res
            .status(401)
            .json({ message: "The email provided already exists" });
        }
        await knex("users").update({ email }).where({ id: idUser });
      }
    }

    if (newPassword && currentPassword) {
      const userPassword = await knex("users")
        .select("password")
        .where({ id: idUser })
        .first();

      const checkPassword = await bcrypt.compare(
        currentPassword,
        userPassword.password
      );

      if (checkPassword) {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        await knex("users")
          .update({ password: encryptedPassword })
          .where({ id: idUser });

        return res.status(200).json();
      } else {
        return res.status(401).json({
          message: "Failed when trying to update password: Unauthorized",
        });
      }
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(401).json(error.issues);
    }

    return res
      .status(500)
      .json({ message: "Failed when trying to update user: " + error.message });
  }
};

export const detailUser = async (req: MyReq, res: Response) => {
  const idUser = req.userData?.id;
  try {
    const user = await knex("users").where({ id: idUser }).first();

    const { password, ...dataUser } = user;

    return res.status(200).json(dataUser);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to trying to detail user: " + error.message });
  }
};
