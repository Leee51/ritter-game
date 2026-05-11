// Auto-generated from Supabase schema
// Run: npx supabase gen types typescript --project-id <id> > lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {

      // ── Spieler-Profile ──────────────────────────────
      profiles: {
        Row: {
          id: string;                        // uuid, FK → auth.users
          username: string;
          path: 'light' | 'shadow';
          level: number;
          xp: number;
          xp_to_next: number;
          silver: number;
          gold: number;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      // ── Inventar ─────────────────────────────────────
      inventory: {
        Row: {
          id: string;
          player_id: string;               // FK → profiles.id
          item_id: string;                 // z.B. 'holzschild', 'xptrank'
          quantity: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['inventory']['Insert']>;
      };

      // ── Spielsessions ────────────────────────────────
      game_sessions: {
        Row: {
          id: string;
          host_id: string;                 // FK → profiles.id
          game_type: 'heisse_fackel' | 'werwolf' | 'imposter' | 'kutschen';
          difficulty: 1 | 2 | 3;
          status: 'waiting' | 'active' | 'finished';
          join_code: string;               // 6-stelliger Code
          max_players: number;
          created_at: string;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['game_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['game_sessions']['Insert']>;
      };

      // ── Session-Spieler ──────────────────────────────
      session_players: {
        Row: {
          id: string;
          session_id: string;              // FK → game_sessions.id
          player_id: string | null;        // null = Gast
          guest_name: string | null;
          seat_index: number;
          path: 'light' | 'shadow';
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['session_players']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['session_players']['Insert']>;
      };

      // ── XP-Log ───────────────────────────────────────
      xp_log: {
        Row: {
          id: string;
          player_id: string;
          source: string;                  // z.B. 'heisse_fackel_win', 'item_use'
          amount: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['xp_log']['Row'], 'id' | 'created_at'>;
        Update: never;
      };

    };
  };
}
