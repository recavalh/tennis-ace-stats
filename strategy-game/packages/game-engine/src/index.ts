import { COURT, other, side, type Action, type Ball, type BotStyle, type Decision, type GameState, type Mode, type Player, type PlayerId, type Scenario, type ShotId, type Vec } from '../../shared/src/index';
import { BALANCE, SHOTS } from './config';
import { clamp, coverage, distance, legalServe, moveToward, validPosition } from './geometry';
import { TacticalCoach } from './coach';
export { BALANCE, SHOTS, TacticalCoach, coverage, distance, legalServe, moveToward, validPosition };
export const serverForPoint = (n: number, first: PlayerId): PlayerId => n === 0 ? first : Math.floor((n - 1) / 2) % 2 === 0 ? other(first) : first;
export const tiebreakWon = (score: [number, number]) => Math.max(...score) >= 7 && Math.abs(score[0] - score[1]) >= 2;
export const rng = (seed: number) => { const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return { seed: next, value: next / 4294967296 }; };
const copy = <T>(value: T): T => structuredClone(value);
const pointStart = (id: PlayerId): Vec => ({x: id === 0 ? 1 : -1, y: side(id) * 12.5});
export class TacticalEngine {
  state: GameState;
  constructor(mode: Mode, names: [string, string], colors: [string, string], seed = 2026, id = 'match', scenario?: Scenario) {
    const players = [0, 1].map(i => ({name: names[i], color: colors[i], position: pointStart(i as PlayerId), destination: pointStart(i as PlayerId), balance: 1, skill: .8, speed: BALANCE.speed})) as [Player, Player];
    this.state = { id, mode, phase: 'POINT_SETUP', turn: 1, server: 0, firstServer: 0, serveSide: 'deuce', serveAttempt: 1, players, score: [0, 0], pointNumber: 0, rally: 0, seed, initialSeed: seed, ball: null, decisions: [], points: [], options: [], winner: null, reason: '', deadline: null, animationUntil: null, nextPhase: null, turnId: '', revision: 0 };
    this.setupPoint(scenario);
  }
  private random() { const r = rng(this.state.seed); this.state.seed = r.seed; return r.value; }
  private phase(phase: GameState['phase']) { const s = this.state; s.phase = phase; s.revision++; s.turnId = `${s.id}:${s.pointNumber}:${s.revision}`; s.deadline = null; s.options = this.options(); }
  private animation(next: GameState['phase'], now: number, duration = BALANCE.animationMs) {
    this.phase('BALL_ANIMATION'); this.state.animationUntil = now + duration; this.state.nextPhase = next;
  }
  setupPoint(scenario?: Scenario) {
    const s = this.state;
    if (!['POINT_SETUP', 'POINT_REVIEW', 'MATCH_FINISHED'].includes(s.phase)) throw new Error('O ponto ainda está em andamento.');
    if (s.phase === 'MATCH_FINISHED') throw new Error('A partida terminou.');
    s.server = serverForPoint(s.pointNumber, s.firstServer); s.turn = other(s.server);
    s.serveSide = s.pointNumber % 2 === 0 ? 'deuce' : 'ad'; s.serveAttempt = 1; s.rally = 0; s.ball = null; s.decisions = []; s.winner = null; s.reason = ''; s.initialSeed = s.seed; s.animationUntil = null; s.nextPhase = null;
    for (const id of [0, 1] as const) { const p = s.players[id]; p.position = pointStart(id); p.destination = copy(p.position); p.balance = 1; }
    const serveX = side(s.server) * (s.serveSide === 'deuce' ? 1.05 : -1.05);
    s.players[s.server].position = {x: serveX, y: side(s.server) * 12.15};
    s.players[s.server].destination = copy(s.players[s.server].position);
    s.players[other(s.server)].position.x = -serveX * 1.9;
    s.players[other(s.server)].destination = copy(s.players[other(s.server)].position);
    this.phase('RECEIVER_POSITION');
    if (scenario) {
      s.scenarioId = scenario.id; s.turn = 0; s.server = 1;
      for (const [i, attributes] of [[0, scenario.attributes?.player], [1, scenario.attributes?.opponent]] as const) {
        s.players[i].skill = clamp(attributes?.skill ?? .8, 0, 1);
        s.players[i].speed = clamp(attributes?.speed ?? BALANCE.speed, 1, 7);
      }
      s.players[0].position = copy(scenario.player); s.players[0].destination = copy(scenario.player);
      s.players[1].position = copy(scenario.opponent); s.players[1].destination = copy(scenario.opponent);
      const contact = copy(scenario.incoming);
      const flight = scenario.lastShot.startsWith('lob') ? 2.7 : scenario.lastShot.startsWith('serve') ? 1.1 : 1.6;
      s.ball = {from: copy(scenario.opponent), to: {x: contact.x, y: Math.min(11.6, contact.y - 1)}, contact, speed: 22, flight, height: scenario.lastShot.startsWith('lob') ? 'high' : 'normal', difficulty: scenario.id === 'bola-profunda' || scenario.id === 'primeiro-saque' ? .7 : .35, shot: scenario.lastShot, hitter: 1, outcome: 'Em jogo'};
      s.players[0].position = moveToward(scenario.player, contact, flight - BALANCE.reaction);
      s.players[0].balance = clamp(1 - distance(scenario.player, contact) / (flight * BALANCE.speed) * .35, .3, 1);
      s.rally = 1; this.phase('SHOT_DECISION');
    }
    return s;
  }
  options(): ShotId[] {
    const s = this.state;
    if (s.phase === 'SERVE_DECISION') return ['serve-wide', 'serve-body', 'serve-t'];
    if (s.phase !== 'SHOT_DECISION') return [];
    const me = s.players[s.turn], rival = s.players[other(s.turn)];
    if (s.ball?.contactType === 'volley' && !s.ball.shot.startsWith('serve-') && s.ball.height !== 'high' && Math.abs(s.ball.contact.y) <= BALANCE.volleyZone && distance(me.position, s.ball.contact) <= BALANCE.reach + BALANCE.tolerance) return ['volley-deep', 'volley-angle', 'volley-block'];
    const deep = (s.ball?.contact.y ?? me.position.y) * side(s.turn) > 12.3;
    if (s.ball?.height === 'high' && me.position.y * side(s.turn) < 9 && (s.ball.contact.y * side(s.turn)) > 10) return ['high', 'lob-defense', 'safe', 'cross'];
    if (Math.abs(rival.position.y) < 5) return ['passing', 'lob-attack', 'lob-defense', 'cross'];
    if (deep || me.balance < .45) return ['high', 'lob-defense', 'deep-middle', 'cross'];
    if ((s.ball?.contact.y ?? me.position.y) * side(s.turn) < 8) return ['approach', 'angle', 'line', 'cross', 'safe'];
    return s.rally === 1 ? ['deep-middle', 'cross', 'line', 'high', 'angle'] : ['cross', 'line', 'angle', 'safe', 'high'];
  }
  apply(action: Action, player: PlayerId, now = Date.now(), automatic = false) {
    const s = this.state;
    if (player !== s.turn) throw new Error('Aguarde sua vez de decidir.');
    if (action.turnId !== s.turnId) throw new Error('Esta decisão já passou.');
    if (!['RECEIVER_POSITION', 'SERVE_DECISION', 'SHOT_DECISION'].includes(s.phase)) throw new Error('Aguarde a animação terminar.');
    if (!automatic && s.deadline !== null && now > s.deadline) throw new Error('O tempo desta decisão terminou.');
    if (!validPosition(action.target, player)) throw new Error('Escolha uma posição válida no seu lado da quadra.');
    if (s.decisions.some(d => d.id === action.id)) throw new Error('Decisão duplicada.');
    if (s.phase === 'RECEIVER_POSITION') {
      const p = s.players[player]; const duration = Math.max(650, distance(p.position, action.target) / p.speed * 1000);
      p.destination = copy(action.target); p.position = copy(action.target); s.turn = s.server;
      this.animation('SERVE_DECISION', now, duration); return s;
    }
    if (!action.shot || !this.options().includes(action.shot)) throw new Error('Este golpe não está disponível nesta situação.');
    const shot = action.shot, def = SHOTS[shot], me = s.players[player], opponentId = other(player), rival = s.players[opponentId], serve = s.phase === 'SERVE_DECISION';
    const before = copy(s.players.map(p => p.position)) as [Vec, Vec];
    const from = serve ? copy(me.position) : copy(s.ball?.contact ?? me.position);
    if (!serve && distance(me.position, from) > BALANCE.reach + BALANCE.tolerance) { this.resolve(opponentId, 'Bola inalcançável'); this.animation('POINT_RESOLUTION', now); return s; }
    let x = 0, depth = def.depth, power = def.power;
    if (serve) {
      const serviceSign = -side(player) * (s.serveSide === 'deuce' ? 1 : -1);
      x = serviceSign * (shot === 'serve-wide' ? 3.45 : shot === 'serve-t' ? .35 : clamp(Math.abs(rival.position.x), .8, 2.7));
      if (action.serveType === 'kick') { power *= .76; depth = 5.2; }
      if (action.serveType === 'slice') power *= .87;
      if (s.serveAttempt === 2) power *= .83;
    } else {
      const ownX = Math.abs(from.x) < .3 ? (rival.position.x >= 0 ? -1 : 1) : Math.sign(from.x);
      if (shot === 'cross' || shot === 'angle' || shot === 'volley-deep') x = -ownX * def.angle;
      else if (shot === 'volley-angle') x = -Math.sign(rival.position.x || ownX) * def.angle;
      else if (shot === 'line' || shot === 'approach') x = ownX * def.angle;
      else if (shot === 'passing' || shot === 'lob-attack') x = -Math.sign(rival.position.x || 1) * def.angle;
      else x = -Math.sign(rival.position.x || 1) * def.angle;
    }
    const target: Vec = {x, y: -side(player) * depth};
    const evaluation = TacticalCoach.evaluate(s, player, shot, action.target, from, target, automatic);
    const pressure = serve ? 0 : s.ball?.difficulty ?? 0;
    const risk = clamp(def.risk + (1 - me.skill) * .05 + (1 - me.balance) * BALANCE.imbalance * def.balance + pressure * def.risk * .5 + (automatic ? .065 : 0) + Math.max(0, s.rally - BALANCE.fatigueStartsAt) * BALANCE.fatiguePerShot - (serve && action.serveType === 'kick' ? .035 : 0) - (serve && s.serveAttempt === 2 ? .025 : 0), .015, .55);
    const executionError = this.random() < risk;
    const missNet = executionError && this.random() < .47;
    // Dispersão pequena; erros explícitos ultrapassam a rede ou as margens.
    target.x += (this.random() - .5) * .28;
    target.y += (this.random() - .5) * .32;
    if (executionError) {
      if (missNet) target.y = side(player) * .3;
      else if (serve) target.y = -side(player) * 7.2;
      else target.x = Math.sign(target.x || 1) * 4.65;
    }
    let flight = Math.max(BALANCE.minFlight, distance(from, target) / power + (def.height === 'high' ? BALANCE.highFlightExtra : BALANCE.normalFlightExtra) + (!serve && depth < 6 ? BALANCE.shortFlightExtra : 0));
    let contact: Vec = {x: target.x + (serve && shot === 'serve-wide' ? Math.sign(target.x) * .85 : 0), y: -side(player) * (serve ? 12.25 : Math.min(16.3, depth + (def.height === 'high' ? 1.8 : .8)))};
    let contactType: Ball['contactType'] = 'bounce';
    // A posição real permite cortar a trajetória antes do quique, sem recuar ao fundo.
    // Se a interceptação não for alcançável, a tentativa continua após o quique.
    const netDepth = rival.position.y * side(opponentId);
    if (!executionError && !serve && def.height !== 'high' && netDepth <= BALANCE.volleyZone && netDepth >= .65) {
      const volleyDepth = clamp(netDepth, .85, Math.min(BALANCE.volleyZone, Math.abs(target.y) - .4));
      const volleyY = side(opponentId) * volleyDepth;
      const fraction = (volleyY - from.y) / (target.y - from.y);
      if (fraction > 0 && fraction < 1 && volleyDepth < Math.abs(target.y)) {
        const intercept = {x: from.x + (target.x - from.x) * fraction, y: volleyY};
        const interceptFlight = Math.max(BALANCE.minFlight, distance(from, intercept) / power + BALANCE.volleyFlightExtra);
        const reached = moveToward(rival.position, intercept, Math.max(0, interceptFlight - BALANCE.reaction), rival.speed);
        if (distance(reached, intercept) <= BALANCE.reach) {contact = intercept; flight = interceptFlight; contactType = 'volley';}
      }
    }
    const rivalDistance = distance(rival.position, contact), available = Math.max(0, flight - BALANCE.reaction);
    const movedRival = moveToward(rival.position, contact, available, rival.speed);
    const remaining = distance(movedRival, contact);
    me.destination = copy(action.target); me.position = moveToward(me.position, action.target, flight * BALANCE.recoveryFactor, me.speed);
    rival.position = movedRival; rival.destination = copy(contact);
    me.balance = clamp(me.balance + .2, .15, 1);
    rival.balance = clamp(1 - rivalDistance / Math.max(1, available * rival.speed) * .45 - (serve && shot === 'serve-body' ? .15 : 0), .15, 1);
    const difficulty = clamp(rivalDistance / Math.max(1, available * rival.speed + BALANCE.reach) * .65 + def.offense * .12 + (remaining / BALANCE.reach) * .12, 0, 1);
    const ball: Ball = {from, to: target, contact, speed: power, flight, height: def.height, difficulty, shot, hitter: player, outcome: executionError ? missNet ? 'Bola na rede' : 'Bola fora' : 'Em jogo', contactType};
    s.ball = ball; s.rally++;
    const decision: Decision = { id: action.id, player, shot, recovery: copy(action.target), serveType: action.serveType, automatic, from, before, after: copy(s.players.map(p => p.position)) as [Vec, Vec], ball: copy(ball), ...evaluation };
    s.decisions.push(decision);
    if (serve && (!legalServe(target, player, s.serveSide) || executionError)) {
      if (s.serveAttempt === 1) {
        s.serveAttempt = 2; s.reason = 'Falta no primeiro saque. Prepare o segundo serviço.';
        // O devolvedor volta à posição de espera; houve tempo entre os serviços.
        s.players[opponentId].position = copy(before[opponentId]);
        me.position = copy(from); s.decisions.at(-1)!.after = copy(s.players.map(p => p.position)) as [Vec, Vec]; this.animation('SERVE_DECISION', now, BALANCE.serveAnimationMs);
      } else { this.resolve(opponentId, 'Dupla falta'); this.animation('POINT_RESOLUTION', now, BALANCE.serveAnimationMs); }
      return s;
    }
    if (executionError) this.resolve(opponentId, ball.outcome);
    else if (remaining > BALANCE.reach) { ball.outcome = serve ? 'Ace' : remaining > BALANCE.reach + 1.5 ? 'Winner' : 'Duplo quique'; s.decisions.at(-1)!.ball.outcome = ball.outcome; this.resolve(player, ball.outcome); }
    else { s.turn = opponentId; s.reason = ''; }
    this.animation(s.winner === null ? 'SHOT_DECISION' : 'POINT_RESOLUTION', now, serve ? BALANCE.serveAnimationMs : BALANCE.animationMs);
    return s;
  }
  finishAnimation(now = Date.now()) {
    const s = this.state;
    if (s.phase !== 'BALL_ANIMATION' || !s.nextPhase || now < (s.animationUntil ?? 0)) return false;
    const next = s.nextPhase; s.animationUntil = null; s.nextPhase = null;
    this.phase(next);
    if (next === 'POINT_RESOLUTION') {
      const record = { number: s.pointNumber + 1, seed: s.initialSeed, server: s.server, winner: s.winner!, reason: s.reason, decisions: copy(s.decisions), score: copy(s.score), started: s.decisions[0]?.before ?? copy(s.players.map(p => p.position)) as [Vec, Vec] };
      s.points.push(record); s.pointNumber++;
      this.phase(tiebreakWon(s.score) && s.mode !== 'academy' ? 'MATCH_FINISHED' : 'POINT_REVIEW');
    }
    return true;
  }
  private resolve(winner: PlayerId, reason: string) { this.state.winner = winner; this.state.reason = reason; this.state.score[winner]++; }
  defaultAction(style: BotStyle | 'timeout' = 'timeout'): Action {
    const s = this.state, id = s.turn;
    let shot: ShotId | undefined;
    const list = this.options();
    if (s.phase === 'SERVE_DECISION') {
      shot = style === 'aggressive' ? 'serve-wide' : style === 'defensive' ? 'serve-body' : (['serve-body', 'serve-t', 'serve-wide'] as ShotId[])[Math.floor(rng(s.seed ^ 0x9e3779b9).value * 3)];
    } else if (s.phase === 'SHOT_DECISION') {
      const preferences: ShotId[] = style === 'timeout' ? ['volley-block', 'high', 'lob-defense', 'safe', 'deep-middle'] : style === 'aggressive' ? ['volley-angle', 'volley-deep', 'passing', 'approach', 'line', 'angle', 'cross'] : style === 'defensive' ? ['volley-block', 'volley-deep', 'lob-defense', 'high', 'safe', 'cross'] : ['volley-deep', 'volley-block', 'deep-middle', 'cross', 'safe', 'high'];
      // A escolha é determinística e não consome a sequência da execução do golpe.
      const possible = preferences.filter(x => list.includes(x));
      shot = possible[Math.floor(rng(s.seed ^ 0x9e3779b9).value * Math.min(2, possible.length))] ?? list[0];
    }
    const volley = shot?.startsWith('volley-') ?? false;
    let target = s.phase === 'RECEIVER_POSITION' ? {x: s.players[id].position.x, y: side(id) * 13.2} : coverage(s.players[other(id)].position, id, shot === 'approach' || volley);
    if (style === 'timeout') target = {x: target.x * .65 + s.players[id].position.x * .35, y: volley ? s.players[id].position.y : side(id) * 13.1};
    return {id: `auto:${s.turnId}`, turnId: s.turnId, target, shot, serveType: style === 'aggressive' ? 'flat' : 'kick'};
  }
}
