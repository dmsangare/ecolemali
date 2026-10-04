import { z } from "zod";

export const ExpenseCategoryCreateSchema = z.object({
  schoolId: z.string().uuid().optional(),
  code: z.string().min(2, "Code requis (min. 2 caracteres)").max(50),
  name: z.string().min(2, "Nom requis (min. 2 caracteres)").max(120),
  description: z.string().max(500).optional(),
  emoji: z.string().max(10).optional(),
  isActive: z.boolean().default(true),
});

export const ExpenseCategoryUpdateSchema = ExpenseCategoryCreateSchema.partial();

export type ExpenseCategoryCreateDto = z.infer<typeof ExpenseCategoryCreateSchema>;
export type ExpenseCategoryUpdateDto = z.infer<typeof ExpenseCategoryUpdateSchema>;
