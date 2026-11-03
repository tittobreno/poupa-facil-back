import z from "zod";
import { requiredError } from "./requiredError";

export const schemaBodyTransaction = z.object({
  description: z.string(requiredError("Description is required")),
  value: z.number(requiredError("Value is required")),
  type: z.string(requiredError("Type is required")),
  date: z.string(requiredError("Date is required")),
  category_id: z.number(requiredError("Category id is required")),
});
