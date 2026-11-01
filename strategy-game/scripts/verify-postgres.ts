import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {postgresPool} from '../apps/server/src/database';
import {openStore} from '../apps/server/src/store';
import {TacticalEngine} from '../packages/game-engine/src/index';
import {SCENARIOS} from '../content/scenarios/index';
const connection = process.env.TEST_DATABASE_URL;
if (!connection || !process.env.TEST_PG_DIRECTORY) throw new Error('Execute pelo verificador local isolado.');
const url = new URL(connection);
if (url.hostname !== '127.0.0.1' || url.username !== 'ace_test' || url.port !== process.env.TEST_PG_PORT) throw new Error('O teste só aceita o cluster temporário local.');
const pool = postgresPool(connection);
const directory = (await pool.query('SHOW data_directory')).rows[0].data_directory as string;
assert.equal(resolve(directory).toLowerCase(), resolve(process.env.TEST_PG_DIRECTORY).toLowerCase());
let store: Awaited<ReturnType<typeof openStore>> | undefined;
try {
  await pool.query("CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);");
  await pool.query(await readFile(new URL('../database/001_game.sql', import.meta.url), 'utf8'));
  const owner = randomUUID(), other = randomUUID();
  await pool.query('INSERT INTO auth.users(id) VALUES ($1),($2)', [owner, other]);
  store = await openStore({path: ':memory:', databaseUrl: connection});
  const guest = await store.authenticate();
  const state = new TacticalEngine('academy', ['Teste', 'Computador'], ['#ddeb78', '#f0a878'], 42, randomUUID(), SCENARIOS[0]);
  for (let step = 0; step < 500 && state.state.phase !== 'POINT_REVIEW'; step++) {
    if (state.state.phase === 'BALL_ANIMATION') state.finishAnimation(Date.now() + 1_000_000);
    else state.apply(state.defaultAction('consistent'), state.state.turn);
  }
  assert.equal(state.state.phase, 'POINT_REVIEW');
  await store.savePoint(state.state, [guest.profile.id, null]);
  await store.saveMatch(state.state, [guest.profile.id, null]);
  const account = await store.authenticateAccount(owner, guest.token);
  assert.equal(account.profile.id, guest.profile.id);
  assert.equal((await store.progress(account.profile.id)).points, 1);
  assert.equal((await store.replay(account.profile.id, state.state.id)).length, 1);
  assert.notEqual((await store.authenticate(guest.token)).profile.id, account.profile.id);
  const nextGuest = await store.authenticate();
  const second = structuredClone(state.state); second.id = randomUUID();
  await store.savePoint(second, [nextGuest.profile.id, null]);
  const merged = await store.authenticateAccount(owner, nextGuest.token);
  assert.equal(merged.profile.id, account.profile.id);
  assert.equal((await store.progress(account.profile.id)).points, 2);
  const stranger = await store.authenticateAccount(other);
  assert.deepEqual(await store.replay(stranger.profile.id, state.state.id), []);
  const permissions = await pool.query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='ace_game'");
  assert.equal(permissions.rowCount, 4); assert.ok(permissions.rows.every(row => row.rowsecurity));
  const client = await pool.connect();
  try {
    await client.query('SET ROLE authenticated');
    await assert.rejects(client.query('SELECT * FROM ace_game.profiles'), {code: '42501'});
  } finally {await client.query('RESET ROLE'); client.release();}
  console.log('PostgreSQL validado: migração, gravação, progresso, replay, vínculo e soma de perfis, token antigo invalidado e isolamento do navegador.');
} finally {await store?.close(); await pool.end();}
