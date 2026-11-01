export type AccountIdentity = {id: string; email: string; expiresAt?: number};
export type IdentityVerifier = (token: string) => Promise<AccountIdentity>;
export type PublicAuthConfig = {enabled: boolean; url?: string; publishableKey?: string};

export function authConfiguration(): PublicAuthConfig {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url && !key) return {enabled: false};
  if (!url || !key) throw new Error('Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY juntas.');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) throw new Error('A autenticação precisa de HTTPS.');
  let publicKey = key.startsWith('sb_publishable_');
  if (!publicKey && key.split('.').length === 3) {
    try {publicKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon';} catch { /* Invalid key. */ }
  }
  if (!publicKey) throw new Error('Use a chave pública do Supabase. Chaves secretas não podem ser enviadas ao navegador.');
  return {enabled: true, url: url.replace(/\/$/, ''), publishableKey: key};
}

export function identityVerifier(config: PublicAuthConfig): IdentityVerifier {
  return async token => {
    if (!config.enabled || !config.url || !config.publishableKey || token.length > 8192) throw new Error('Entre novamente com Google para continuar.');
    const response = await fetch(config.url + '/auth/v1/user', {
      headers: {apikey: config.publishableKey, Authorization: 'Bearer ' + token},
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('Sua sessão expirou. Entre novamente com Google.');
    const user = await response.json() as {id?: string; email?: string};
    if (!user.id || !/^[0-9a-f-]{36}$/i.test(user.id) || !user.email) throw new Error('Não foi possível confirmar sua conta.');
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as {exp?: number};
    if (typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) throw new Error('Sua sessão expirou.');
    return {id: user.id, email: user.email, expiresAt: claims.exp * 1000};
  };
}
