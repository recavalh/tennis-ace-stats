import { COURT, type Scenario, type Vec } from '../../../packages/shared/src/index';
import { courtLinePath } from './courtDrawing';

// Vista horizontal: as linhas de fundo ficam à esquerda e à direita.
const horizontal = (scale: number, cx = 0, cy = 0) => (p: Vec): Vec => ({x:cx-p.y*scale,y:cy+p.x*scale});
export function MiniCourt({scenario}: {scenario: Scenario}) {
  const scale = Math.min(7.7, 108 / Math.max(14, Math.abs(scenario.player.y), Math.abs(scenario.opponent.y), Math.abs(scenario.incoming.y)));
  const project = horizontal(scale,125,66);
  const player = project(scenario.player), rival = project(scenario.opponent), contact = project(scenario.incoming);
  const length = COURT.length*scale, width = COURT.width*scale;
  const ball = {x:rival.x+(contact.x-rival.x)*.61,y:rival.y+(contact.y-rival.y)*.61};
  return <svg className="mini-court" viewBox="0 0 250 132" aria-hidden="true">
    <rect x="4" y="2" width="242" height="128" rx="8" fill="#edf0e5"/>
    <rect x={125-length/2} y={66-width/2} width={length} height={width} fill="#e4ebdb"/>
    <path d={courtLinePath(project)} fill="none" stroke="#a7bba0" strokeWidth="1.1"/>
    <path d={`M125 ${66-width/2-5}V${66+width/2+5}`} fill="none" stroke="#718c70" strokeWidth="2.1"/>
    <path d={`M123.9 ${66-width/2-5}V${66+width/2+5}`} fill="none" stroke="#f8faef" strokeWidth=".8"/>
    <path d={`M${rival.x} ${rival.y}L${contact.x} ${contact.y}`} fill="none" stroke="#76975f" strokeWidth="1.4" strokeDasharray="4 4"/>
    <circle cx={ball.x} cy={ball.y} r="3" fill="#afbf48" stroke="#f7f9e6" strokeWidth="1"/>
    <circle cx={player.x} cy={player.y} r="5.5" fill="#426650" stroke="#f3f6e9" strokeWidth="1.8"/>
    <circle cx={rival.x} cy={rival.y} r="5.5" fill="#dc946b" stroke="#f3f6e9" strokeWidth="1.8"/>
  </svg>;
}

export function HeroCourt() {
  const scale = 18, project = horizontal(scale);
  const length = COURT.length*scale, width = COURT.width*scale;
  return <svg className="hero-court" viewBox="0 0 620 440" role="img" aria-label="Quadra de simples com rede central, quadrados de saque e trajetória cruzada">
    <defs>
      <pattern id="court-grain" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#c1d1ac" opacity=".12"/></pattern>
      <linearGradient id="court-surface" x2="0" y2="1"><stop stopColor="#54856a"/><stop offset="1" stopColor="#4e785a"/></linearGradient>
      <filter id="court-shadow"><feDropShadow dx="0" dy="10" stdDeviation="8" floodOpacity=".2"/></filter>
    </defs>
    <g transform="translate(310 205) rotate(-17)">
      <rect x="-255" y="-133" width="510" height="266" rx="5" fill="#12382d" filter="url(#court-shadow)"/>
      <rect x={-length/2} y={-width/2} width={length} height={width} fill="url(#court-surface)"/>
      <rect x={-length/2} y={-width/2} width={length} height={width} fill="url(#court-grain)"/>
      <path d={courtLinePath(project)} fill="none" stroke="#e0e7d0" strokeWidth="2" opacity=".9"/>
      <path d="M3 -91V91" stroke="#0c2d26" strokeWidth="7"/>
      <path d="M0 -91V91" stroke="#f1eedb" strokeWidth="2"/>
      <path d="M-198 54Q0 35 180 -45" fill="none" stroke="#daee86" strokeWidth="2.5" strokeDasharray="7 7"/>
      <path d="m168 -47 13 1-8 10" fill="none" stroke="#daee86" strokeWidth="2.5"/>
      <path d="M-198 54H-96" stroke="#dce8d0" strokeWidth="1.5" strokeDasharray="4 5" opacity=".6"/>
      <circle cx="-96" cy="54" r="17" fill="none" stroke="#dbe5ce" strokeDasharray="3 5" opacity=".6"/>
      <circle cx="-198" cy="60" r="16" fill="#0a281e" opacity=".28"/>
      <circle cx="-198" cy="54" r="13" fill="#dfec8e" stroke="#214a38" strokeWidth="4"/>
      <circle cx="-198" cy="51" r="5" fill="#f8edcd"/>
      <circle cx="189" cy="-45" r="13" fill="#edaa83" stroke="#284a37" strokeWidth="4"/>
      <circle cx="189" cy="-48" r="5" fill="#f8edcd"/>
      <circle cx="24" cy="12" r="5" fill="#effc98"/>
      <circle cx="24" cy="12" r="11" fill="#e6f58b" opacity=".1"/>
    </g>
    <g transform="translate(416 30)"><rect width="156" height="52" rx="9" fill="#f6f5e9"/><circle cx="24" cy="26" r="11" fill="#dce8be"/><path d="m19 27 4 4 7-9" stroke="#3b5940" fill="none" strokeWidth="2"/><text x="44" y="23" fill="#294238" fontSize="10" fontWeight="700" fontFamily="Arial">CRUZADA PROFUNDA</text><text x="44" y="37" fill="#738274" fontSize="9" fontFamily="Arial">Construa o próximo espaço.</text></g>
    <g transform="translate(30 336)"><rect width="190" height="50" rx="9" fill="#f6f5e9"/><circle cx="24" cy="25" r="10" fill="none" stroke="#577b5c" strokeDasharray="3 2"/><text x="43" y="22" fill="#294238" fontSize="9.5" fontWeight="700" fontFamily="Arial">PENSE NA RECUPERAÇÃO</text><text x="43" y="36" fill="#738274" fontSize="8.5" fontFamily="Arial">O ponto continua depois do golpe.</text></g>
  </svg>;
}
