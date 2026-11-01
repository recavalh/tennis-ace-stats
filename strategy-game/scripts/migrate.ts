import {readFile} from 'node:fs/promises';
import {postgresPool} from '../apps/server/src/database';
if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no ambiente do servidor.');
const pool = postgresPool(process.env.DATABASE_URL);
try {
  await pool.query(await readFile(new URL('../database/001_game.sql', import.meta.url), 'utf8'));
  console.log('Estrutura privada do jogo preparada no PostgreSQL.');
} finally {await pool.end();}
