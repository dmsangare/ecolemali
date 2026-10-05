import { z } from "zod";

export const TopStudentsQuerySchema = z.object({
  cycle: z
    .enum(["PREMIER_CYCLE", "DEUXIEME_CYCLE", "LYCEE"])
    .optional(),
  termId: z.string().uuid().optional(),
});

export type TopStudentsQuery = z.infer<typeof TopStudentsQuerySchema>;
