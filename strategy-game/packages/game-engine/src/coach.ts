import { side, type Decision, type GameState, type PlayerId, type ShotId, type Vec } from '../../shared/src/index';
import { SHOTS } from './config';
import { clamp, coverage, distance } from './geometry';
export class TacticalCoach {
  static evaluate(state: GameState, player: PlayerId, shot: ShotId, recovery: Vec, incoming: Vec, target: Vec, automatic: boolean) {
    const me = state.players[player], rival = state.players[player === 0 ? 1 : 0];
    const def = SHOTS[shot], underPressure = (state.ball?.difficulty ?? 0) > .52 || me.balance < .5;
    const short = incoming.y * side(player) < 8, net = Math.abs(rival.position.y) < 5;
    const goingNet = recovery.y * side(player) < 6;
    const volley = shot.startsWith('volley-');
    const recommended = coverage(target, player, goingNet && short && (def.offense > .5 || volley));
    let shotIQ = 78 - def.risk * 70;
    if (underPressure) shotIQ += ['high', 'lob-defense', 'safe', 'deep-middle'].includes(shot) ? 15 : -22 * def.offense;
    if (short && ['approach', 'angle', 'line'].includes(shot)) shotIQ += 17;
    if (net && ['passing', 'lob-attack', 'lob-defense'].includes(shot)) shotIQ += 19;
    if (!net && shot === 'lob-attack') shotIQ -= 18;
    if (shot === 'cross' && !underPressure) shotIQ += 10;
    if (shot === 'line' && !underPressure && Math.abs(target.x - rival.position.x) > 4) shotIQ += 14;
    if (state.rally === 1 && shot === 'deep-middle') shotIQ += 12;
    if (volley) shotIQ += underPressure ? shot === 'volley-block' ? 15 : -15 * def.offense : shot === 'volley-angle' ? Math.abs(target.x - rival.position.x) > 3 ? 22 : -8 : shot === 'volley-block' ? 3 : 12;
    const positionIQ = clamp(96 - distance(recovery, recommended) * 9 - (goingNet && !short ? 23 : 0) - (automatic ? 9 : 0), 12, 99);
    let explanation: string, alternative: string;
    if (volley) {
      explanation = shot === 'volley-block' ? 'Você escolheu o voleio de bloqueio e rebateu antes do quique. O gesto compacto usa a velocidade da bola e ajuda a controlar uma resposta difícil na rede.' : shot === 'volley-angle' ? `Você escolheu o voleio angulado antes do quique. ${Math.abs(target.x - rival.position.x) > 3 ? 'O ângulo explora o lado distante do rival e reduz seu tempo de reação.' : 'O rival já estava perto desse lado; o ângulo exige controle sem garantir espaço livre.'}` : 'Você escolheu o voleio profundo e interceptou antes do quique. A profundidade mantém o rival longe da rede, e a interceptação reduz o tempo de recuperação dele.';
      alternative = underPressure && shot !== 'volley-block' ? 'Sob pressão, considere bloquear o voleio e manter a cobertura antes de buscar um ângulo curto.' : goingNet ? 'Acompanhe a direção do voleio para cobrir a passada e mantenha espaço para reagir a um lob.' : 'Se puder manter a iniciativa, cubra os ângulos mais perto da rede em vez de recuar automaticamente ao fundo.';
    } else if (goingNet && !short) {
      explanation = 'Você escolheu subir de uma bola profunda. O trajeto até a rede deixa tempo para o rival preparar uma passada ou um lob.';
      alternative = 'Construa uma bola que force uma resposta curta antes de avançar.';
    } else if (underPressure && ['line', 'angle', 'passing'].includes(shot)) {
      explanation = 'Você mudou a direção sob pressão. O pouco equilíbrio e a margem menor aumentam a dificuldade, mesmo que a bola entre.';
      alternative = 'Considere uma bola alta e profunda para ganhar tempo de recuperação.';
    } else if (net && shot.startsWith('lob')) {
      explanation = `Você escolheu passar por cima do rival, que estava a ${Math.abs(rival.position.y).toFixed(1)} m da rede. A altura explora o espaço atrás dele, com risco de deixar a bola curta.`;
      alternative = 'Uma passada também pode funcionar se o adversário fechar demais o centro.';
    } else if (short && ['approach', 'angle', 'line'].includes(shot)) {
      explanation = 'Você aproveitou o contato dentro da quadra para atacar. A bola curta dá ângulo e reduz o tempo de resposta adversário.';
      alternative = goingNet ? 'Cubra primeiro a direção mais curta da passada e fique atento ao lob.' : 'Se a resposta vier fraca, avance e feche os ângulos.';
    } else if (state.rally === 1 && shot === 'deep-middle') {
      explanation = 'Sua devolução profunda pelo meio diminui os ângulos do sacador. Você troca pressão por uma chance de equilibrar a disputa.';
      alternative = 'Se houver mais tempo e equilíbrio, a cruzada pode deslocar o sacador.';
    } else if (def.height === 'high') {
      explanation = 'Você usou altura e profundidade para ganhar tempo. A trajetória mais lenta permite recuperar mais metros antes da próxima bola.';
      alternative = 'Recupere a cobertura dos ângulos enquanto a bola viaja, sem recuar além do necessário.';
    } else if (shot === 'cross') {
      explanation = 'Sua cruzada usa a diagonal mais longa e desloca o rival. A cobertura deve acompanhar o novo ponto de contato adversário.';
      alternative = positionIQ < 65 ? 'Ajuste a recuperação para a marca sugerida; o centro exato nem sempre cobre os dois lados.' : 'Espere uma bola mais curta ou o espaço abrir antes de acelerar a paralela.';
    } else {
      explanation = `Você escolheu ${def.label.toLowerCase()}. ${Math.abs(target.x - rival.position.x) > 3 ? 'A direção explora o espaço distante do adversário.' : 'O adversário está perto dessa direção e pode preparar a resposta.'}`;
      alternative = 'Compare o espaço vazio com seu equilíbrio antes de assumir mais risco.';
    }
    if (positionIQ < 55) explanation += ' Sua recuperação deixou uma faixa lateral pouco protegida.';
    const vulnerability = {x: recovery.x > recommended.x ? -3.6 : 3.6, y: side(player) * (goingNet ? 11 : 5)};
    return { shotIQ: Math.round(clamp(shotIQ - (automatic ? 12 : 0), 15, 99)), positionIQ: Math.round(positionIQ), recommended, explanation, alternative, vulnerability };
  }
  static child(decision: Decision) {
    const phrase = decision.shotIQ >= 78 ? 'Boa ideia! ' : 'Vamos experimentar outra ideia? ';
    if (decision.shot.startsWith('volley-')) return phrase + `Você escolheu ${SHOTS[decision.shot].childLabel.toLowerCase()} e bateu antes de a bola quicar. ${decision.positionIQ < 60 ? 'Um lado ficou aberto. Tente cobrir a marca pontilhada depois de bater.' : 'Na rede, o rival tem menos tempo. Cubra o lado aberto e fique de olho na bola por cima!'}`;
    return phrase + (decision.ball.height === 'high' ? 'A bola alta dá mais tempo para você voltar para a posição.' : decision.positionIQ < 60 ? 'Um lado ficou aberto. Tente voltar para a marca pontilhada.' : 'Você pensou no golpe e no espaço da quadra. Olhe onde o rival vai bater a próxima bola!');
  }
}
