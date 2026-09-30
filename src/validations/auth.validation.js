import { z } from 'zod';
import { empty } from './common.js';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(128)
  }),
  params: empty,
  query: empty
});

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(32).max(200) }),
  params: empty,
  query: empty
});
