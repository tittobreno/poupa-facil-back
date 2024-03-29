import express from "express";
import router from "./routes/routes";
import cors from "cors";
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(router);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}!`);
});
