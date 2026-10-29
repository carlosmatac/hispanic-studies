import readline from 'node:readline';
import { eq, sql } from 'drizzle-orm';
import { hashPassword, PASSWORD_MIN } from '@/lib/admin/password';
import * as schema from '@/lib/db/schema';
import { openDb, where } from './env.mts';

/* The people who may sign in to /admin.
     npm run user:create -- <name>   create one, or set a new password (asks for it, twice)
     npm run user:list               who can sign in
     npm run user:delete -- <name>   remove one
   The password is typed, never passed as an argument, so it stays out of the
   shell's history. In Git Bash use `winpty npm.cmd run user:create -- <name>`
   (or PowerShell); a password piped on stdin is accepted for scripts. */

const [cmd, name] = process.argv.slice(2);

function ask(question: string, hidden = false): Promise<string> {
  if (!process.stdin.isTTY) {
    // piped: read one line
    return new Promise((ok) => {
      const rl = readline.createInterface({ input: process.stdin });
      rl.once('line', (l) => { rl.close(); ok(l); });
      rl.once('close', () => ok(''));
    });
  }
  return new Promise((ok) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
      out._writeToOutput = (s: string) => { if (s.includes(question)) out.output.write(question); else if (!/[\r\n]/.test(s)) out.output.write('*'); };
    }
    rl.question(question, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); ok(a); });
  });
}

const { db, pool } = openDb();
try {
  if (cmd === 'list') {
    const rows = await db.select().from(schema.users).orderBy(schema.users.username);
    console.log(`Users in ${where()}:`);
    for (const u of rows) console.log(`  ${u.username.padEnd(16)} ${u.displayName.padEnd(20)} last sign-in: ${u.lastLoginAt?.toISOString().slice(0, 16) ?? 'never'}`);
    if (!rows.length) console.log('  (none yet: npm run user:create -- <name>)');
  } else if (cmd === 'create') {
    const username = (name ?? '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,40}$/.test(username)) throw new Error('Give a user name (letters, digits, . _ -): npm run user:create -- beltran');
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    console.log(existing ? `“${username}” exists in ${where()}: setting a new password.` : `Creating “${username}” in ${where()}.`);
    const displayName = existing ? existing.displayName : (await ask('Name to show (e.g. Beltrán Arellanes): ')).trim();
    const pw = await ask(`Password (at least ${PASSWORD_MIN} characters): `, true);
    if (pw.length < PASSWORD_MIN) throw new Error(`Too short: at least ${PASSWORD_MIN} characters.`);
    if (process.stdin.isTTY && (await ask('The same password again: ', true)) !== pw) throw new Error('The two passwords differ. Nothing was changed.');
    const passwordHash = await hashPassword(pw);
    if (existing) {
      await db.update(schema.users).set({ passwordHash, sessionVersion: sql`${schema.users.sessionVersion} + 1`, updatedAt: new Date() }).where(eq(schema.users.id, existing.id));
      console.log('Password changed; any open session of this user is closed.');
    } else {
      await db.insert(schema.users).values({ username, displayName, passwordHash });
      console.log(`Done. “${username}” can sign in at /admin.`);
    }
  } else if (cmd === 'delete') {
    const r = await db.delete(schema.users).where(eq(schema.users.username, (name ?? '').toLowerCase())).returning();
    console.log(r.length ? `Removed “${name}”.` : `No user “${name}”.`);
  } else {
    console.log('Usage: npm run user:create -- <name> | npm run user:list | npm run user:delete -- <name>');
  }
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
