-- ╔══════════════════════════════════════════════════════════╗
-- ║     KNIGHT'S PASS — Character fields for profiles v2     ║
-- ╚══════════════════════════════════════════════════════════╝

-- Charakter-Felder zum Profil hinzufügen
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hair        text DEFAULT 'blonde',
  ADD COLUMN IF NOT EXISTS hair_style  int  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS beard       text DEFAULT 'none';
