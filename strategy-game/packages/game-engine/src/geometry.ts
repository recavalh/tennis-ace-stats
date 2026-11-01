import { COURT, side, type PlayerId, type Vec } from '../../shared/src/index';
import { BALANCE } from './config';
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
export function moveToward(from: Vec, to: Vec, seconds: number, speed = BALANCE.speed): Vec {
  const d = distance(from, to), ratio = d === 0 ? 0 : Math.min(1, Math.max(0, seconds) * speed / d);
  return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
}
export const validPosition = (p: Vec, id: PlayerId) => Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) <= COURT.sideline && p.y * side(id) >= .65 && p.y * side(id) <= COURT.runback;
export const legalServe = (to: Vec, id: PlayerId, serveSide: 'deuce' | 'ad') => to.y * side(id) <= 0 && Math.abs(to.y) <= COURT.service && Math.abs(to.x) <= COURT.halfWidth && to.x * side(id) * (serveSide === 'deuce' ? 1 : -1) <= 0;
export function coverage(contact: Vec, id: PlayerId, atNet = false): Vec {
  // Bissecção aproximada das direções possíveis: depende do ponto de contato adversário.
  const depth = atNet ? 3.1 : 12.6;
  const y = side(id) * depth;
  const a = Math.atan2(-COURT.halfWidth - contact.x, y - contact.y);
  const b = Math.atan2(COURT.halfWidth - contact.x, y - contact.y);
  let x = contact.x + (y - contact.y) * Math.tan((a + b) / 2);
  // Para a metade de cima, atan2 cruza o ramo de pi; a aproximação linear é estável.
  if (id === 1) x = contact.x * (atNet ? .65 : .36);
  return { x: clamp(x, -2.8, 2.8), y };
}
