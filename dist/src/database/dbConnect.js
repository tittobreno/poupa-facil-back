"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const knex_1 = __importDefault(require("knex"));
const port = process.env.DB_PORT;
const knex = (0, knex_1.default)({
    client: "pg",
    connection: {
        host: process.env.DB_HOST,
        port: port,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    },
});
exports.default = knex;
