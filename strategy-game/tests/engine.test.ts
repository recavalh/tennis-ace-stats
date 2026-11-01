import { describe, expect, it } from 'vitest';
import { TacticalEngine, BALANCE, SHOTS, coverage, distance, legalServe, moveToward, serverForPoint, tiebreakWon, validPosition } from '../packages/game-engine/src/index';
import { actionSchema, COURT, other, side, type Action, type BotStyle, type GameState, type PlayerId, type ShotId } from '../packages/shared/src/index';
import { SCENARIOS } from '../content/scenarios/index';
function engine(seed = 42) {return new TacticalEngine('computer', ['A', 'B'], ['#ddeb78', '#f0a878'], seed, 'test');}
function animate(e: TacticalEngine) {if (e.state.phase === 'BALL_ANIMATION') e.finishAnimation(e.state.animationUntil! + 1);}
function playPoint(e: TacticalEngine, style: BotStyle = 'consistent') {
  let count = 0;
  while (!['POINT_REVIEW', 'MATCH_FINISHED'].includes(e.state.phase) && count++ < 250) {
    if (e.state.phase === 'BALL_ANIMATION') animate(e);
    else e.apply(e.defaultAction(style), e.state.turn, 100, false);
  }
  expect(count).toBeLessThan(250);
}
describe('Geometria, alcance e movimento', () => {
  it('usa dimensões regulamentares de simples', () => {expect(COURT.width).toBe(8.23); expect(COURT.length).toBe(23.77); expect(COURT.service).toBe(6.4);});
  it('limita movimento pela velocidade e pelo tempo', () => {
    const a = {x: 0, y: 13}, b = {x: 6, y: 3};
    expect(distance(a, moveToward(a, b, .2, 4))).toBeCloseTo(.8);
    expect(moveToward(a, b, 0)).toEqual(a); expect(moveToward(a, b, 20)).toEqual(b);
    expect(moveToward(a, b, -1)).toEqual(a);
  });
  it('permite o fundo, recusa metade adversária e valores não finitos', () => {
    expect(validPosition({x: 6, y: 17}, 0)).toBe(true); expect(validPosition({x: 0, y: -3}, 0)).toBe(false);
    expect(validPosition({x: 0, y: 18}, 0)).toBe(false); expect(validPosition({x: NaN, y: 13}, 0)).toBe(false);
  });
  it.each([0, 1] as const)('valida o quadrado de serviço do jogador %i nos dois lados', id => {
    const sign = id === 0 ? 1 : -1;
    expect(legalServe({x: -sign * 3, y: -sign * 5}, id, 'deuce')).toBe(true);
    expect(legalServe({x: sign * 3, y: -sign * 5}, id, 'deuce')).toBe(false);
    expect(legalServe({x: sign * 3, y: -sign * 5}, id, 'ad')).toBe(true);
    expect(legalServe({x: sign * 3, y: -sign * 7}, id, 'ad')).toBe(false);
  });
  it('varia a cobertura com o ponto de contato; não impõe centro fixo', () => {
    const left = coverage({x: -3.8, y: -11}, 0), right = coverage({x: 3.8, y: -11}, 0);
    expect(left.x).toBeLessThan(0); expect(right.x).toBeGreaterThan(0); expect(left.x).not.toBe(right.x);
  });
});
describe('Tie-break e estados', () => {
  it('alterna saque 1-2-2 e lado em cada ponto', () => {
    expect(Array.from({length: 9}, (_, n) => serverForPoint(n, 0))).toEqual([0,1,1,0,0,1,1,0,0]);
    expect(Array.from({length: 5}, (_, n) => serverForPoint(n, 1))).toEqual([1,0,0,1,1]);
    const e = engine(); for (let n = 0; n < 10; n++) {expect(e.state.server).toBe(serverForPoint(n, 0)); expect(e.state.serveSide).toBe(n % 2 ? 'ad' : 'deuce'); playPoint(e); if (e.state.phase === 'MATCH_FINISHED') break; e.setupPoint();}
  });
  it('exige 7 pontos e dois de vantagem, inclusive acima de 7', () => {
    expect(tiebreakWon([6,0])).toBe(false); expect(tiebreakWon([7,6])).toBe(false); expect(tiebreakWon([8,6])).toBe(true); expect(tiebreakWon([12,10])).toBe(true);
  });
  it('rejeita jogador, turno, golpe impossível e posição inválida', () => {
    const e = engine(), action = e.defaultAction();
    expect(() => e.apply(action, other(e.state.turn))).toThrow('vez');
    expect(() => e.apply({...action, turnId: 'old'}, e.state.turn)).toThrow('passou');
    expect(() => e.apply({...action, target: {x: 0, y: -10}}, 1)).not.toThrow();
    animate(e);
    const a = e.defaultAction();
    expect(() => e.apply({...a, target: {x: 0, y: -12}}, 0)).toThrow('posição');
    expect(() => e.apply({...a, shot: 'passing'}, 0)).toThrow('disponível');
    e.apply(a, 0); expect(() => e.apply(a, 0)).toThrow();
  });
  it('rejeita prazo vencido mas aceita a defesa automática com penalidade', () => {
    const e = engine(); e.state.deadline = 200;
    const a = e.defaultAction(); expect(() => e.apply(a, e.state.turn, 201)).toThrow('tempo');
    expect(() => e.apply(a, e.state.turn, 201, true)).not.toThrow();
  });
  it('não libera decisão antes de terminar a animação', () => {
    const e = engine(); e.apply(e.defaultAction(), e.state.turn, 100);
    expect(e.state.phase).toBe('BALL_ANIMATION'); expect(e.finishAnimation(101)).toBe(false);
    expect(() => e.apply(e.defaultAction(), e.state.turn)).toThrow(); animate(e); expect(e.state.phase).toBe('SERVE_DECISION');
  });
  it('distingue segundo serviço e encerra em dupla falta', () => {
    let found = false;
    for (let seed = 1; seed < 300 && !found; seed++) {
      const e = engine(seed * 719); e.apply(e.defaultAction(), e.state.turn, 100); animate(e);
      e.state.players[0].skill = 0; e.state.players[0].balance = .15;
      e.apply({...e.defaultAction('aggressive'), shot: 'serve-wide', serveType: 'flat'}, 0, 100);
      if (e.state.serveAttempt !== 2) continue; animate(e);
      e.state.seed = seed * 719; e.state.players[0].balance = .15;
      e.apply({...e.defaultAction('aggressive'), shot: 'serve-wide', serveType: 'flat'}, 0, 100); animate(e);
      if (e.state.reason === 'Dupla falta') {expect(e.state.score).toEqual([0,1]); expect(e.state.points[0].decisions.length).toBe(2); found = true;}
    }
    expect(found).toBe(true);
  });
});
describe('Determinismo, cenários e pedagogia', () => {
  it('reproduz um ponto inteiro com a mesma semente e decisões', () => {
    const a = engine(709), b = engine(709); playPoint(a, 'aggressive'); playPoint(b, 'aggressive'); expect(a.state.points).toEqual(b.state.points);
  });
  it('reexecuta ações registradas sem depender do processo de escolha do bot', () => {
    const live = engine(18051), log: {action: Action; player: PlayerId}[] = [];
    while (live.state.phase !== 'POINT_REVIEW') {
      if (live.state.phase === 'BALL_ANIMATION') animate(live);
      else {const action = live.defaultAction('aggressive'), player = live.state.turn; log.push({action: structuredClone(action), player}); live.apply(action, player, 100);}
    }
    const replay = engine(18051);
    for (const {action, player} of log) {animate(replay); replay.apply(action, player, 100);}
    animate(replay); expect(replay.state.points).toEqual(live.state.points);
  });
  it.each(SCENARIOS.map(s => [s.id, s] as const))('cenário %s é jogável, com feedback contextual', (_id, scenario) => {
    const e = new TacticalEngine('academy', ['A','B'], ['#ddeb78','#f0a878'], 100, 'scenario', scenario);
    expect(e.state.phase).toBe('SHOT_DECISION'); expect(e.state.server).toBe(1); expect(e.state.options.length).toBeGreaterThanOrEqual(3);
    playPoint(e); expect(e.state.points).toHaveLength(1);
    const d = e.state.decisions.find(d => d.player === 0)!;
    expect(d).toBeDefined(); expect(d.explanation.length).toBeGreaterThan(50); expect(d.alternative.length).toBeGreaterThan(20);
    expect(d.positionIQ).toBeGreaterThanOrEqual(12); expect(d.shotIQ).toBeLessThanOrEqual(99);
  });
  it('distingue decisão e resultado: erro de execução pode ter boas notas', () => {
    let found = false;
    for (let seed = 1; seed < 600; seed++) {
      const e = new TacticalEngine('academy', ['A','B'], ['#ddeb78','#f0a878'], seed * 719, 'test', SCENARIOS[3]);
      const a = e.defaultAction('consistent'); a.shot = 'cross';
      e.apply(a, 0, 100); const d = e.state.decisions[0];
      if (d.ball.outcome === 'Bola fora' || d.ball.outcome === 'Bola na rede') {expect(d.shotIQ).toBeGreaterThan(75); found = true; break;}
    }
    expect(found).toBe(true);
  });
  it('exclui aproximação em defesa profunda e oferece lob/passing contra rede', () => {
    const e = new TacticalEngine('academy', ['A','B'], ['#ddeb78','#f0a878'], 1, 'x', SCENARIOS[10]); expect(e.state.options).not.toContain('approach');
    const n = new TacticalEngine('academy', ['A','B'], ['#ddeb78','#f0a878'], 1, 'y', SCENARIOS[11]); expect(n.state.options).toContain('passing'); expect(n.state.options).toContain('lob-attack');
  });
  it('não aceita placar nem campos extras no contrato do cliente', () => {
    expect(actionSchema.safeParse({...engine().defaultAction(), score: [99, 0]}).success).toBe(false);
    expect(actionSchema.safeParse({...engine().defaultAction(), target: {x: Infinity, y: 12}}).success).toBe(false);
  });
});
describe('Voleios e interceptação na rede', () => {
  function towardNet(receiver: PlayerId = 1, shot: ShotId = 'cross', netX = 0, receiverDepth = 3.5, receiverSpeed = BALANCE.speed) {
    const e = new TacticalEngine('academy', ['A','B'], ['#ddeb78','#f0a878'], 42, 'net', SCENARIOS[3]);
    const s = e.state, hitter = other(receiver); s.turn = hitter;
    s.players[hitter].position = {x: 0, y: side(hitter) * 11.2};
    s.players[receiver].position = {x: netX, y: side(receiver) * receiverDepth};
    s.players[receiver].destination = {x: 0, y: side(receiver) * 3.5};
    s.players[receiver].speed = receiverSpeed;
    s.ball!.contact = {...s.players[hitter].position}; s.ball!.hitter = receiver;
    s.ball!.contactType = 'bounce';
    e.apply({id: 'incoming', turnId: s.turnId, shot, target: {x: 0, y: side(hitter) * 12.6}}, hitter, 100);
    return e;
  }
  it.each([0,1] as const)('o jogador %i intercepta antes do quique e recebe os três voleios', id => {
    const e = towardNet(id), d = e.state.decisions[0];
    expect(d.ball.contactType).toBe('volley'); expect(Math.abs(d.ball.contact.y)).toBeCloseTo(3.5);
    expect(Math.abs(d.ball.contact.y)).toBeLessThan(Math.abs(d.ball.to.y));
    expect(distance(d.before[id], d.after[id])).toBeLessThanOrEqual(e.state.players[id].speed * d.ball.flight);
    animate(e); expect(e.state.turn).toBe(id); expect(e.state.options).toEqual(['volley-deep', 'volley-angle', 'volley-block']);
    expect(Math.abs(e.state.players[id].position.y)).toBeLessThan(6.4);
  });
  it.each(['volley-deep', 'volley-angle', 'volley-block'] as const)('%s pode ser executado e recebe explicação própria', shot => {
    const e = towardNet(); animate(e);
    const action = {id: shot, turnId: e.state.turnId, shot, target: {x: 0, y: -3.1}};
    expect(actionSchema.safeParse(action).success).toBe(true);
    e.apply(action, 1, 100); const d = e.state.decisions.at(-1)!;
    expect(d.shot).toBe(shot); expect(d.explanation).toContain('antes do quique');
    expect(Math.abs(d.from.y)).toBeCloseTo(3.5); expect(d.alternative).toMatch(/lob|cobertura|ângulos/);
  });
  it('só planejar ir à rede não libera voleio antes da chegada real', () => {
    const e = towardNet(1, 'cross', 0, 12.6);
    expect(e.state.ball!.contactType).toBe('bounce'); animate(e);
    expect(e.state.options.some(id => id.startsWith('volley-'))).toBe(false);
    expect(() => e.apply({id: 'invalid-volley', turnId: e.state.turnId, shot: 'volley-deep', target: {x:0,y:-3.5}}, 1, 100)).toThrow('disponível');
  });
  it('interceptar na rede reduz o tempo disponível em relação à resposta após o quique', () => {
    const volley = towardNet(), ground = towardNet(1, 'cross', 0, 12.6);
    expect(volley.state.ball!.flight).toBeLessThan(ground.state.ball!.flight);
    expect(volley.state.ball!.contact.y).toBeGreaterThan(ground.state.ball!.contact.y);
  });
  it('um lob passa por cima sem virar voleio', () => {
    const e = towardNet(1, 'lob-defense');
    expect(e.state.ball!.height).toBe('high'); expect(e.state.ball!.contactType).toBe('bounce');
    animate(e); expect(e.state.options.some(id => id.startsWith('volley-'))).toBe(false);
  });
  it('a raquete não alcança uma interceptação impossível por teletransporte', () => {
    const e = towardNet(1, 'cross', -6.5, 3.5, 1), d = e.state.decisions[0];
    expect(d.ball.contactType).toBe('bounce');
    expect(distance(d.before[1], d.after[1])).toBeLessThanOrEqual(d.ball.flight);
    animate(e); expect(e.state.winner).toBe(0);
  });
  it('não permite devolver o saque de voleio', () => {
    const e = engine(); e.apply(e.defaultAction(), 1, 100); animate(e);
    e.state.seed = 42; e.state.players[1].position = {x: 0, y: -3.5};
    e.apply({...e.defaultAction('aggressive'), shot: 'serve-t', serveType: 'kick'}, 0, 100);
    expect(e.state.ball!.contactType).toBe('bounce'); animate(e);
    expect(e.state.options.some(id => id.startsWith('volley-'))).toBe(false);
  });
  it('bots e defesa automática utilizam o mesmo voleio e preservam uma posição de rede', () => {
    for (const style of ['consistent', 'aggressive', 'defensive', 'timeout'] as const) {
      const e = towardNet(); animate(e); const a = e.defaultAction(style);
      expect(a.shot).toMatch(/^volley-/); expect(Math.abs(a.target.y)).toBeLessThan(6.4);
      e.apply(a, 1, 100, style === 'timeout');
      expect(e.state.decisions.at(-1)!.automatic).toBe(style === 'timeout');
    }
  });
  it('o voleio também pode falhar na execução', () => {
    let errors = 0, successes = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const e = towardNet(); animate(e); e.state.seed = seed * 719;
      e.apply({id: 'volley', turnId: e.state.turnId, shot: 'volley-angle', target: {x:0,y:-3.1}}, 1, 100);
      if (['Bola fora', 'Bola na rede'].includes(e.state.decisions.at(-1)!.ball.outcome)) errors++; else successes++;
    }
    expect(errors).toBeGreaterThan(0); expect(successes).toBeGreaterThan(0);
  });
});
describe('Balanceamento amostral reproduzível', () => {
  it('termina partidas, mantém rallies variados e velocidades limitadas nos três estilos', () => {
    const summary: Record<string, any> = {};
    for (const style of ['consistent', 'aggressive', 'defensive'] as const) {
      let shots = 0, points = 0, winners = 0, longest = 0, serversWon = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const e = engine(seed * 719);
        let iterations = 0;
        while (e.state.phase !== 'MATCH_FINISHED' && iterations++ < 120) {
          playPoint(e, style); const p = e.state.points.at(-1)!;
          points++; shots += p.decisions.length; longest = Math.max(longest, p.decisions.length);
          if (['Winner','Ace'].includes(p.reason)) winners++;
          if (p.winner === p.server) serversWon++;
          for (const d of p.decisions) for (const i of [0,1] as const) expect(distance(d.before[i], d.after[i])).toBeLessThanOrEqual(BALANCE.speed * d.ball.flight + .00001);
          if ((e.state as GameState).phase !== 'MATCH_FINISHED') e.setupPoint();
        }
        expect(iterations).toBeLessThan(120); expect(tiebreakWon(e.state.score)).toBe(true);
      }
      summary[style] = {points, mean: +(shots / points).toFixed(2), winnerRate: +(winners / points).toFixed(2), serverWinRate: +(serversWon / points).toFixed(2), longest};
      expect(shots / points).toBeGreaterThan(2); expect(shots / points).toBeLessThan(25); expect(winners / points).toBeLessThan(.7); expect(serversWon / points).toBeLessThan(.8); expect(serversWon / points).toBeGreaterThan(.2);
    }
    console.log('BALANCEAMENTO', JSON.stringify(summary));
  });
});
