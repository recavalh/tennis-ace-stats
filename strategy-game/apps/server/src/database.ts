import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import pg from 'pg';

export type Row = Record<string, unknown>;
export interface Database {
  readonly postgres: boolean;
  all(sql: string, params?: unknown[]): Promise<Row[]>;
  run(sql: string, params?: unknown[]): Promise<void>;
  transaction<T>(work: (db: Database) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export function sqliteDatabase(path: string): Database {
  if (path !== ':memory:') mkdirSync(dirname(path), {recursive: true});
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  db.exec([
    'CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, body TEXT NOT NULL, user_id TEXT UNIQUE)',
    'CREATE TABLE IF NOT EXISTS points (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, scenario TEXT, mode TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)',
    'CREATE TABLE IF NOT EXISTS matches (id TEXT NOT NULL, profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(id,profile_id))',
    'CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, match_id TEXT NOT NULL, kind TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)',
  ].join(';'));
  if (!db.prepare('PRAGMA table_info(profiles)').all().some(row => row.name === 'user_id')) db.exec('ALTER TABLE profiles ADD COLUMN user_id TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id); CREATE INDEX IF NOT EXISTS points_profile_created_idx ON points(profile_id,created_at DESC); CREATE INDEX IF NOT EXISTS matches_profile_created_idx ON matches(profile_id,created_at DESC);');
  let queue: Promise<unknown> = Promise.resolve();
  const exclusive = <T>(work: () => T | Promise<T>): Promise<T> => {
    const result = queue.then(work);
    queue = result.catch(() => {});
    return result;
  };
  const direct: Database = {
    postgres: false,
    async all(sql, params = []) {return db.prepare(sql).all(...params as (string | number | null)[]) as Row[];},
    async run(sql, params = []) {db.prepare(sql).run(...params as (string | number | null)[]);},
    async transaction(work) {return work(direct);},
    async close() {db.close();},
  };
  return {
    postgres: false,
    all: (sql, params) => exclusive(() => direct.all(sql, params)),
    run: (sql, params) => exclusive(() => direct.run(sql, params)),
    transaction: work => exclusive(async () => {
      db.exec('BEGIN IMMEDIATE');
      try {const result = await work(direct); db.exec('COMMIT'); return result;}
      catch (error) {db.exec('ROLLBACK'); throw error;}
    }),
    close: () => exclusive(() => direct.close()),
  };
}

export function postgresPool(connectionString: string) {
  const url = new URL(connectionString);
  // Always verify TLS, even if the copied connection string contains sslmode=require.
  for (const name of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(name);
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
  const pool = new pg.Pool({
    connectionString: url.toString(),
    max: 4,
    connectionTimeoutMillis: 12_000,
    idleTimeoutMillis: 30_000,
    ssl: local ? false : {rejectUnauthorized: true, ...(process.env.DATABASE_CA_CERT ? {ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n')} : {})},
  });
  pool.on('error', () => console.error('A conexão ociosa com o banco foi encerrada; a próxima operação tentará reconectar.'));
  return pool;
}

export async function postgresDatabase(connectionString: string): Promise<Database> {
  const pool = postgresPool(connectionString);
  const translate = (sql: string) => {
    let parameter = 0;
    return sql.replace(/\?/g, () => '$' + (++parameter)).replace(/\b(profiles|points|matches|events)\b/g, '"ace_game"."$1"');
  };
  const adapter = (query: (sql: string, params: unknown[]) => Promise<pg.QueryResult>): Database => ({
    postgres: true,
    async all(sql, params = []) {return (await query(translate(sql), params)).rows as Row[];},
    async run(sql, params = []) {await query(translate(sql), params);},
    async transaction(work) {return work(adapter(query));},
    async close() {},
  });
  const database = adapter((sql, params) => pool.query(sql, params));
  try {await database.all('SELECT id FROM profiles LIMIT 1');}
  catch (error) {await pool.end(); throw error;}
  return {
    ...database,
    async transaction(work) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await work(adapter((sql, params) => client.query(sql, params)));
        await client.query('COMMIT');
        return result;
      } catch (error) {await client.query('ROLLBACK'); throw error;}
      finally {client.release();}
    },
    async close() {await pool.end();},
  };
}
