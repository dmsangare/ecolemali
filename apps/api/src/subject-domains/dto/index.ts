import { z } from "zod";

export const SubjectDomainCreateSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  order: z.number().int().min(0).default(0),
});

export const SubjectDomainUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(50).optional(),
  order: z.number().int().min(0).optional(),
});

export type SubjectDomainCreateDto = z.infer<typeof SubjectDomainCreateSchema>;
export type SubjectDomainUpdateDto = z.infer<typeof SubjectDomainUpdateSchema>;
