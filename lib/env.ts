import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_BOKAT_URL: z.string().url().optional(),
  DEFAULT_GOALKEEPER_A: z.string().optional(),
  DEFAULT_GOALKEEPER_B: z.string().optional(),
});

export const env = envSchema.parse(process.env);
