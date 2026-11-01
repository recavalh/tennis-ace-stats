import {useEffect, useRef, useState} from 'react';
import {createClient, type Session, type SupabaseClient} from '@supabase/supabase-js';

export const GAME_SERVER_URL = (import.meta.env.VITE_GAME_SERVER_URL ?? '').replace(/\/$/, '');
export const SITE_URL = import.meta.env.DEV ? location.protocol + '//' + location.hostname + ':8080' : 'https://ace-stats.com';
export const apiUrl = (path: string) => GAME_SERVER_URL + path;
export function readLocal(key: string): string | null {try {return localStorage.getItem(key);} catch {return null;}}
export function writeLocal(key: string, value?: string) {try {if (value === undefined) localStorage.removeItem(key); else localStorage.setItem(key, value);} catch { /* Guest access can continue without browser storage. */ }}
export function readRoom(): {code: string; token: string} | null {
  try {const room = JSON.parse(sessionStorage.getItem('tennis.room.v1') ?? 'null'); return room && typeof room.code === 'string' && typeof room.token === 'string' ? room : null;}
  catch {sessionStorage.removeItem('tennis.room.v1'); return null;}
}

type Config = {enabled: boolean; url?: string; publishableKey?: string};
export function useAccount() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const client = useRef<SupabaseClient | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false, unsubscribe: (() => void) | undefined;
    const controller = new AbortController();
    async function initialize() {
      setLoading(true); setError('');
      try {
        const response = await fetch(apiUrl('/api/auth/config'), {cache: 'no-store', signal: controller.signal});
        if (!response.ok) throw new Error('Não foi possível conectar. Tente novamente em instantes.');
        const config = await response.json() as Config;
        if (cancelled) return;
        if (!config.enabled || !config.url || !config.publishableKey) {setEnabled(false); return;}
        const auth = createClient(config.url, config.publishableKey, {auth: {flowType: 'pkce', persistSession: true, detectSessionInUrl: true}});
        client.current = auth; setEnabled(true);
        const {data, error: sessionError} = await auth.auth.getSession();
        if (cancelled) return;
        if (sessionError) throw new Error('Não foi possível concluir o acesso. Tente entrar novamente.');
        setSession(data.session);
        if (location.pathname === '/auth/callback') {
          let returnTo = sessionStorage.getItem('ace.auth.return') ?? '/';
          sessionStorage.removeItem('ace.auth.return');
          if (!returnTo.startsWith('/') || returnTo.startsWith('//')) returnTo = '/';
          if (!data.session) setError('O acesso não foi concluído. Você pode tentar novamente ou jogar como visitante.');
          history.replaceState(null, '', returnTo);
        }
        const listener = auth.auth.onAuthStateChange((_event, next) => {if (!cancelled) setSession(next);});
        unsubscribe = () => listener.data.subscription.unsubscribe();
      } catch (cause) {
        if (!cancelled) setError('Não foi possível conectar sua conta. Tente novamente em instantes.');
      } finally {if (!cancelled) setLoading(false);}
    }
    void initialize();
    return () => {cancelled = true; controller.abort(); unsubscribe?.();};
  }, [attempt]);
  async function signIn() {
    setError('');
    if (!client.current) {setError('O acesso com Google estará disponível em breve. Você já pode jogar como visitante.'); return;}
    const returnTo = location.pathname === '/auth/callback' ? '/' : location.pathname + location.search;
    sessionStorage.setItem('ace.auth.return', returnTo);
    const {error: failure} = await client.current.auth.signInWithOAuth({provider: 'google', options: {redirectTo: location.origin + '/auth/callback', queryParams: {prompt: 'select_account'}}});
    if (failure) setError('Não foi possível abrir o acesso com Google. Tente novamente.');
  }
  async function signOut() {
    const result = await client.current?.auth.signOut({scope: 'local'});
    if (result?.error) {setError('Não foi possível sair. Tente novamente.'); return false;}
    setSession(null);
    return true;
  }
  return {session, loading, enabled, error, signIn, signOut, retry: () => setAttempt(value => value + 1)};
}
