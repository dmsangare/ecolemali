import { z } from 'zod';
import { LoginSchema, ChangePasswordSchema } from '@sis-mali/shared';

export type LoginDto = z.infer<typeof LoginSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
export { LoginSchema, ChangePasswordSchema };