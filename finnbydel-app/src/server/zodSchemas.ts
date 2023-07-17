import { z } from "zod";

export const intSchema = z
  .number()
  .int({ message: "Must be an integer" })
  .positive({ message: "Must be positive" })
  .max(1000, { message: "Must be less than 1000" });

export const varCharSchema = z
  .string()
  .max(255, { message: "Must be 255 or fewer characters long" });

export const addressSchema = z.object({
  cityId: intSchema,
  streetName: varCharSchema,
  houseNumber: intSchema,
});
