import type { ShotDefinition } from '../../shared/src/index';
// Parâmetros de jogo: não são estatísticas científicas de desempenho humano.
export const BALANCE = { speed: 4.6, reaction: 0.22, reach: 1.35, tolerance: 0.2, imbalance: 0.13, animationMs: 1150, serveAnimationMs: 1300, minFlight: 0.62, normalFlightExtra: .27, highFlightExtra: 1.45, shortFlightExtra: .65, volleyZone: 6.4, volleyFlightExtra: .12, recoveryFactor: 0.8, fatigueStartsAt: 18, fatiguePerShot: .006 };
export const SHOTS: Record<string, ShotDefinition> = Object.fromEntries(([
  ['serve-wide', 'Saque aberto', 'Saque para o lado', 'Tire o devolvedor da quadra.', .12, 31, 5.3, 2.9, .5, .8, 'low'],
  ['serve-body', 'Saque no corpo', 'Saque no corpo', 'Reduza o espaço para preparar a devolução.', .07, 29, 5.5, 0, .4, .5, 'normal'],
  ['serve-t', 'Saque no T', 'Saque no meio', 'Busque o centro do quadrado de serviço.', .11, 34, 5.6, .4, .5, .8, 'low'],
  ['deep-middle', 'Profunda no meio', 'Fundo e no meio', 'Reduza os ângulos e neutralize a pressão.', .035, 18, 10.5, 0, .3, .3, 'normal'],
  ['cross', 'Cruzada profunda', 'Bola cruzada', 'Use a diagonal longa para construir espaço.', .065, 21, 10.7, 3.1, .45, .6, 'normal'],
  ['line', 'Paralela profunda', 'Bola pela linha', 'Mude a direção; há menos margem sobre a rede.', .12, 23, 10.8, 3.3, .75, .85, 'low'],
  ['angle', 'Curta e angulada', 'Ângulo curtinho', 'Abra a quadra com uma bola curta na diagonal.', .14, 16, 4, 3.7, .7, .8, 'low'],
  ['approach', 'Bola de aproximação', 'Bater e ir à rede', 'Ataque a bola curta e prepare a cobertura.', .09, 22, 10, 2.7, .6, .8, 'normal'],
  ['volley-deep', 'Voleio profundo', 'Voleio para o fundo', 'Intercepte sem quique e mantenha o rival no fundo.', .065, 19, 9.8, 2.8, .55, .7, 'low'],
  ['volley-angle', 'Voleio angulado', 'Voleio para o lado', 'Abra o ângulo na rede; exige mais controle e equilíbrio.', .15, 14, 3.8, 3.6, .85, .95, 'low'],
  ['volley-block', 'Voleio de bloqueio', 'Só bloquear a bola', 'Use a velocidade recebida e reduza o risco na rede.', .035, 14, 8.5, .8, .3, .35, 'normal'],
  ['lob-defense', 'Lob defensivo', 'Lob para respirar', 'Ganhe tempo com altura e profundidade.', .075, 12, 10.4, 0, .25, .2, 'high'],
  ['lob-attack', 'Lob ofensivo', 'Por cima do rival', 'Supere o adversário que está na rede.', .15, 14, 10.6, 2, .65, .9, 'high'],
  ['passing', 'Passing shot', 'Passe pelo rival', 'Encontre uma passagem ao lado de quem fecha a rede.', .14, 25, 9, 3.6, .7, 1, 'low'],
  ['high', 'Alta de recuperação', 'Bola alta', 'Devolva uma bola alta para recuperar o equilíbrio.', .035, 13, 10.5, 1.3, .2, .2, 'high'],
  ['safe', 'Bola de segurança', 'Bola com calma', 'Mantenha a bola em jogo com boa margem.', .025, 16, 9.7, 1.1, .2, .2, 'normal'],
] as const).map(([id, label, childLabel, description, risk, power, depth, angle, balance, offense, height]) => [id, { id, label, childLabel, description, risk, power, depth, angle, balance, offense, height }])) as Record<string, ShotDefinition>;
