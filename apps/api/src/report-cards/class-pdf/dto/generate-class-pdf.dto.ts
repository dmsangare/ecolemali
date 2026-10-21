import { z } from 'zod';

export const GenerateClassPdfSchema = z.object({
  academicYearId: z.string().uuid(),
  termId: z.string().uuid().optional(),
  kind: z.enum(['COMPOSITION', 'TRIMESTRIEL', 'ANNUEL']).optional().default('TRIMESTRIEL'),
});

export type GenerateClassPdfDto = z.infer<typeof GenerateClassPdfSchema>;
