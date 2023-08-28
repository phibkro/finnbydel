import { z } from "zod";

export const intSchema = z
  .number()
  .int({ message: "Must be an integer" })
  .positive({ message: "Must be positive" });

export const cityIdSchema = intSchema.max(4);

export const varCharSchema = z
  .string()
  .max(255, { message: "Must be 255 or fewer characters long" });

export const addressSchema = z.object({
  cityId: cityIdSchema,
  streetName: varCharSchema,
  houseNumber: intSchema,
});
