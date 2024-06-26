"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categories_1 = __importDefault(require("../controllers/categories"));
const transactions_1 = require("../controllers/transactions");
const user_1 = require("../controllers/user");
const userAuthenticator_1 = __importDefault(require("../middlewares/userAuthenticator"));
const router = (0, express_1.Router)();
router.post("/cadastrar", user_1.createUser);
router.post("/entrar", user_1.signIn);
router.use(userAuthenticator_1.default);
router.patch("/usuario/editar", user_1.updateUser);
router.get("/usuario/detalhar", user_1.detailUser);
router.get("/categorias", categories_1.default);
router.get("/transacao/listar", transactions_1.listTransactions);
router.post("/transacao/cadastrar", transactions_1.createTransaction);
router.get("/transacao/detalhar/:id", transactions_1.detailTransaction);
router.put("/transacao/editar/:id", transactions_1.updateTransaction);
router.delete("/transacao/deletar/:id", transactions_1.deleteTransaction);
router.get("/resumo", transactions_1.getSummary);
exports.default = router;
