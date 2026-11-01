export const GAME_URL = import.meta.env.VITE_GAME_URL ||
  (import.meta.env.DEV ? window.location.protocol + "//" + window.location.hostname + ":3100" : "https://app.ace-stats.com");

export function gameUrl(mode?: "academy" | "computer" | "duel") {
  const url = new URL(GAME_URL);
  if (mode) url.searchParams.set("modo", mode);
  return url.toString();
}
