import express from 'express';
import { createServer } from 'node:http';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { Server, type Socket } from 'socket.io';
import { z } from 'zod';
import { actionSchema, profileSchema, roomSchema, type Ack, type BotStyle, type Mode, type PlayerId, type RoomView } from '../../../packages/shared/src/index';
import { TacticalEngine } from '../../../packages/game-engine/src/index';
import { SCENARIOS } from '../../../content/scenarios/index';
import { openStore } from './store';
import {authConfiguration, identityVerifier, type IdentityVerifier, type PublicAuthConfig} from './auth';
type Member = {profileId: string | null; token: string; socketId: string | null; name: string; color: string; ready: boolean; bot: boolean};
type Room = { code: string; mode: Mode; seconds: number; botStyle: BotStyle; members: Member[]; engine: TacticalEngine | null; paused: boolean; reconnectUntil: number | null; pausedAt: number; canAbandon: boolean; due: number; version: number; scenarioId?: string; lastActive: number; pendingSave?: boolean; saving?: Promise<void>; saveRetryAt?: number };
export async function createGameServer(options: { database?: string; databaseUrl?: string; dev?: boolean; animationScale?: number; botDelay?: number; verifyIdentity?: IdentityVerifier; authConfig?: PublicAuthConfig; allowedOrigins?: string[] } = {}) {
  const app = express(), http = createServer(app), store = await openStore({path: options.database ?? resolve('data/tennis.sqlite'), databaseUrl: options.database ? undefined : options.databaseUrl ?? process.env.DATABASE_URL});
  const authConfig = options.authConfig ?? authConfiguration();
  const verifyIdentity = options.verifyIdentity ?? identityVerifier(authConfig);
  const allowedOrigins = new Set(options.allowedOrigins ?? (process.env.APP_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean));
  const allowed = (origin: string | undefined, host?: string) => {if (!origin) return true; if (allowedOrigins.has(origin)) return true; try {return new URL(origin).host === host;} catch {return false;}};
  let buildId = 'development';
  if (!options.dev) {try {buildId = JSON.parse(readFileSync(resolve('dist/client/build-info.json'), 'utf8')).buildId;} catch { /* Antes do primeiro build, os testes ainda podem criar o servidor. */ }}
  const rooms = new Map<string, Room>(), limits = new Map<string, {count: number; reset: number}>();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin'); res.setHeader('X-Frame-Options', 'DENY'); next();});
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowed(origin, req.headers.host)) {res.setHeader('Access-Control-Allow-Origin', origin); res.vary('Origin');}
    next();
  });
  const io = new Server(http, {maxHttpBufferSize: 16_384, cors: {origin: (origin, done) => done(null, !origin || allowedOrigins.has(origin))}, allowRequest: (req, done) => done(null, allowed(req.headers.origin, req.headers.host))});
  io.use(async (socket, next) => {
    try {
      rate(socket, 'connect', 120);
      const input = socket.handshake.auth;
      const guestToken = typeof input.profileToken === 'string' ? input.profileToken : undefined;
      if (input.accessToken !== undefined && typeof input.accessToken !== 'string') throw new Error('Sessão inválida.');
      if (input.accessToken) {
        const account = await verifyIdentity(input.accessToken);
        if (account.expiresAt && account.expiresAt <= Date.now()) throw new Error('Sua sessão expirou.');
        socket.data.expiresAt = account.expiresAt;
        const linked = await store.authenticateAccount(account.id, guestToken);
        if (linked.retiredGuestProfileId) for (const previous of io.sockets.sockets.values()) if (!previous.data.session?.account && previous.data.profileId === linked.retiredGuestProfileId) previous.disconnect(true);
        socket.data.session = {profile: linked.profile, account};
      } else socket.data.session = await store.authenticate(guestToken);
      socket.data.profileId = socket.data.session.profile.id;
      next();
    } catch {next(new Error('Não foi possível entrar. Confira sua conexão ou entre novamente com Google.'));}
  });
  function rate(socket: Socket, category: string, max = 80) {
    const key = `${socket.handshake.address}:${category}`, now = Date.now();
    let value = limits.get(key); if (!value || value.reset < now) {value = {count: 0, reset: now + 60_000}; limits.set(key, value);}
    if (++value.count > max) throw new Error('Muitas tentativas. Aguarde um minuto.');
  }
  const membership = (socket: Socket) => {
    const room = rooms.get(socket.data.roomCode); const me = room?.members.findIndex(m => m.socketId === socket.id);
    if (!room || me === undefined || me < 0) throw new Error('Entre em uma sala para continuar.');
    return {room, me: me as PlayerId};
  };
  const view = (room: Room, me: PlayerId): RoomView => ({code: room.code, mode: room.mode, me, host: 0, members: room.members.map(m => ({name: m.name, color: m.color, connected: !!m.socketId || m.bot, ready: m.ready, bot: m.bot})), seconds: room.seconds, botStyle: room.botStyle, state: room.engine?.state ?? null, paused: room.paused, reconnectUntil: room.reconnectUntil, canAbandon: room.canAbandon, serverTime: Date.now(), version: room.version});
  function broadcast(room: Room, event = 'match:state') {
    room.version++;
    room.members.forEach((m, i) => {if (m.socketId) io.to(m.socketId).emit(event, view(room, i as PlayerId));});
  }
  async function persist(room: Room) {
    if (room.saving) return room.saving;
    const state = room.engine?.state;
    if (!state || !['POINT_REVIEW', 'MATCH_FINISHED'].includes(state.phase)) return;
    const snapshot = structuredClone(state);
    room.pendingSave = true;
    room.saving = (async () => {
      await store.savePoint(snapshot, room.members.map(member => member.profileId));
      if (snapshot.phase === 'MATCH_FINISHED' || room.mode === 'academy') await store.saveMatch(snapshot, room.members.map(member => member.profileId));
      room.pendingSave = false;
      await Promise.all(room.members.map(async member => {if (member.socketId && member.profileId) io.to(member.socketId).emit('progress', await store.progress(member.profileId));}));
    })();
    try {await room.saving;} catch {room.saveRetryAt = Date.now() + 5000; throw new Error('Seu ponto ainda não foi salvo. Aguarde a conexão e tente novamente.');}
    finally {room.saving = undefined;}
  }
  function arm(room: Room) {
    const s = room.engine!.state, now = Date.now(); room.due = 0;
    if (s.phase === 'BALL_ANIMATION') {
      if (options.animationScale !== undefined) s.animationUntil = now + Math.max(1, ((s.animationUntil ?? now) - now) * options.animationScale);
    } else if (['RECEIVER_POSITION', 'SERVE_DECISION', 'SHOT_DECISION'].includes(s.phase)) {
      s.deadline = room.seconds ? now + room.seconds * 1000 : null;
      if (room.members[s.turn]?.bot) room.due = now + (options.botDelay ?? 950);
      io.to(room.code).emit('turn:started', {turnId: s.turnId, deadline: s.deadline, serverTime: now});
    }
  }
  function start(room: Room) {
    const seed = randomInt(1, 0x7fffffff);
    room.engine = new TacticalEngine(room.mode, room.members.map(m => m.name) as [string, string], room.members.map(m => m.color) as [string, string], seed, randomUUID(), room.mode === 'academy' ? SCENARIOS.find(s => s.id === room.scenarioId) : undefined);
    store.event(room.engine.state.id, 'match:start', {seed, mode: room.mode, scenarioId: room.scenarioId});
    room.paused = false; room.canAbandon = false; room.reconnectUntil = null; arm(room); broadcast(room);
  }
  function leave(socket: Socket) {
    const code = socket.data.roomCode; const room = rooms.get(code); socket.leave(code ?? ''); delete socket.data.roomCode;
    if (!room) return;
    const member = room.members.find(m => m.socketId === socket.id); if (member) member.socketId = null;
    if (room.mode !== 'duel') rooms.delete(room.code);
    else if (room.engine) {room.paused = true; room.pausedAt = Date.now(); room.reconnectUntil = Date.now(); room.canAbandon = true; broadcast(room);}
    else { if (room.members[0] === member) {room.members.forEach(m => {if (m.socketId) io.to(m.socketId).emit('room:closed');}); rooms.delete(room.code);} else {room.members.pop(); broadcast(room);} }
  }
  io.on('connection', socket => {
    const auth = socket.data.session;
    socket.emit('session', {...auth, buildId});
    void store.progress(auth.profile.id).then(progress => socket.emit('progress', progress)).catch(() => socket.emit('storage:error', 'Não foi possível carregar seu progresso. Tente novamente.'));
    let actionQueue: Promise<unknown> = Promise.resolve();
    function on<T>(event: string, schema: z.ZodType<T>, handler: (payload: T) => unknown | Promise<unknown>) {
      socket.on(event, (raw: unknown, ack?: (value: Ack) => void) => {
        const respond = typeof ack === 'function' ? ack : () => {};
        actionQueue = actionQueue.then(async () => {
          try {rate(socket, 'actions', 500); const parsed = schema.safeParse(raw); if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Mensagem inválida.'); respond({ok: true, data: await handler(parsed.data)});}
          catch (error) {respond({ok: false, error: error instanceof Error ? error.message : 'Não foi possível concluir.'});}
        });
      });
    }
    const resume = (code: string, token: string) => {
      const room = rooms.get(code); if (!room) throw new Error('A sala expirou ou o servidor foi reiniciado.');
      const me = room.members.findIndex(m => m.token === token && m.profileId === socket.data.profileId);
      if (me < 0) throw new Error('Sessão de sala inválida.');
      if (room.canAbandon || (room.reconnectUntil && Date.now() > room.reconnectUntil)) throw new Error('O prazo de reconexão terminou.');
      const member = room.members[me];
      if (member.socketId && member.socketId !== socket.id) io.sockets.sockets.get(member.socketId)?.disconnect();
      member.socketId = socket.id; socket.data.roomCode = code; socket.join(code);
      if (room.paused && room.members.every(m => m.socketId || m.bot)) {
        const delta = Date.now() - room.pausedAt; const s = room.engine?.state;
        if (s?.deadline) s.deadline += delta; if (s?.animationUntil) s.animationUntil += delta; if (room.due) room.due += delta;
        room.paused = false; room.reconnectUntil = null;
      }
      broadcast(room, 'player:reconnected'); return view(room, me as PlayerId);
    };
    on('profile:update', profileSchema, async payload => {const profile = {...payload, id: socket.data.profileId}; await store.update(profile); socket.emit('progress', await store.progress(profile.id)); return profile;});
    on('progress:get', z.object({}).strict(), () => store.progress(socket.data.profileId));
    on('replay:get', z.object({id: z.string().uuid()}).strict(), payload => store.replay(socket.data.profileId, payload.id));
    on('room:create', roomSchema, async payload => {
      rate(socket, 'create', 25); if (rooms.size >= 100) throw new Error('O servidor atingiu o limite de salas.');
      if (payload.mode === 'academy' && !SCENARIOS.some(s => s.id === payload.scenarioId)) throw new Error('Escolha um exercício válido.');
      const profile = await store.profile(socket.data.profileId);
      leave(socket);
      let code: string; do {code = randomBytes(5).toString('hex').toUpperCase();} while (rooms.has(code));
      const token = randomBytes(32).toString('hex');
      const room: Room = {code, mode: payload.mode, seconds: payload.seconds, botStyle: payload.botStyle ?? 'consistent', scenarioId: payload.scenarioId, members: [{profileId: profile.id, token, socketId: socket.id, name: profile.nickname, color: profile.color, ready: true, bot: false}], engine: null, paused: false, reconnectUntil: null, canAbandon: false, pausedAt: 0, due: 0, version: 0, lastActive: Date.now()};
      if (room.mode !== 'duel') room.members.push({profileId: null, token: '', socketId: null, name: payload.botStyle === 'aggressive' ? 'Ícaro · Agressivo' : payload.botStyle === 'defensive' ? 'Lia · Defensiva' : 'Alex · Consistente', color: '#f0a878', ready: true, bot: true});
      rooms.set(code, room); socket.data.roomCode = code; socket.join(code);
      if (room.mode !== 'duel') start(room); else broadcast(room);
      return {token, room: view(room, 0)};
    });
    on('room:join', z.object({code: z.string().regex(/^[A-F0-9]{10}$/)}).strict(), async payload => {
      rate(socket, 'join', 12); const p = await store.profile(socket.data.profileId); const room = rooms.get(payload.code);
      if (!room || room.mode !== 'duel') throw new Error('Sala não encontrada. Confira o código.');
      if (room.members.length >= 2) throw new Error('Esta sala já tem dois jogadores.');
      if (room.members[0].socketId === socket.id) throw new Error('Você já está nesta sala.');
      leave(socket); const token = randomBytes(32).toString('hex');
      room.members.push({profileId: p.id, token, socketId: socket.id, name: p.nickname, color: p.color === room.members[0].color ? '#f0a878' : p.color, ready: false, bot: false});
      socket.data.roomCode = room.code; socket.join(room.code); broadcast(room); return {token, room: view(room, 1)};
    });
    on('room:resume', z.object({code: z.string().max(10), token: z.string().max(128)}).strict(), p => resume(p.code, p.token));
    on('room:leave', z.object({}).strict(), async () => {const room = rooms.get(socket.data.roomCode); if (room?.pendingSave) await persist(room); leave(socket); return true;});
    on('room:ready', z.object({ready: z.boolean()}).strict(), p => {const {room, me} = membership(socket); if (room.engine) throw new Error('A partida já começou.'); room.members[me].ready = p.ready; broadcast(room);});
    on('room:settings', z.object({seconds: z.union([z.literal(3), z.literal(5), z.literal(8)])}).strict(), p => {const {room, me} = membership(socket); if (me !== 0 || room.engine) throw new Error('Somente o anfitrião pode configurar o lobby.'); room.seconds = p.seconds; broadcast(room);});
    on('match:start', z.object({}).strict(), () => {const {room, me} = membership(socket); if (me !== 0 || room.engine || room.members.length !== 2 || !room.members.every(m => m.ready && (m.socketId || m.bot))) throw new Error('Aguarde os dois jogadores ficarem prontos.'); start(room);});
    const commit = (event: string, expected: string) => on(event, actionSchema, action => {
      const {room, me} = membership(socket); if (room.paused) throw new Error('A partida está pausada para reconexão.');
      if (!room.engine || room.engine.state.phase !== expected) throw new Error('Esta ação não corresponde à fase atual.');
      room.engine.apply(action, me); room.lastActive = Date.now(); store.event(room.engine.state.id, event, {player: me, action}); arm(room); broadcast(room); return {revision: room.engine.state.revision};
    });
    commit('receiver:position', 'RECEIVER_POSITION'); commit('serve:commit', 'SERVE_DECISION'); commit('shot:commit', 'SHOT_DECISION');
    on('point:next', z.object({}).strict(), async () => {const {room, me} = membership(socket); if (room.paused || me !== 0 || room.engine?.state.phase !== 'POINT_REVIEW') throw new Error('Aguarde a revisão do ponto.'); await persist(room); room.engine.setupPoint(room.mode === 'academy' ? SCENARIOS.find(s => s.id === room.scenarioId) : undefined); arm(room); broadcast(room);});
    on('match:rematch', z.object({}).strict(), async () => {const {room, me} = membership(socket); if (me !== 0 || room.engine?.state.phase !== 'MATCH_FINISHED' || !room.members.every(m => m.socketId || m.bot)) throw new Error('A revanche precisa dos dois jogadores conectados e da partida encerrada.'); await persist(room); start(room);});
    on('match:abandon', z.object({}).strict(), () => {const {room} = membership(socket); if (!room.canAbandon) throw new Error('Aguarde o prazo de reconexão.'); room.members.forEach(m => {if (m.socketId) io.to(m.socketId).emit('room:closed');}); rooms.delete(room.code);});
    socket.on('disconnect', () => {
      const room = rooms.get(socket.data.roomCode); const member = room?.members.find(m => m.socketId === socket.id); if (!room || !member) return;
      member.socketId = null;
      if (!room.paused) {room.pausedAt = Date.now(); room.reconnectUntil = Date.now() + 30_000;}
      room.paused = true; broadcast(room, 'player:disconnected');
    });
    const {roomCode, roomToken} = socket.handshake.auth;
    if (typeof roomCode === 'string' && typeof roomToken === 'string') {
      try {resume(roomCode, roomToken);} catch (e) {socket.emit('resume:failed', e instanceof Error ? e.message : 'Sessão expirada.');}
    }
  });
  let tickWork: Promise<void> | null = null;
  const timer = setInterval(() => {
    if (tickWork) return;
    tickWork = (async () => {
      const now = Date.now();
      for (const room of rooms.values()) {
        if (now - room.lastActive > 3_600_000 && !room.pendingSave) {rooms.delete(room.code); continue;}
        if (room.pendingSave && now >= (room.saveRetryAt ?? 0)) {try {await persist(room);} catch {io.to(room.code).emit('storage:error', 'Aguardando conexão para salvar seu ponto.');}}
        if (room.paused) {if (room.reconnectUntil && now > room.reconnectUntil && !room.canAbandon) {room.canAbandon = true; broadcast(room);} continue;}
        const engine = room.engine; if (!engine) continue; const state = engine.state;
        if (state.phase === 'BALL_ANIMATION') {
          if (engine.finishAnimation(now)) {
            try {await persist(room);} catch {io.to(room.code).emit('storage:error', 'Seu ponto ainda não foi salvo. Aguarde para continuar.');}
            arm(room); const phase = String(state.phase); broadcast(room, phase === 'MATCH_FINISHED' ? 'match:finished' : phase === 'POINT_REVIEW' ? 'point:resolved' : 'match:state');
          }
        } else if (['RECEIVER_POSITION', 'SERVE_DECISION', 'SHOT_DECISION'].includes(state.phase) && ((room.due && now >= room.due) || (state.deadline && now >= state.deadline))) {
          const bot = room.members[state.turn].bot, action = engine.defaultAction(bot ? room.botStyle : 'timeout');
          try {engine.apply(action, state.turn, now, !bot); void store.event(state.id, 'automatic:decision', {action, bot}); arm(room); broadcast(room);} catch {console.error('Falha na decisão automática.');}
        }
      }
      for (const [key, value] of limits) if (value.reset < now) limits.delete(key);
      for (const socket of io.sockets.sockets.values()) if (socket.data.expiresAt && socket.data.expiresAt <= now) {socket.emit('session:expired'); socket.disconnect(true);}
    })().finally(() => {tickWork = null;});
    void tickWork.catch(() => console.error('Falha ao atualizar uma sala.'));
  }, 50);
  const addresses = () => Object.values(networkInterfaces()).flat().filter(n => n && n.family === 'IPv4' && !n.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address)).map(n => n!.address);
  app.get('/api/health', (_req, res) => res.set('Cache-Control','no-store').json({ok: true, game: 'Tennis Tático', buildId, rooms: rooms.size, addresses: process.env.HOST === '0.0.0.0' ? addresses() : []}));
  app.get('/api/auth/config', (_req, res) => res.set('Cache-Control','no-store').json(authConfig));
  app.get('/api/scenarios', (_req, res) => res.json(SCENARIOS));
  let vite: {close: () => Promise<void>} | undefined;
  if (options.dev) {const {createServer: createViteServer} = await import('vite'); const v = await createViteServer({server: {middlewareMode: true, hmr: {server: http}}, appType: 'spa'}); app.use(v.middlewares); vite = v;}
  else {
    app.use(express.static(resolve('dist/client'), {setHeaders: (res, path) => {if (path.endsWith('.html') || path.endsWith('build-info.json') || path.endsWith('.webmanifest')) res.setHeader('Cache-Control', 'no-store');}}));
    app.get('/assets/{*splat}', (_req, res) => res.status(404).type('text').send('Arquivo desta versão não encontrado. Atualize a página.'));
    app.get('/{*splat}', (_req, res) => res.set('Cache-Control','no-store').sendFile(resolve('dist/client/index.html')));
  }
  return {app, http, io, rooms, store, addresses, close: async () => {clearInterval(timer); await tickWork; await vite?.close(); await new Promise<void>(r => io.close(() => r())); await store.close();}};
}
