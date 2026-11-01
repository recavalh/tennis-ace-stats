import { SHOTS } from '../../../packages/game-engine/src/config';
import type { GameState } from '../../../packages/shared/src/index';
export const CLIENT_BUILD_ID = typeof __APP_BUILD_ID__ === 'string' ? __APP_BUILD_ID__ : 'development';
export function isBuildMismatch(client: string, server: unknown) {
  return typeof server === 'string' && server.length > 0 && client !== 'development' && server !== 'development' && client !== server;
}
export function hasUnknownShot(state: GameState | null) {
  if (!state) return false;
  return [...state.options, ...(state.ball ? [state.ball.shot] : [])].some(id => !Object.prototype.hasOwnProperty.call(SHOTS, id));
}
