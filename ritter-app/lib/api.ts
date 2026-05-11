import { supabase } from './supabase';
import type { Database } from './database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type GameSession = Database['public']['Tables']['game_sessions']['Row'];
type SessionPlayer = Database['public']['Tables']['session_players']['Row'];

// ──────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, username: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(callback);
}

// ──────────────────────────────────────────────────────────
// PROFILE
// ──────────────────────────────────────────────────────────

export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function updatePath(path: 'light' | 'shadow') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  return supabase.from('profiles').update({ path }).eq('id', user.id);
}

export async function addXP(amount: number, source: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.rpc('add_xp', {
    p_player_id: user.id,
    p_amount: amount,
    p_source: source,
  });

  return data;
}

// ──────────────────────────────────────────────────────────
// GAME SESSION
// ──────────────────────────────────────────────────────────

export async function createSession(
  gameType: GameSession['game_type'],
  difficulty: 1 | 2 | 3,
): Promise<GameSession | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Join-Code generieren
  const { data: codeData } = await supabase.rpc('generate_join_code');
  const joinCode: string = codeData ?? Math.random().toString(36).slice(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      host_id: user.id,
      game_type: gameType,
      difficulty,
      join_code: joinCode,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) { console.error('createSession:', error); return null; }
  return data;
}

export async function joinSession(
  joinCode: string,
  seatIndex: number,
  path: 'light' | 'shadow',
  guestName?: string,
): Promise<{ session: GameSession; player: SessionPlayer } | null> {
  // Session per Code suchen
  const { data: session, error: sErr } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('join_code', joinCode.toUpperCase())
    .eq('status', 'waiting')
    .single();

  if (sErr || !session) { console.error('Session nicht gefunden'); return null; }

  const { data: { user } } = await supabase.auth.getUser();

  // Als Spieler beitreten
  const { data: player, error: pErr } = await supabase
    .from('session_players')
    .insert({
      session_id: session.id,
      player_id: user?.id ?? null,
      guest_name: guestName ?? null,
      seat_index: seatIndex,
      path,
    })
    .select()
    .single();

  if (pErr) { console.error('joinSession:', pErr); return null; }
  return { session, player };
}

export async function getSessionPlayers(sessionId: string): Promise<SessionPlayer[]> {
  const { data } = await supabase
    .from('session_players')
    .select(`
      *,
      profile:profiles(username, level, path, silver, gold)
    `)
    .eq('session_id', sessionId);

  return data ?? [];
}

// Realtime: Mitspieler in Echtzeit beobachten
export function subscribeToSession(
  sessionId: string,
  callback: (players: SessionPlayer[]) => void,
) {
  const channel = supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${sessionId}` },
      async () => {
        const players = await getSessionPlayers(sessionId);
        callback(players);
      },
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export async function startSession(sessionId: string) {
  return supabase
    .from('game_sessions')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', sessionId);
}

export async function finishSession(sessionId: string) {
  return supabase
    .from('game_sessions')
    .update({ status: 'finished', finished_at: new Date().toISOString() })
    .eq('id', sessionId);
}

// ──────────────────────────────────────────────────────────
// INVENTAR
// ──────────────────────────────────────────────────────────

export async function getInventory() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('inventory')
    .select('*')
    .eq('player_id', user.id);

  return data ?? [];
}

export async function buyItem(itemId: string, silverCost: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Silber abziehen
  const { data: profile } = await supabase
    .from('profiles')
    .select('silver')
    .eq('id', user.id)
    .single();

  if (!profile || profile.silver < silverCost) return { error: 'Nicht genug Silber' };

  // Transaktion: Silber abziehen + Item hinzufügen
  await supabase.from('profiles').update({ silver: profile.silver - silverCost }).eq('id', user.id);

  return supabase
    .from('inventory')
    .upsert({ player_id: user.id, item_id: itemId, quantity: 1 }, { onConflict: 'player_id,item_id' });
}
