import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {io, type Socket} from 'socket.io-client';
import {openStore, type Store} from '../apps/server/src/store';
import {createGameServer} from '../apps/server/src/server';
import {TacticalEngine} from '../packages/game-engine/src/index';
import {SCENARIOS} from '../content/scenarios/index';
import type {Profile} from '../packages/shared/src/index';

let store: Store;
beforeEach(async () => {store = await openStore({path: ':memory:'});});
afterEach(async () => {await store.close();});
function completedPractice() {
  const engine = new TacticalEngine('academy', ['Jogador', 'Computador'], ['#ddeb78', '#f0a878'], 42, randomUUID(), SCENARIOS[0]);
  for (let step = 0; step < 500 && engine.state.phase !== 'POINT_REVIEW'; step++) {
    if (engine.state.phase === 'BALL_ANIMATION') engine.finishAnimation(Date.now() + 1_000_000);
    else engine.apply(engine.defaultAction('consistent'), engine.state.turn);
  }
  expect(engine.state.phase).toBe('POINT_REVIEW');
  return structuredClone(engine.state);
}
describe('Progresso privado e vínculo com a conta', () => {
  it('leva um treino do visitante para a conta e invalida o token antigo', async () => {
    const guest = await store.authenticate();
    await store.update({...guest.profile, nickname: 'Nina'});
    const state = completedPractice();
    await store.savePoint(state, [guest.profile.id, null]);
    await store.saveMatch(state, [guest.profile.id, null]);
    const userId = randomUUID();
    const account = await store.authenticateAccount(userId, guest.token);
    expect(account.profile.nickname).toBe('Nina');
    expect(account.profile.id).toBe(guest.profile.id);
    expect((await store.progress(account.profile.id)).points).toBe(1);
    expect((await store.replay(account.profile.id, state.id))).toHaveLength(1);
    expect((await store.authenticate(guest.token)).profile.id).not.toBe(account.profile.id);
    expect((await store.authenticateAccount(userId)).profile.id).toBe(account.profile.id);
  });
  it('soma o progresso de um novo navegador sem apagar a conta existente nem duplicar a migração', async () => {
    const userId = randomUUID(), account = await store.authenticateAccount(userId);
    await store.update({...account.profile, nickname: 'Renato'});
    const first = completedPractice();
    await store.savePoint(first, [account.profile.id, null]);
    const guest = await store.authenticate(), second = completedPractice();
    await store.savePoint(second, [guest.profile.id, null]);
    const merged = await store.authenticateAccount(userId, guest.token);
    expect(merged.profile.id).toBe(account.profile.id);
    expect(merged.profile.nickname).toBe('Renato');
    expect((await store.progress(account.profile.id)).points).toBe(2);
    await store.authenticateAccount(userId, guest.token);
    expect((await store.progress(account.profile.id)).points).toBe(2);
    const another = await store.authenticateAccount(randomUUID());
    expect(await store.replay(another.profile.id, first.id)).toEqual([]);
  });
  it('mantém identidades separadas ao receber um token de visitante já vinculado', async () => {
    const guest = await store.authenticate();
    const owner = await store.authenticateAccount(randomUUID(), guest.token);
    const stranger = await store.authenticateAccount(randomUUID(), guest.token);
    expect(stranger.profile.id).not.toBe(owner.profile.id);
  });
});

describe('Autenticação do servidor de jogo', () => {
  it('rejeita uma sessão inválida e desconecta o acesso antigo de visitante após o vínculo', async () => {
    const userId = randomUUID(), sockets: Socket[] = [];
    const server = await createGameServer({database: ':memory:', verifyIdentity: async token => {
      if (token !== 'verified-test-session') throw new Error('Invalid session');
      return {id: userId, email: 'jogador@example.test'};
    }});
    await new Promise<void>(resolve => server.http.listen(0, '127.0.0.1', resolve));
    const url = 'http://127.0.0.1:' + (server.http.address() as {port: number}).port;
    function connect(auth: Record<string, string>) {
      const socket = io(url, {autoConnect: false, reconnection: false, transports: ['websocket'], auth});
      sockets.push(socket);
      const session = new Promise<{profile: Profile; token?: string; account?: {id: string}}>((resolve, reject) => {
        socket.once('session', resolve); socket.once('connect_error', reject);
      });
      socket.connect();
      return {socket, session};
    }
    try {
      await expect(connect({accessToken: 'invalid'}).session).rejects.toThrow('Não foi possível entrar');
      const guest = connect({}), guestSession = await guest.session;
      const disconnected = new Promise<void>(resolve => guest.socket.once('disconnect', () => resolve()));
      const account = await connect({accessToken: 'verified-test-session', profileToken: guestSession.token!}).session;
      await disconnected;
      expect(account.profile.id).toBe(guestSession.profile.id);
      expect(account.account?.id).toBe(userId);
      expect(account.token).toBeUndefined();
      const recovered = await connect({accessToken: 'verified-test-session'}).session;
      expect(recovered.profile.id).toBe(account.profile.id);
      const retired = await connect({profileToken: guestSession.token!}).session;
      expect(retired.profile.id).not.toBe(account.profile.id);
    } finally {sockets.forEach(socket => socket.disconnect()); await server.close();}
  });
});
