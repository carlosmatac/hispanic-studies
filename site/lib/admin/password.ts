import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/* Passwords are stored as scrypt hashes (Node's own crypto, no dependency):
   "scrypt$N$r$p$salt$hash", salt and hash in base64. N = 2^15, r = 8, p = 1 is
   OWASP's recommended minimum; each check takes ~50–100 ms on purpose. */

const N = 2 ** 15, R = 8, P = 1, KEYLEN = 64;

const scrypt = (pw: string, salt: Buffer, keylen: number, opts: ScryptOptions) =>
  new Promise<Buffer>((ok, fail) => scryptCb(pw.normalize('NFKC'), salt, keylen, opts, (e, k) => (e ? fail(e) : ok(k))));

const opts = (n: number, r: number, p: number): ScryptOptions => ({ N: n, r, p, maxmem: 256 * n * r });

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, KEYLEN, opts(N, R, P));
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const want = Buffer.from(hash, 'base64');
  const got = await scrypt(pw, Buffer.from(salt, 'base64'), want.length, opts(+n, +r, +p));
  return got.length === want.length && timingSafeEqual(got, want);
}

/** A hash to compare against when the user does not exist, so the answer takes as long either way. */
let dummy: Promise<string> | null = null;
export const dummyHash = () => (dummy ??= hashPassword(randomBytes(12).toString('hex')));

export const PASSWORD_MIN = 10;
