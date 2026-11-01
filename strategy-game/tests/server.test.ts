import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import { createGameServer } from '../apps/server/src/server';
import { type Ack, type RoomView } from '../packages/shared/src/index';
type Client = {socket: Socket; token: string; room: RoomView | null};
let server: Awaited<ReturnType<typeof createGameServer>>, url: string, clients: Client[];
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function until(test: () => boolean, timeout = 7000) {const start = Date.now(); while (!test()) {if (Date.now() - start > timeout) throw new Error('Timeout esperando estado do servidor.'); await sleep(15);}}
async function connect(auth: Record<string, string> = {}) {
  const socket = io(url, {autoConnect: false, transports: ['websocket'], auth}), client: Client = {socket, token: '', room: null};
  for (const event of ['match:state', 'point:resolved', 'match:finished', 'player:disconnected', 'player:reconnected']) socket.on(event, (r: RoomView) => client.room = r);
  const session = new Promise<void>(resolve => socket.on('session', data => {client.token = data.token; resolve();}));
  socket.connect(); await session; clients.push(client); return client;
}
const call = <T = any>(c: Client, event: string, data: unknown = {}): Promise<Ack<T>> => c.socket.timeout(5000).emitWithAck(event, data);
async function pair(seconds: 3 | 5 | 8 = 8) {
  const a = await connect(), b = await connect();
  const created = await call(a, 'room:create', {mode: 'duel', seconds, botStyle: 'consistent'});
  expect(created.ok).toBe(true);
  const joined = await call(b, 'room:join', {code: created.data.room.code}); expect(joined.ok).toBe(true);
  await call(b, 'room:ready', {ready: true}); expect((await call(a, 'match:start')).ok).toBe(true);
  await until(() => !!a.room?.state && !!b.room?.state); return {a, b, created, joined};
}
beforeEach(async () => {clients = []; server = await createGameServer({database: ':memory:', animationScale: .001, botDelay: 10}); await new Promise<void>(r => server.http.listen(0, '127.0.0.1', r)); url = `http://127.0.0.1:${(server.http.address() as any).port}`;});
afterEach(async () => {clients.forEach(c => c.socket.disconnect()); await server.close();});
describe('Servidor autoritativo e salas Socket.IO', () => {
  it('não armazena HTML ou versão em cache e não retorna HTML para um módulo antigo', async () => {
    const health = await fetch(`${url}/api/health`);
    expect(health.headers.get('cache-control')).toBe('no-store');
    expect(typeof (await health.json()).buildId).toBe('string');
    const html = await fetch(url);
    expect(html.status).toBe(200); expect(html.headers.get('cache-control')).toBe('no-store');
    const missing = await fetch(`${url}/assets/old-game-version.js`);
    expect(missing.status).toBe(404); expect(missing.headers.get('content-type')).not.toContain('text/html');
  });
  it('sincroniza dois clientes e rejeita adversário, posição inválida, placar e duplicata', async () => {
    const {a,b} = await pair(); const s = b.room!.state!;
    const action = {id: 'position', turnId: s.turnId, target: {x: -2, y: -13}};
    expect((await call(a, 'receiver:position', action)).ok).toBe(false);
    expect((await call(b, 'receiver:position', {...action, target: {x: 0,y: 12}})).ok).toBe(false);
    expect((await call(b, 'receiver:position', {...action, score: [7,0]})).ok).toBe(false);
    expect((await call(b, 'receiver:position', action)).ok).toBe(true);
    expect((await call(b, 'receiver:position', action)).ok).toBe(false);
    await until(() => a.room?.state?.phase === 'SERVE_DECISION');
    await until(() => b.room?.state?.revision === a.room?.state?.revision);
    expect(a.room!.state).toEqual(b.room!.state); expect(a.room!.me).toBe(0); expect(b.room!.me).toBe(1);
    expect(a.room!.state!.score).toEqual([0,0]);
  });
  it('resolve um tie-break completo com saques e estados consistentes', async () => {
    const {a,b} = await pair(); let actions = 0;
    while (server.rooms.get(a.room!.code)!.engine!.state.phase !== 'MATCH_FINISHED' && actions < 1000) {
      const room = server.rooms.get(a.room!.code)!; const e = room.engine!, s = e.state;
      if (s.phase === 'BALL_ANIMATION') {await sleep(60); continue;}
      actions++;
      if (s.phase === 'POINT_REVIEW') await call(a, 'point:next');
      else {const c = s.turn === 0 ? a : b; const event = s.phase === 'RECEIVER_POSITION' ? 'receiver:position' : s.phase === 'SERVE_DECISION' ? 'serve:commit' : 'shot:commit'; const action = e.defaultAction('consistent'); const ack = await call(c, event, action); expect(ack.ok, ack.error).toBe(true);}
      await sleep(10);
    }
    expect(actions).toBeLessThan(1000); await until(() => a.room?.state?.phase === 'MATCH_FINISHED' && b.room?.state?.phase === 'MATCH_FINISHED');
    expect(a.room!.state!.score).toEqual(b.room!.state!.score); expect(Math.max(...a.room!.state!.score)).toBeGreaterThanOrEqual(7);
    const p = await call(a, 'progress:get'); expect(p.data.matches).toBe(1); expect(p.data.points).toBe(a.room!.state!.points.length);
    const replay = await call(a, 'replay:get', {id: a.room!.state!.id}); expect(replay.data.length).toBeGreaterThan(6);
  }, 60000);
  it('cronômetro do servidor aplica ação automática e só inicia depois da animação', async () => {
    const {a,b} = await pair(3); const room = server.rooms.get(a.room!.code)!, e = room.engine!;
    expect(e.state.deadline).toBeGreaterThan(Date.now());
    // Avança somente o relógio autoritativo, sem esperar 3 segundos em todos os testes.
    e.state.deadline = Date.now() - 1;
    await until(() => e.state.phase === 'SERVE_DECISION'); expect(e.state.deadline).toBeGreaterThan(Date.now());
    e.state.deadline = Date.now() - 1;
    await until(() => e.state.decisions.length > 0); expect(e.state.decisions[0].automatic).toBe(true);
    expect(e.state.decisions[0].shotIQ).toBeLessThan(90);
  });
  it('reconecta com sessão válida, mantém dois jogadores e o placar', async () => {
    const {a,b,joined} = await pair(); const code = a.room!.code, score = structuredClone(a.room!.state!.score), oldDeadline = a.room!.state!.deadline!;
    b.socket.disconnect(); await until(() => !!a.room?.paused); expect(a.room!.reconnectUntil).toBeGreaterThan(Date.now());
    const blocked = await call(a, 'serve:commit', {id: 'fake', turnId: a.room!.state!.turnId, target: {x:0,y:13}, shot:'serve-t'}); expect(blocked.ok).toBe(false);
    await sleep(80); const reconnected = await connect({profileToken:b.token, roomCode:code, roomToken:joined.data.token});
    await until(() => !!reconnected.room && !a.room?.paused);
    expect(reconnected.room!.me).toBe(1); expect(reconnected.room!.members.length).toBe(2); expect(reconnected.room!.state!.score).toEqual(score);
    expect(reconnected.room!.state!.deadline!).toBeGreaterThan(oldDeadline);
  });
  it('rejeita terceiro jogador e token de outra pessoa', async () => {
    const {a,joined} = await pair(), outsider = await connect();
    expect((await call(outsider, 'room:join', {code:a.room!.code})).ok).toBe(false);
    expect((await call(outsider, 'room:resume', {code:a.room!.code,token:joined.data.token})).ok).toBe(false);
  });
  it('encerra prazo de reconexão e permite fechar sala', async () => {
    const {a,b} = await pair(); b.socket.disconnect(); await until(() => !!a.room?.paused);
    server.rooms.get(a.room!.code)!.reconnectUntil = Date.now() - 1;
    await until(() => !!a.room?.canAbandon); expect((await call(a, 'match:abandon')).ok).toBe(true); expect(server.rooms.size).toBe(0);
  });
  it('valida perfil e calcula progresso só com decisões de sessões reais', async () => {
    const c = await connect(); expect((await call(c, 'profile:update', {nickname:'Nina',audience:'child',level:'study',color:'#86c9ef'})).ok).toBe(true);
    const fresh = await call(c, 'progress:get'); expect(fresh.data.shotIQ).toBeNull(); expect(fresh.data.points).toBe(0);
    expect((await call(c, 'room:create', {mode:'academy',seconds:0,scenarioId:'bola-curta',botStyle:'consistent'})).ok).toBe(true);
    let steps = 0; while (c.room?.state?.phase !== 'POINT_REVIEW' && steps++ < 120) {
      const e = server.rooms.get(c.room!.code)!.engine!;
      if (e.state.turn === 0 && ['SHOT_DECISION','SERVE_DECISION','RECEIVER_POSITION'].includes(e.state.phase)) {
        const event = e.state.phase === 'SHOT_DECISION' ? 'shot:commit' : e.state.phase === 'SERVE_DECISION' ? 'serve:commit' : 'receiver:position';
        await call(c,event,e.defaultAction());
      }
      await sleep(25);
    }
    const p = await call(c,'progress:get'); expect(p.data.profile.nickname).toBe('Nina'); expect(p.data.points).toBe(1); expect(p.data.shotIQ).not.toBeNull();
    const again = await connect({profileToken:c.token}); const restored = await call(again,'progress:get'); expect(restored.data).toEqual(p.data);
  });
  it('oferece e aceita voleio após subida à rede pela mesma conexão Socket.IO', async () => {
    const c = await connect();
    expect((await call(c, 'room:create', {mode:'academy',seconds:0,scenarioId:'aproximacao',botStyle:'consistent'})).ok).toBe(true);
    const e = server.rooms.get(c.room!.code)!.engine!; e.state.seed = 42;
    expect((await call(c, 'shot:commit', {id:'approach-net',turnId:e.state.turnId,shot:'cross',target:{x:1,y:3.6}})).ok).toBe(true);
    await until(() => c.room?.state?.phase === 'SHOT_DECISION' && c.room.state.turn === 0 && c.room.state.ball?.contactType === 'volley');
    expect(c.room!.state!.options).toContain('volley-block');
    const ack = await call(c,'shot:commit',{id:'volley-commit',turnId:c.room!.state!.turnId,shot:'volley-block',target:{x:0,y:3.1}});
    expect(ack.ok, ack.error).toBe(true);
    await until(() => !!c.room?.state?.decisions.some(d => d.id === 'volley-commit'));
    const decision = c.room!.state!.decisions.find(d => d.id === 'volley-commit')!;
    expect(decision.shot).toBe('volley-block'); expect(decision.explanation).toContain('antes do quique');
  });
});
