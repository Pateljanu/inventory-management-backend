// Creates the OWNER account, or resets its password if the email already exists.
//
// Usage:
//   node scripts/create-owner.js owner@example.com "Strong-Password-123" [--name "Full Name"]
// To keep the password out of shell history, set it in the environment instead:
//   OWNER_PASSWORD="..." node scripts/create-owner.js owner@example.com
import argon2 from 'argon2';
import { z } from 'zod';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { ROLES } from '../src/constants/roles.js';

const args = process.argv.slice(2);
const nameFlag = args.indexOf('--name');
const name = nameFlag >= 0 ? args[nameFlag + 1] : undefined;
const positional = args.filter((_, i) => nameFlag < 0 || (i !== nameFlag && i !== nameFlag + 1));
const [email, passwordArg] = positional;
const password = passwordArg ?? process.env.OWNER_PASSWORD;

const input = z
  .object({
    email: z.string().email('A valid email is required'),
    password: z
      .string({ required_error: 'Password is required (argument or OWNER_PASSWORD)' })
      .min(12, 'Password must be at least 12 characters')
      .max(128, 'Password must be at most 128 characters')
  })
  .safeParse({ email, password });

if (!input.success) {
  for (const issue of input.error.issues) console.error(`- ${issue.message}`);
  console.error('Usage: node scripts/create-owner.js owner@example.com "Strong-Password-123" [--name "Full Name"]');
  process.exit(1);
}

let exitCode = 0;
try {
  await connectDatabase();
  const normalizedEmail = input.data.email.toLowerCase().trim();
  const passwordHash = await argon2.hash(input.data.password, { type: argon2.argon2id });
  const result = await User.updateOne(
    { email: normalizedEmail },
    { $set: { email: normalizedEmail, passwordHash, role: ROLES.OWNER, isActive: true, ...(name ? { name } : {}) } },
    { upsert: true }
  );
  console.log(
    result.upsertedCount ? `Owner created: ${normalizedEmail}` : `Owner updated (password reset): ${normalizedEmail}`
  );
} catch (err) {
  console.error('Failed to create owner:', err.message);
  exitCode = 1;
} finally {
  await disconnectDatabase().catch(() => {});
}
process.exit(exitCode);
