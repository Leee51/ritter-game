import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, ScrollView, Animated, Dimensions,
  StatusBar, Image, ImageBackground, ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import HeisseFackel from './HeisseFackel';
import { supabase } from '../lib/supabase';
import { getMyProfile, signIn, signUp, saveCharacter } from '../lib/api';

const { width } = Dimensions.get('window');

// ═══════════════════════════════════════════════════
// BILDER
// ═══════════════════════════════════════════════════
const IMG = {
  background: require('../assets/images/background/travern_background.png'),
  tables: {
    1:  require('../assets/images/Tables/Table lvl 1.png'),
    5:  require('../assets/images/Tables/Table lvl 5.png'),
    10: require('../assets/images/Tables/Table lvl 10.png'),
    15: require('../assets/images/Tables/Table lvl 15.png'),
    20: require('../assets/images/Tables/Table lvl 20.png'),
    30: require('../assets/images/Tables/Table lvl 30.png'),
  },
  games: {
    heisse_fackel: require('../assets/images/games/fackel (heissseFackel).png'),
    werwolf:       require('../assets/images/games/Geheimeschriftrolle (werwolf) .png'),
    kutschen:      require('../assets/images/games/Kartenspiel(Busfahrer).png'),
    imposter:      require('../assets/images/games/Maske(imposter).png'),
  },
  gold:      require('../assets/images/ui/gold-coin.png'),
  silver:    require('../assets/images/ui/silver-coin.png'),
  alchemist: require('../assets/images/ui/Alchemist.png'),
  chars: {
    light: [
      require('../assets/images/charackters/licht lvl 1.png'),
      require('../assets/images/charackters/licht lvl 2.png'),
      require('../assets/images/charackters/licht lvl 3.png'),
      require('../assets/images/charackters/licht lvl 4.png'),
      require('../assets/images/charackters/licht lvl 5.png'),
      require('../assets/images/charackters/licht lvl 6.png'),
      require('../assets/images/charackters/licht lvl 7.png'),
      require('../assets/images/charackters/licht lvl 8.png'),
      require('../assets/images/charackters/licht lvl 9.png'),
    ],
    shadow: [
      require('../assets/images/charackters/schatten lvl 1.png'),
      require('../assets/images/charackters/schatten lvl 2.png'),
      require('../assets/images/charackters/schatten lvl 3.png'),
      require('../assets/images/charackters/schatten lvl 4.png'),
      require('../assets/images/charackters/schatten lvl 5.png'),
      require('../assets/images/charackters/schatten lvl 6.png'),
      require('../assets/images/charackters/schatten lvl 7.png'),
      require('../assets/images/charackters/schatten lvl 8.png'),
      require('../assets/images/charackters/schatten lvl 9.png'),
    ],
  },
};

// ═══════════════════════════════════════════════════
// BART & HAAR BILDER
// ═══════════════════════════════════════════════════
// Bärte: 4 Farben × 6 Stile
const BEARD_IMGS: Record<string, Record<string, any>> = {
  brown: {
    goatee: require('../assets/images/beards/brown_goatee.png'),
    short:  require('../assets/images/beards/brown_short.png'),
    medium: require('../assets/images/beards/brown_medium.png'),
    full:   require('../assets/images/beards/brown_full.png'),
    large:  require('../assets/images/beards/brown_large.png'),
    viking: require('../assets/images/beards/brown_viking.png'),
  },
  black: {
    goatee: require('../assets/images/beards/black_goatee.png'),
    short:  require('../assets/images/beards/black_short.png'),
    medium: require('../assets/images/beards/black_medium.png'),
    full:   require('../assets/images/beards/black_full.png'),
    large:  require('../assets/images/beards/black_large.png'),
    viking: require('../assets/images/beards/black_viking.png'),
  },
  blonde: {
    goatee: require('../assets/images/beards/blonde_goatee.png'),
    short:  require('../assets/images/beards/blonde_short.png'),
    medium: require('../assets/images/beards/blonde_medium.png'),
    full:   require('../assets/images/beards/blonde_full.png'),
    large:  require('../assets/images/beards/blonde_large.png'),
    viking: require('../assets/images/beards/blonde_viking.png'),
  },
  red: {
    goatee: require('../assets/images/beards/red_goatee.png'),
    short:  require('../assets/images/beards/red_short.png'),
    medium: require('../assets/images/beards/red_medium.png'),
    full:   require('../assets/images/beards/red_full.png'),
    large:  require('../assets/images/beards/red_large.png'),
    viking: require('../assets/images/beards/red_viking.png'),
  },
};

// Haare: 4 Farben × 3 Stile
const HAIR_IMGS: Record<string, any[]> = {
  blonde: [
    require('../assets/images/hair/blonde_0.png'),
    require('../assets/images/hair/blonde_1.png'),
    require('../assets/images/hair/blonde_2.png'),
  ],
  brown: [
    require('../assets/images/hair/brown_0.png'),
    require('../assets/images/hair/brown_1.png'),
    require('../assets/images/hair/brown_2.png'),
  ],
  red: [
    require('../assets/images/hair/red_0.png'),
    require('../assets/images/hair/red_1.png'),
    require('../assets/images/hair/red_2.png'),
  ],
  white: [
    require('../assets/images/hair/white_0.png'),
    require('../assets/images/hair/white_1.png'),
    require('../assets/images/hair/white_2.png'),
  ],
  // Schwarz und Blau nutzen brown/black als Fallback
  black: [
    require('../assets/images/hair/brown_0.png'),
    require('../assets/images/hair/brown_1.png'),
    require('../assets/images/hair/brown_2.png'),
  ],
  blue: [
    require('../assets/images/hair/brown_0.png'),
    require('../assets/images/hair/brown_1.png'),
    require('../assets/images/hair/brown_2.png'),
  ],
};

// Bart-Farbe aus Haarfarbe ableiten
function beardColorFromHair(hair: HairColor): string {
  if (hair === 'black' || hair === 'blue') return 'black';
  if (hair === 'red') return 'red';
  if (hair === 'blonde' || hair === 'white') return 'blonde';
  return 'brown';
}

// ═══════════════════════════════════════════════════
// TYPEN & KONSTANTEN
// ═══════════════════════════════════════════════════
export type HairColor  = 'blonde' | 'brown' | 'black' | 'red' | 'white' | 'blue';
export type BeardStyle = 'none' | 'goatee' | 'short' | 'medium' | 'full' | 'large' | 'viking';
export type HairStyle  = 0 | 1 | 2;

export const HAIR_COLORS: { id: HairColor; label: string; hex: string }[] = [
  { id: 'blonde', label: 'Blond',   hex: '#E8C84A' },
  { id: 'brown',  label: 'Braun',   hex: '#7B3F00' },
  { id: 'black',  label: 'Schwarz', hex: '#2A2A2A' },
  { id: 'red',    label: 'Rot',     hex: '#C0392B' },
  { id: 'white',  label: 'Weiß',    hex: '#D8D8D8' },
  { id: 'blue',   label: 'Blau',    hex: '#2471A3' },
];

export const BEARD_STYLES: { id: BeardStyle; label: string }[] = [
  { id: 'none',   label: 'Kein Bart' },
  { id: 'goatee', label: 'Ziegenbart' },
  { id: 'short',  label: 'Kurz' },
  { id: 'medium', label: 'Mittel' },
  { id: 'full',   label: 'Voll' },
  { id: 'large',  label: 'Lang' },
  { id: 'viking', label: 'Wikinger' },
];

export type Player = {
  name: string;
  path: 'light' | 'shadow';
  level: number;
  hair: HairColor;
  hairStyle: HairStyle;
  beard: BeardStyle;
  customized: boolean;
} | null;

// 4 Items auf die braune Tischfläche — je ein Quadrant der Mitte
const GAMES = [
  { id: 'heisse_fackel', name: 'Heiße Fackel', locked: false, tablePos: { top: 0.22, left: 0.34 } },
  { id: 'werwolf',       name: 'Werwolf',       locked: true,  tablePos: { top: 0.21, left: 0.57 } },
  { id: 'imposter',      name: 'Imposter',       locked: true,  tablePos: { top: 0.36, left: 0.57 } },
  { id: 'kutschen',      name: 'Kutschen Fahrt', locked: true,  tablePos: { top: 0.35, left: 0.34 } },
];

// Stühle — transparent über die bereits im Tischbild eingezeichneten Stühle
const SEATS: { top: number; left: number; view: 'front' | 'back' | 'left' | 'right' }[] = [
  { top: 0.82, left: 0.50, view: 'back'  }, // unten-mitte  (Host)
  { top: 0.67, left: 0.10, view: 'right' }, // unten-links
  { top: 0.38, left: 0.13, view: 'right' }, // oben-links
  { top: 0.20, left: 0.50, view: 'front' }, // oben-mitte
  { top: 0.38, left: 0.87, view: 'left'  }, // oben-rechts
  { top: 0.67, left: 0.90, view: 'left'  }, // unten-rechts
];

function getTableLevel(level: number): keyof typeof IMG.tables {
  if (level >= 30) return 30;
  if (level >= 20) return 20;
  if (level >= 15) return 15;
  if (level >= 10) return 10;
  if (level >= 5)  return 5;
  return 1;
}

// ═══════════════════════════════════════════════════
// SPRITE SHEET — eine Perspektive aus dem 5×2 Grid
// ═══════════════════════════════════════════════════
// Sprite-Sheet: 1374 × 1145 px, 5 Spalten × 2 Zeilen
// Zeile 0 (oben), Spalte 0-4: diagonal-links, FRONT, RECHTS, diagonal-rechts, zurück-rechts
// Zeile 1 (unten), Spalte 0-4: links-vorne, front-alt, ZURÜCK, zurück-links, rechts-vorne
const CHAR_COLS = 5;
const CHAR_ROWS = 2;
const CHAR_W    = 1374;
const CHAR_H    = 1145;

// [spalte, zeile]  — echte Zellen aus dem 5×2 Sheet
// Zeile 0: diagonal-links | FRONT | RECHTS | diag-rechts | hinten-rechts
// Zeile 1: LINKS          | front2| ZURÜCK | hinten-links | rechts-vorne
const CHAR_VIEW: Record<'front'|'back'|'left'|'right', [number, number]> = {
  front: [1, 0],
  back:  [2, 1],
  right: [2, 0],
  left:  [0, 1],  // echte Linksansicht aus Sprite Sheet
};

function CharSprite({
  path, level = 1, view = 'front', height = 80,
}: {
  path: 'light' | 'shadow';
  level?: number;
  view?: 'front'|'back'|'left'|'right';
  height?: number;
}) {
  const sheet = path === 'light'
    ? IMG.chars.light[Math.min(level - 1, 8)]
    : IMG.chars.shadow[Math.min(level - 1, 8)];

  const cellW  = CHAR_W / CHAR_COLS;   // 274.8
  const cellH  = CHAR_H / CHAR_ROWS;   // 572.5
  const aspect = cellW / cellH;        // ≈ 0.48

  const dispH  = height;
  const dispW  = dispH * aspect;
  const [col, row] = CHAR_VIEW[view];

  return (
    // borderRadius nötig damit overflow:hidden auf Android funktioniert
    <View style={{
      width: dispW, height: dispH,
      overflow: 'hidden', borderRadius: 1,
    }}>
      <Image
        source={sheet}
        style={{
          width:  dispW * CHAR_COLS,
          height: dispH * CHAR_ROWS,
          position: 'absolute',
          left: -col * dispW,
          top:  -row * dispH,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════
// CHARAKTER-VORSCHAU (mit echten Haar & Bart Bildern)
// ═══════════════════════════════════════════════════
function CharPreview({
  path, hair, hairStyle = 0, beard, size = 70, view = 'front' as 'front'|'back'|'left'|'right',
}: {
  path: 'light' | 'shadow';
  hair: HairColor;
  hairStyle?: HairStyle;
  beard: BeardStyle;
  size?: number;
  view?: 'front'|'back'|'left'|'right';
}) {
  const hairImg    = HAIR_IMGS[hair]?.[hairStyle];
  const beardColor = beardColorFromHair(hair);
  const beardImg   = beard !== 'none' ? BEARD_IMGS[beardColor]?.[beard] : null;

  // aspect ≈ 0.48
  const charH  = size * 1.3;
  const charW  = charH * (CHAR_W / CHAR_COLS) / (CHAR_H / CHAR_ROWS);
  const hairW  = charW * 1.1;
  const beardW = charW * 0.85;

  // Sprite beginnt bei bottom:0 im Container (height = charH + size*0.1)
  // → Sprite-Top = size*0.1 vom Container-Top
  const spriteTop = size * 0.1;
  // Kopf ist ca. 8 % des Sprites von oben
  const hairTop  = spriteTop + charH * 0.02;   // Haar über dem Kopf
  const beardTop = spriteTop + charH * 0.38;   // Bart auf Kinnhöhe

  // Haar & Bart nur bei Front/Seiten-Ansicht sinnvoll
  const showOverlays = view === 'front' || view === 'left' || view === 'right';

  return (
    <View style={{ width: charW, height: charH + size * 0.1, alignItems: 'center' }}>
      {/* Charakter */}
      <View style={{ position: 'absolute', bottom: 0 }}>
        <CharSprite path={path} level={1} view={view} height={charH} />
      </View>
      {/* Haar */}
      {showOverlays && hairImg && (
        <Image source={hairImg}
          style={{ width: hairW, height: charH * 0.32,
            position: 'absolute', top: hairTop, alignSelf: 'center', zIndex: 3 }}
          resizeMode="contain" />
      )}
      {/* Bart */}
      {showOverlays && beardImg && (
        <Image source={beardImg}
          style={{ width: beardW, height: charH * 0.30,
            position: 'absolute', top: beardTop, alignSelf: 'center', zIndex: 3 }}
          resizeMode="contain" />
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════
// CHARAKTER AM TISCH
// ═══════════════════════════════════════════════════
function SeatCharacter({ player, view }: { player: NonNullable<Player>; view: 'front' | 'back' | 'left' | 'right' }) {
  const hairHex = HAIR_COLORS.find(h => h.id === player.hair)?.hex ?? '#E8C84A';

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        borderWidth: 1.5, borderColor: hairHex, borderRadius: 6,
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}>
        {/* CharPreview mit Haar/Bart + richtiger Perspektive */}
        <CharPreview
          path={player.path}
          hair={player.hair}
          hairStyle={player.hairStyle ?? 0}
          beard={player.beard}
          size={30}
          view={view}
        />
      </View>
      <Text style={s.seatName}>{player.name}</Text>
      <Text style={s.seatLvl}>Lvl {player.level}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// PROFIL MODAL
// ═══════════════════════════════════════════════════
function ProfileModal({ visible, player, onClose }: {
  visible: boolean;
  player: NonNullable<Player> | null;
  onClose: () => void;
}) {
  if (!player) return null;
  const xp = 0;
  const xpMax = 100;
  const xpPercent = xp / xpMax;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.modalBox}>
          <Text style={s.modalTitle}>{player.name}</Text>
          <Text style={[s.modalSub, { marginBottom: 16 }]}>
            {player.path === 'light' ? '☀️ GUT' : '🌑 BÖSE'} · Level {player.level}
          </Text>

          {/* Charakter Vorschau */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <CharPreview
              path={player.path}
              hair={player.hair}
              hairStyle={player.hairStyle ?? 0}
              beard={player.beard}
              size={90}
            />
          </View>

          {/* XP Bar */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 9, color: 'rgba(201,168,76,0.5)', letterSpacing: 2 }}>XP</Text>
              <Text style={{ fontSize: 9, color: 'rgba(201,168,76,0.5)' }}>{xp}/{xpMax}</Text>
            </View>
            <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
              <View style={{
                width: `${xpPercent * 100}%`, height: 6,
                backgroundColor: '#C9A84C', borderRadius: 3,
              }} />
            </View>
          </View>

          {/* Währung */}
          <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
            <View style={s.infoBadge}>
              <Image source={IMG.silver} style={{ width: 16, height: 16, marginRight: 6 }} />
              <Text style={[s.infoBadgeText, { color: '#C9A84C' }]}>8 450</Text>
            </View>
            <View style={s.infoBadge}>
              <Image source={IMG.gold} style={{ width: 16, height: 16, marginRight: 6 }} />
              <Text style={[s.infoBadgeText, { color: '#FFD700' }]}>230</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={[s.confirmBtn, { flex: 0, paddingHorizontal: 32 }]}>
            <Text style={{ color: '#0A0704', fontWeight: '800', fontSize: 13 }}>SCHLIESSEN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// QUICK NAME MODAL (Gast / Mitspieler — nur Name)
// ═══════════════════════════════════════════════════
function QuickNameModal({ visible, onConfirm, onCancel }: {
  visible: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  useEffect(() => { if (!visible) setName(''); }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.modalBox}>
          <Text style={s.modalTitle}>⚔ NAME</Text>
          <Text style={s.modalSub}>Wie heißt du, Recke?</Text>
          <TextInput
            style={[s.input, { marginTop: 16 }]}
            placeholder="Name eingeben..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={16}
            onSubmitEditing={() => name.trim() && onConfirm(name.trim())}
          />
          <TouchableOpacity
            style={[s.scrollStartBtn, !name.trim() && { opacity: 0.4 }]}
            onPress={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
          >
            <Text style={s.scrollStartText}>BEITRETEN →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// CHARAKTER-ERSTELLUNGS MODAL
// ═══════════════════════════════════════════════════
function CharacterCreationModal({
  visible,
  isMainPlayer,
  initialStep,
  onConfirm,
  onCancel,
  onOpenGuest,
}: {
  visible: boolean;
  isMainPlayer: boolean;
  initialStep?: 'name' | 'path' | 'hair' | 'beard';
  onConfirm: (data: { name: string; path: 'light' | 'shadow'; hair: HairColor; hairStyle: HairStyle; beard: BeardStyle }) => void;
  onCancel?: () => void;
  onOpenGuest?: () => void;
}) {
  const [step, setStep]         = useState<'name' | 'path' | 'hair' | 'beard'>(initialStep ?? 'name');
  const [name, setName]         = useState('');
  const [path, setPath]         = useState<'light' | 'shadow'>('light');
  const [hair, setHair]         = useState<HairColor>('blonde');
  const [hairStyle, setHairStyle] = useState<HairStyle>(0);
  const [beard, setBeard]       = useState<BeardStyle>('none');

  // Reset step when modal opens
  useEffect(() => {
    if (visible) {
      setStep(initialStep ?? 'name');
    }
  }, [visible]);

  // Animation: Seite wechseln
  const slideAnim = useRef(new Animated.Value(0)).current;
  const goToStep = (next: typeof step) => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    setStep(next);
  };

  const steps = ['name', 'path', 'hair', 'beard'];
  const stepIdx = steps.indexOf(step);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.modalBox, { maxHeight: '92%' }]}>

          {/* Fortschritts-Punkte */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            {steps.map((_, i) => (
              <View key={i} style={{
                width: i === stepIdx ? 20 : 8, height: 8, borderRadius: 4,
                backgroundColor: i <= stepIdx ? '#C9A84C' : 'rgba(201,168,76,0.2)',
              }} />
            ))}
          </View>

          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>

            {/* ── SCHRITT 1: Name ── */}
            {step === 'name' && (
              <View>
                <Text style={s.modalTitle}>⚔ DEIN NAME</Text>
                <Text style={s.modalSub}>Wie soll dein Recke heißen?</Text>
                <TextInput
                  style={[s.input, { marginTop: 16 }]}
                  placeholder="Name eingeben..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  maxLength={16}
                  onSubmitEditing={() => name.trim() && goToStep('path')}
                />
                <TouchableOpacity
                  style={[s.scrollStartBtn, { opacity: name.trim() ? 1 : 0.4 }]}
                  onPress={() => name.trim() && goToStep('path')}
                  disabled={!name.trim()}
                >
                  <Text style={s.scrollStartText}>WEITER →</Text>
                </TouchableOpacity>
                {/* QR-Code / Gast beitreten */}
                {onOpenGuest && (
                  <TouchableOpacity
                    onPress={() => { onCancel && onCancel(); onOpenGuest(); }}
                    style={{ marginTop: 12, alignItems: 'center', padding: 10 }}
                  >
                    <Text style={{ color: 'rgba(201,168,76,0.6)', fontSize: 12, letterSpacing: 1 }}>
                      🎫 Mit QR-Code beitreten
                    </Text>
                  </TouchableOpacity>
                )}
                {!isMainPlayer && onCancel && (
                  <TouchableOpacity onPress={onCancel} style={{ marginTop: 8, alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Abbrechen</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── SCHRITT 2: Pfad (Gut / Böse) ── */}
            {step === 'path' && (
              <View>
                <Text style={s.modalTitle}>DEIN PFAD</Text>
                <Text style={s.modalSub}>Diese Wahl prägt deinen Charakter für immer.</Text>

                <View style={{ flexDirection: 'row', gap: 14, marginTop: 24, marginBottom: 28 }}>
                  {/* GUT */}
                  <TouchableOpacity
                    style={[s.pathCardBig, path === 'light' && s.pathCardBigActive,
                      path === 'light' && { borderColor: '#F0C040', backgroundColor: 'rgba(240,192,64,0.08)' }]}
                    onPress={() => setPath('light')}
                  >
                    <Text style={{ fontSize: 52, marginBottom: 10 }}>☀️</Text>
                    <Text style={[s.pathCardTitle, { color: '#F0C040' }]}>GUT</Text>
                    <Text style={s.pathCardDesc}>Ehre · Mut · Licht</Text>
                    {path === 'light' && (
                      <View style={{ marginTop: 10, width: 24, height: 24, borderRadius: 12,
                        backgroundColor: '#F0C040', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#0A0704', fontWeight: '900', fontSize: 12 }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* BÖSE */}
                  <TouchableOpacity
                    style={[s.pathCardBig, path === 'shadow' && s.pathCardBigActive,
                      path === 'shadow' && { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.08)' }]}
                    onPress={() => setPath('shadow')}
                  >
                    <Text style={{ fontSize: 52, marginBottom: 10 }}>🌑</Text>
                    <Text style={[s.pathCardTitle, { color: '#8B5CF6' }]}>BÖSE</Text>
                    <Text style={s.pathCardDesc}>List · Macht · Dunkel</Text>
                    {path === 'shadow' && (
                      <View style={{ marginTop: 10, width: 24, height: 24, borderRadius: 12,
                        backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={s.scrollStartBtn} onPress={() => goToStep('hair')}>
                  <Text style={s.scrollStartText}>WEITER →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── SCHRITT 3: Haarfarbe & Stil ── */}
            {step === 'hair' && (
              <View>
                <Text style={s.modalTitle}>HAAR</Text>
                <Text style={s.modalSub}>Farbe und Stil — für immer.</Text>

                {/* Vorschau */}
                <View style={{ alignItems: 'center', marginVertical: 12 }}>
                  <CharPreview path={path} hair={hair} hairStyle={hairStyle} beard={beard} size={80} />
                </View>

                {/* Farbauswahl */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10,
                  justifyContent: 'center', marginBottom: 14 }}>
                  {HAIR_COLORS.map(hc => (
                    <TouchableOpacity key={hc.id}
                      onPress={() => setHair(hc.id)}
                      style={{ alignItems: 'center' }}>
                      <View style={[s.colorSwatch, { backgroundColor: hc.hex },
                        hair === hc.id && s.colorSwatchSelected,
                        hc.id === 'white' && { borderColor: '#888' },
                      ]}>
                        {hair === hc.id && (
                          <Text style={{ fontSize: 12, color: hc.id === 'white' ? '#333' : '#fff' }}>✓</Text>
                        )}
                      </View>
                      <Text style={[s.colorLabel, { color: hair === hc.id ? hc.hex : 'rgba(255,255,255,0.3)' }]}>
                        {hc.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Stil-Auswahl (3 Varianten mit echten Haar-Bildern) */}
                <Text style={[s.modalSub, { marginBottom: 8 }]}>FRISUR</Text>
                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
                  {([0, 1, 2] as HairStyle[]).map(si => (
                    <TouchableOpacity key={si}
                      onPress={() => setHairStyle(si)}
                      style={[s.hairStyleBtn, hairStyle === si && s.hairStyleBtnActive]}>
                      <Image source={HAIR_IMGS[hair]?.[si]}
                        style={{ width: 52, height: 36 }} resizeMode="contain" />
                      {hairStyle === si && (
                        <View style={s.hairStyleCheck}>
                          <Text style={{ fontSize: 9, color: '#0A0704', fontWeight: '900' }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={s.scrollStartBtn} onPress={() => goToStep('beard')}>
                  <Text style={s.scrollStartText}>WEITER →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── SCHRITT 4: Bart ── */}
            {step === 'beard' && (
              <View>
                <Text style={s.modalTitle}>🧔 BART</Text>
                <Text style={s.modalSub}>Dein letzter Schritt, Recke.</Text>

                {/* Vorschau */}
                <View style={{ alignItems: 'center', marginVertical: 12 }}>
                  <CharPreview path={path} hair={hair} hairStyle={hairStyle} beard={beard} size={80} />
                  <Text style={{ color: 'rgba(201,168,76,0.5)', marginTop: 6, fontSize: 10 }}>
                    {name} · {path === 'light' ? '☀️ GUT' : '🌑 BÖSE'}
                  </Text>
                </View>

                {/* Bart-Auswahl: 4 pro Reihe */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
                  {BEARD_STYLES.map(b => {
                    const bColor = beardColorFromHair(hair);
                    const img = b.id !== 'none' ? BEARD_IMGS[bColor]?.[b.id] : null;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        onPress={() => setBeard(b.id)}
                        style={[s.beardImgBtn, beard === b.id && s.beardImgBtnActive]}
                      >
                        {img ? (
                          <Image source={img} style={{ width: 56, height: 50 }} resizeMode="contain" />
                        ) : (
                          <Text style={{ fontSize: 22, lineHeight: 50, textAlign: 'center' }}>❌</Text>
                        )}
                        <Text style={[s.beardImgLabel, beard === b.id && { color: '#C9A84C' }]}>
                          {b.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* FERTIG */}
                <TouchableOpacity
                  style={[s.scrollStartBtn, { backgroundColor: '#C9A84C' }]}
                  onPress={() => onConfirm({ name: name.trim(), path, hair, hairStyle, beard })}
                >
                  <Text style={[s.scrollStartText, { color: '#0A0704' }]}>
                    ⚔ RECKE ERSCHAFFEN
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════
function AuthScreen({
  onAuthSuccess,
  onGuestPlay,
}: {
  onAuthSuccess: (isNewUser: boolean) => void;
  onGuestPlay: () => void;
}) {
  const [tab, setTab]           = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true); setError('');
    const { error: e } = await signIn(email.trim(), password);
    setLoading(false);
    if (e) { setError(e.message); return; }
    onAuthSuccess(false);
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password) return;
    setLoading(true); setError('');
    const { error: e } = await signUp(email.trim(), password, username.trim());
    setLoading(false);
    if (e) { setError(e.message); return; }
    onAuthSuccess(true);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={IMG.background} style={StyleSheet.absoluteFill} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.76)' }]} />
      </ImageBackground>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Titel */}
        <Text style={[s.appTitle, { fontSize: 30, marginBottom: 4, textAlign: 'center' }]}>
          ⚔ KNIGHT'S PASS
        </Text>
        <Text style={[s.appSub, { marginBottom: 40 }]}>DIE TAVERNE</Text>

        <View style={[s.modalBox, { width: '100%' }]}>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', marginBottom: 24, borderRadius: 10, overflow: 'hidden',
            borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' }}>
            {(['login', 'register'] as const).map(t => (
              <TouchableOpacity key={t} onPress={() => { setTab(t); setError(''); }} style={{
                flex: 1, padding: 13, alignItems: 'center',
                backgroundColor: tab === t ? 'rgba(201,168,76,0.15)' : 'transparent',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2,
                  color: tab === t ? '#C9A84C' : 'rgba(255,255,255,0.3)' }}>
                  {t === 'login' ? 'ANMELDEN' : 'REGISTRIEREN'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Username — nur bei Registrierung */}
          {tab === 'register' && (
            <TextInput
              style={s.input}
              placeholder="Benutzername..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              maxLength={20}
            />
          )}

          <TextInput
            style={s.input}
            placeholder="E-Mail..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={s.input}
            placeholder="Passwort..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onSubmitEditing={tab === 'login' ? handleLogin : handleRegister}
          />

          {/* Fehlermeldung */}
          {!!error && (
            <Text style={{ color: '#EF4444', fontSize: 11, textAlign: 'center', marginBottom: 10 }}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[s.scrollStartBtn, loading && { opacity: 0.55 }]}
            onPress={tab === 'login' ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0704" />
            ) : (
              <Text style={s.scrollStartText}>
                {tab === 'login' ? '⚔ EINTRETEN' : '⚔ KONTO ERSTELLEN'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Gast spielen */}
        <TouchableOpacity onPress={onGuestPlay} style={{ marginTop: 28, alignItems: 'center', padding: 12 }}>
          <Text style={{ color: 'rgba(201,168,76,0.55)', fontSize: 13, letterSpacing: 1 }}>
            🎫 Als Gast spielen
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 3 }}>
            Kein Konto nötig — Fortschritt wird nicht gespeichert
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// HAUPT APP
// ═══════════════════════════════════════════════════
export default function App() {
  type AppState = 'loading' | 'auth' | 'createChar' | 'guestName' | 'lobby' | 'game' | 'shop';
  const [appState, setAppState]       = useState<AppState>('loading');
  const [activeGame, setActiveGame]   = useState<string | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>([null, null, null, null, null, null]);

  // ── beim Start: Supabase Session prüfen ──
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadProfile();
      } else {
        setAppState('auth');
      }
    } catch {
      setAppState('auth');
    }
  };

  const loadProfile = async () => {
    try {
      const profile = await getMyProfile();
      if (profile && profile.hair) {
        // Profil mit Charakter vorhanden → direkt in Lobby
        const player: NonNullable<Player> = {
          name: profile.username,
          path: profile.path,
          level: profile.level,
          hair: profile.hair as HairColor,
          hairStyle: (profile.hair_style ?? 0) as HairStyle,
          beard: (profile.beard ?? 'none') as BeardStyle,
          customized: true,
        };
        setLobbyPlayers([player, null, null, null, null, null]);
        setAppState('lobby');
      } else if (profile) {
        // Registriert, aber noch kein Charakter
        setAppState('createChar');
      } else {
        setAppState('auth');
      }
    } catch {
      setAppState('auth');
    }
  };

  const handleAuthSuccess = (isNewUser: boolean) => {
    if (isNewUser) {
      setAppState('createChar');
    } else {
      loadProfile();
    }
  };

  // Vollständiger Creator — nur bei Konto-Registrierung
  const handleCharCreated = async (data: {
    name: string; path: 'light' | 'shadow'; hair: HairColor; hairStyle: HairStyle; beard: BeardStyle;
  }) => {
    await saveCharacter(data.hair, data.hairStyle, data.beard, data.path);
    const profile = await getMyProfile().catch(() => null);
    const player: NonNullable<Player> = {
      name: profile?.username ?? data.name,
      path: data.path,
      level: profile?.level ?? 1,
      hair: data.hair,
      hairStyle: data.hairStyle,
      beard: data.beard,
      customized: true,
    };
    setLobbyPlayers([player, null, null, null, null, null]);
    setAppState('lobby');
  };

  // Gast — nur Name, Standard-Charakter
  const handleGuestName = (name: string) => {
    const player: NonNullable<Player> = {
      name,
      path: 'light',
      level: 1,
      hair: 'blonde',
      hairStyle: 0,
      beard: 'none',
      customized: true,
    };
    setLobbyPlayers([player, null, null, null, null, null]);
    setAppState('lobby');
  };

  // ── Loading Screen ──
  if (appState === 'loading') {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" />
        <ImageBackground source={IMG.background} style={StyleSheet.absoluteFill} resizeMode="cover">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.76)' }]} />
        </ImageBackground>
        <Text style={[s.appTitle, { fontSize: 28, textAlign: 'center' }]}>⚔ KNIGHT'S PASS</Text>
        <ActivityIndicator color="#C9A84C" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // ── Auth Screen ──
  if (appState === 'auth') {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        onGuestPlay={() => setAppState('guestName')}
      />
    );
  }

  // ── Gast: nur Name ──
  if (appState === 'guestName') {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        <ImageBackground source={IMG.background} style={StyleSheet.absoluteFill} resizeMode="cover">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.76)' }]} />
        </ImageBackground>
        <QuickNameModal
          visible={true}
          onConfirm={handleGuestName}
          onCancel={() => setAppState('auth')}
        />
      </View>
    );
  }

  // ── Charakter Erstellen (nur bei Konto-Registrierung) ──
  if (appState === 'createChar') {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        <ImageBackground source={IMG.background} style={StyleSheet.absoluteFill} resizeMode="cover">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.76)' }]} />
        </ImageBackground>
        <CharacterCreationModal
          visible={true}
          isMainPlayer={true}
          initialStep="name"
          onConfirm={handleCharCreated}
        />
      </View>
    );
  }

  // ── Shop ──
  if (appState === 'shop') return <ShopScreen onBack={() => setAppState('lobby')} />;

  // ── Spiel ──
  if (appState === 'game' && activeGame === 'heisse_fackel') {
    return (
      <HeisseFackel
        players={lobbyPlayers.filter(Boolean).map(p => ({
          name: p!.name,
          avatar: p!.path === 'light' ? '☀️' : '🌑',
          level: p!.level,
        }))}
        onBack={() => { setAppState('lobby'); setActiveGame(null); }}
      />
    );
  }

  // ── Lobby ──
  return (
    <LobbyScreen
      players={lobbyPlayers}
      setPlayers={setLobbyPlayers}
      onStartGame={(id) => { setActiveGame(id); setAppState('game'); }}
      onShop={() => setAppState('shop')}
    />
  );
}

// ═══════════════════════════════════════════════════
// LOBBY
// ═══════════════════════════════════════════════════
function LobbyScreen({ players, setPlayers, onStartGame, onShop }: {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  onStartGame: (id: string) => void;
  onShop: () => void;
}) {
  const [quickNameFor, setQuickNameFor] = useState<number | null>(null);
  const [seatInfoFor, setSeatInfoFor]   = useState<number | null>(null);
  const [guestModal, setGuestModal]     = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [scrollModal, setScrollModal]   = useState<typeof GAMES[0] | null>(null);
  const [unlockModal, setUnlockModal]   = useState(false);
  const [difficulty, setDifficulty]     = useState<1|2|3>(1);
  const scrollAnim                      = useRef(new Animated.Value(0)).current;

  // Mitspieler hinzufügen — nur Name, Standard-Charakter
  const handleQuickName = (idx: number, name: string) => {
    const updated = [...players];
    updated[idx] = {
      name,
      path: 'light',
      level: 1,
      hair: 'blonde',
      hairStyle: 0,
      beard: 'none',
      customized: true,
    };
    setPlayers(updated);
    setQuickNameFor(null);
  };

  const removePlayer = (i: number) => {
    const updated = [...players];
    updated[i] = null;
    setPlayers(updated);
    setSeatInfoFor(null);
  };

  const openScroll = (game: typeof GAMES[0]) => {
    if (game.locked) { setUnlockModal(true); return; }
    setScrollModal(game);
    scrollAnim.setValue(0);
    Animated.spring(scrollAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
  };

  const mainPlayer   = players[0];
  const tableSize    = width * 0.92;
  const tableH       = tableSize * 0.88;
  const tableLevel   = getTableLevel(mainPlayer?.level ?? 1);
  const gameCode     = '4F8K2R';

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <ImageBackground source={IMG.background} style={StyleSheet.absoluteFill} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.52)' }]} />
      </ImageBackground>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={s.levelBadge}>
          <Text style={s.levelNum}>{mainPlayer?.level ?? 1}</Text>
          <Text style={s.levelLabel}>LVL</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.appTitle}>KNIGHT'S PASS</Text>
          <Text style={s.appSub}>DIE TAVERNE</Text>
        </View>
        <View style={s.currencyCol}>
          <View style={s.currRow}>
            <Image source={IMG.silver} style={s.coin} />
            <Text style={s.currText}>8 450</Text>
          </View>
          <View style={s.currRow}>
            <Image source={IMG.gold} style={s.coin} />
            <Text style={[s.currText, { color: '#FFD700' }]}>230</Text>
          </View>
        </View>
      </View>

      {/* ── TISCH — flex center ── */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: tableSize, height: tableH }}>
          <Image source={IMG.tables[tableLevel]}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            resizeMode="contain" />

          {/* Spiele auf der Tischfläche — leicht rotiert */}
          {GAMES.map((game, gi) => {
            const rotations = [-8, 5, -4, 7];
            const rot = rotations[gi];
            return (
              <TouchableOpacity key={game.id} onPress={() => openScroll(game)} style={{
                position: 'absolute',
                top: game.tablePos.top * tableH - 26,
                left: game.tablePos.left * tableSize - 26,
                alignItems: 'center',
              }}>
                <View style={[s.gameOnTable, game.locked && { opacity: 0.6 },
                  { transform: [{ rotate: `${rot}deg` }] }]}>
                  <Image source={IMG.games[game.id as keyof typeof IMG.games]}
                    style={{ width: 44, height: 44 }} resizeMode="contain" />
                  {game.locked && (
                    <View style={s.lockOverlay}>
                      <Text style={{ fontSize: 11 }}>🔒</Text>
                    </View>
                  )}
                </View>
                <Text style={[s.gameOnTableLabel, { transform: [{ rotate: `${rot * 0.4}deg` }] }]}>
                  {game.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Spieler an Sitzen — über die Stühle im Tischbild */}
          {SEATS.map((pos, i) => {
            const player = players[i];
            const hitW = 56, hitH = 62;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  if (!player) setQuickNameFor(i);
                  else if (player.customized) setSeatInfoFor(i);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  position: 'absolute',
                  top:  pos.top  * tableH  - hitH / 2,
                  left: pos.left * tableSize - hitW / 2,
                  width: hitW, height: hitH,
                  alignItems: 'center', justifyContent: 'center',
                  zIndex: 20,
                }}
              >
                {player?.customized
                  ? <SeatCharacter player={player} view={pos.view} />
                  : (
                    <View style={s.seatEmpty}>
                      <Text style={s.seatPlus}>+</Text>
                    </View>
                  )
                }
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── BOTTOM NAV — fest am unteren Rand ── */}
      <View style={s.bottomNav}>
        <TouchableOpacity onPress={() => setGuestModal(true)} style={s.navBtn}>
          <Text style={s.navIcon}>🎫</Text>
          <Text style={s.navLabel}>GAST</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onShop} style={s.navBtn}>
          <Image source={IMG.alchemist} style={s.alchemistIcon} resizeMode="contain" />
          <Text style={s.navLabel}>SHOP</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => mainPlayer?.customized && setProfileModal(true)} style={s.navBtn}>
          <Text style={s.navIcon}>👤</Text>
          <Text style={s.navLabel}>PROFIL</Text>
        </TouchableOpacity>
      </View>

      {/* ══ MITSPIELER HINZUFÜGEN ══ */}
      <QuickNameModal
        visible={quickNameFor !== null}
        onConfirm={(name) => quickNameFor !== null && handleQuickName(quickNameFor, name)}
        onCancel={() => setQuickNameFor(null)}
      />

      {/* ══ PROFIL MODAL ══ */}
      <ProfileModal
        visible={profileModal}
        player={mainPlayer ?? null}
        onClose={() => setProfileModal(false)}
      />

      {/* ══ SITZ INFO ══ */}
      <Modal visible={seatInfoFor !== null} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            {seatInfoFor !== null && players[seatInfoFor] && (() => {
              const p = players[seatInfoFor]!;
              const hairHex = HAIR_COLORS.find(h => h.id === p.hair)?.hex ?? '#C9A84C';
              return (
                <>
                  <Text style={s.modalTitle}>{p.name}</Text>
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <CharPreview path={p.path} hair={p.hair} hairStyle={p.hairStyle ?? 0} beard={p.beard} size={80} />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <View style={[s.infoBadge, { borderColor: hairHex }]}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: hairHex, marginRight: 5 }} />
                        <Text style={[s.infoBadgeText, { color: hairHex }]}>
                          {HAIR_COLORS.find(h => h.id === p.hair)?.label}
                        </Text>
                      </View>
                      <View style={s.infoBadge}>
                        <Text style={s.infoBadgeText}>
                          {BEARD_STYLES.find(b => b.id === p.beard)?.label}
                        </Text>
                      </View>
                      <View style={[s.infoBadge, { borderColor: p.path === 'light' ? '#F0C040' : '#8B5CF6' }]}>
                        <Text style={[s.infoBadgeText, { color: p.path === 'light' ? '#F0C040' : '#8B5CF6' }]}>
                          {p.path === 'light' ? '☀️ GUT' : '🌑 BÖSE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 8 }}>
                      🔒 Charakter kann nicht mehr geändert werden
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => setSeatInfoFor(null)} style={s.cancelBtn}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>SCHLIESSEN</Text>
                    </TouchableOpacity>
                    {seatInfoFor !== 0 && (
                      <TouchableOpacity
                        onPress={() => removePlayer(seatInfoFor!)}
                        style={[s.cancelBtn, { borderColor: '#EF4444' }]}
                      >
                        <Text style={{ color: '#EF4444', fontSize: 12 }}>ENTFERNEN</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ══ GAST / QR ══ */}
      <Modal visible={guestModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>🎫 GAST EINLADEN</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 20, fontSize: 12 }}>
              Gast scannt den QR-Code — sein Fortschritt{'\n'}wird automatisch geladen.
            </Text>
            <View style={{ alignItems: 'center', marginBottom: 20, padding: 16,
              backgroundColor: 'white', borderRadius: 12 }}>
              <QRCode value={`knightspass://join/${gameCode}`} size={170} color="#0A0704" backgroundColor="white" />
            </View>
            <View style={s.codeBox}>
              <Text style={s.codeLabel}>ODER CODE EINGEBEN</Text>
              <Text style={s.codeText}>{gameCode}</Text>
            </View>
            <TouchableOpacity onPress={() => setGuestModal(false)} style={[s.confirmBtn, { marginTop: 16 }]}>
              <Text style={{ color: '#0A0704', fontWeight: '800' }}>SCHLIESSEN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ SCHRIFTROLLE ══ */}
      <Modal visible={scrollModal !== null} transparent animationType="fade">
        <View style={s.overlay}>
          <Animated.View style={[s.scrollContainer, {
            transform: [
              { scaleY: scrollAnim },
              { scaleX: scrollAnim.interpolate({ inputRange: [0,1], outputRange: [0.85,1] }) },
            ],
            opacity: scrollAnim,
          }]}>
            <View style={s.scrollEnd} />
            <View style={s.scrollBody}>
              <Text style={s.scrollTitle}>📜 {scrollModal?.name?.toUpperCase()}</Text>
              <Text style={s.scrollSubtitle}>HÄRTEGRAD WÄHLEN</Text>
              {([
                { val: 1 as const, label: 'LEICHT',  desc: 'Harmlose Aufgaben & Fragen',             icon: '🌿' },
                { val: 2 as const, label: 'MITTEL',  desc: 'Mutige Wahrheiten & Pflichten',          icon: '🔥' },
                { val: 3 as const, label: 'BRUTAL',  desc: 'Nichts ist heilig — auf eigene Gefahr',  icon: '💀' },
              ]).map(d => (
                <TouchableOpacity key={d.val} onPress={() => setDifficulty(d.val)}
                  style={[s.diffBtn, difficulty === d.val && s.diffBtnActive]}>
                  <Text style={{ fontSize: 20 }}>{d.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.diffLabel, difficulty === d.val && { color: '#C9A84C' }]}>{d.label}</Text>
                    <Text style={s.diffDesc}>{d.desc}</Text>
                  </View>
                  {difficulty === d.val && <Text style={{ color: '#C9A84C' }}>✓</Text>}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.scrollStartBtn}
                onPress={() => { setScrollModal(null); if (scrollModal) onStartGame(scrollModal.id); }}>
                <Text style={s.scrollStartText}>⚔ SPIEL STARTEN</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setScrollModal(null)} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Abbrechen</Text>
              </TouchableOpacity>
            </View>
            <View style={s.scrollEnd} />
          </Animated.View>
        </View>
      </Modal>

      {/* ══ FREISCHALTEN ══ */}
      <Modal visible={unlockModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>🔓 FREISCHALTEN</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 16, textAlign: 'center' }}>
              Schalte alle 3 weiteren Spiele frei
            </Text>
            <TouchableOpacity style={s.confirmBtn} onPress={() => setUnlockModal(false)}>
              <Text style={{ color: '#0A0704', fontWeight: '800' }}>KAUFEN — 1.99€</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setUnlockModal(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Schliessen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// SHOP
// ═══════════════════════════════════════════════════
const SHOP_IMAGES: Record<string, any> = {
  'holzschild.png':     require('../assets/images/shop item/holzschild.png'),
  'Stahlschild.png':    require('../assets/images/shop item/Stahlschild.png'),
  'Titaniumschild.png': require('../assets/images/shop item/Titaniumschild.png'),
  'goldschild.png':     require('../assets/images/shop item/goldschild.png'),
  'xp trank.png':       require('../assets/images/shop item/xp trank.png'),
  'xp 2x trank.png':    require('../assets/images/shop item/xp 2x trank.png'),
  'goldsanduhr.png':    require('../assets/images/shop item/goldsanduhr.png'),
  'lila kerze.png':     require('../assets/images/shop item/lila kerze.png'),
  'schriftrolle.png':   require('../assets/images/shop item/schriftrolle.png'),
  'holzziege.png':      require('../assets/images/shop item/holzziege.png'),
  'doppelmaske.png':    require('../assets/images/shop item/doppelmaske.png'),
};
const SHOP_ITEMS = [
  { id: 'holzschild',   name: 'Holzschild',   desc: '1 Schluck sparen',       price: 50,  file: 'holzschild.png' },
  { id: 'stahlschild',  name: 'Stahlschild',  desc: '2 Schlucke sparen',      price: 150, file: 'Stahlschild.png' },
  { id: 'titanschild',  name: 'Titanschild',  desc: 'Komplett immun',         price: 400, file: 'Titaniumschild.png' },
  { id: 'goldschild',   name: 'Goldschild',   desc: 'Schlucke ½ für 1 Runde', price: 200, file: 'goldschild.png' },
  { id: 'xptrank',      name: 'XP Trank',     desc: '+50% XP für 1 Abend',   price: 100, file: 'xp trank.png' },
  { id: 'xp2trank',     name: 'Doppel XP',    desc: '2× XP für 3 Runden',    price: 250, file: 'xp 2x trank.png' },
  { id: 'sanduhr',      name: 'Zeitglas',     desc: 'Timer pausieren',        price: 100, file: 'goldsanduhr.png' },
  { id: 'kerze',        name: 'Fluch',        desc: 'Jemand trinkt doppelt',  price: 180, file: 'lila kerze.png' },
  { id: 'schriftrolle', name: 'Kgl. Erlass',  desc: 'Aufgabe ablehnen',       price: 300, file: 'schriftrolle.png' },
  { id: 'ziege',        name: 'Sündenbock',   desc: 'Aufgabe weitergeben',    price: 250, file: 'holzziege.png' },
  { id: 'maske',        name: 'Doppelgänger', desc: 'Aufgabe teilen',         price: 150, file: 'doppelmaske.png' },
];

function ShopScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={IMG.background} style={StyleSheet.absoluteFill} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.75)' }]} />
      </ImageBackground>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: 'rgba(201,168,76,0.6)', fontSize: 11, letterSpacing: 1 }}>← TAVERNE</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Image source={IMG.alchemist} style={{ width: 46, height: 46 }} resizeMode="contain" />
          <Text style={[s.appTitle, { fontSize: 13 }]}>ALCHEMIST</Text>
        </View>
        <View style={s.currencyCol}>
          <View style={s.currRow}><Image source={IMG.silver} style={s.coin} /><Text style={s.currText}>8 450</Text></View>
          <View style={s.currRow}><Image source={IMG.gold} style={s.coin} /><Text style={[s.currText,{color:'#FFD700'}]}>230</Text></View>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={s.sectionTitle}>🛡️ ITEMS & SCHILDE</Text>
        <View style={s.shopGrid}>
          {SHOP_ITEMS.map(item => (
            <TouchableOpacity key={item.id} style={s.shopCard}>
              <Image source={SHOP_IMAGES[item.file]} style={s.shopItemImg} resizeMode="contain" />
              <Text style={s.shopItemName}>{item.name}</Text>
              <Text style={s.shopItemDesc}>{item.desc}</Text>
              <View style={s.shopPriceRow}>
                <Image source={IMG.silver} style={s.coin} />
                <Text style={s.shopPrice}>{item.price}</Text>
              </View>
              <View style={s.buyBtn}><Text style={s.buyBtnText}>KAUFEN</Text></View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0A0704' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 54, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.12)',
  },
  levelBadge: {
    alignItems: 'center', justifyContent: 'center',
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.12)',
  },
  levelNum:   { fontSize: 16, color: '#C9A84C', fontWeight: '900', lineHeight: 18 },
  levelLabel: { fontSize: 8,  color: 'rgba(201,168,76,0.6)', letterSpacing: 2 },
  appTitle:   { fontSize: 16, color: '#C9A84C', fontWeight: '800', letterSpacing: 3 },
  appSub:     { fontSize: 8,  color: 'rgba(201,168,76,0.4)', letterSpacing: 4, marginTop: 1 },
  currencyCol:{ alignItems: 'flex-end', gap: 4 },
  currRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  coin:       { width: 20, height: 20 },
  currText:   { fontSize: 13, color: '#C9A84C', fontWeight: '700' },

  seatChar:   { width: 44, height: 56, backgroundColor: 'transparent' },
  seatName:   { fontSize: 8, color: '#C9A84C', fontWeight: '700', marginTop: 3 },
  seatLvl:    { fontSize: 7, color: 'rgba(201,168,76,0.4)' },
  seatEmpty:  {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  seatPlus:   { fontSize: 18, color: 'rgba(201,168,76,0.4)' },

  gameOnTable: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  gameOnTableLabel: {
    fontSize: 7, color: 'rgba(201,168,76,0.7)', marginTop: 3,
    fontWeight: '700', letterSpacing: 0.5, textAlign: 'center', maxWidth: 60,
  },
  sectionTitle: {
    alignSelf: 'flex-start', fontSize: 10, color: 'rgba(201,168,76,0.5)',
    letterSpacing: 3, marginBottom: 10,
  },
  bottomNav: {
    flexDirection: 'row', gap: 14,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28,
    width: '100%',
    borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.1)',
  },
  navBtn: {
    flex: 1, alignItems: 'center', gap: 4, padding: 12,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  navIcon:      { fontSize: 22 },
  navLabel:     { fontSize: 9, color: 'rgba(201,168,76,0.5)', letterSpacing: 2 },
  alchemistIcon:{ width: 32, height: 32 },

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modalBox: {
    width: '100%', backgroundColor: '#120A03',
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  modalTitle: {
    fontSize: 18, color: '#C9A84C', fontWeight: '800',
    letterSpacing: 2, marginBottom: 4, textAlign: 'center',
  },
  modalSub: {
    fontSize: 11, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center', letterSpacing: 1,
  },
  input: {
    padding: 14, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 10, color: '#E8D5A3', fontSize: 16, marginBottom: 14,
  },
  cancelBtn: {
    flex: 1, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
  },
  confirmBtn: {
    flex: 2, padding: 14, alignItems: 'center',
    backgroundColor: '#C9A84C', borderRadius: 10,
  },

  // Pfad-Karten (groß)
  pathCardBig: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pathCardBigActive: { backgroundColor: 'rgba(0,0,0,0.6)' },
  pathCardTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2, marginTop: 8 },
  pathCardDesc:  { fontSize: 9,  color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'center' },

  // Haarfarbe
  colorSwatch: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  colorSwatchSelected: { borderColor: '#fff', transform: [{ scale: 1.15 }] },
  colorLabel: { fontSize: 8, textAlign: 'center', marginTop: 3, fontWeight: '600' },

  // Haar-Stil
  hairStyleBtn: {
    padding: 8, borderRadius: 10, borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.15)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  hairStyleBtnActive: { borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)' },
  hairStyleCheck: {
    position: 'absolute', top: 3, right: 3, width: 14, height: 14,
    borderRadius: 7, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center',
  },

  // Bart Image Grid
  beardImgBtn: {
    width: (width * 0.9 - 48 - 24) / 4,
    alignItems: 'center', padding: 6, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.12)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  beardImgBtnActive: { borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)' },
  beardImgLabel: { fontSize: 7, color: 'rgba(255,255,255,0.4)', marginTop: 3, textAlign: 'center', fontWeight: '600' },

  // Legacy (kept for compat)
  beardOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  beardOptionActive: { borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.08)' },
  beardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  // Info-Badges
  infoBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  infoBadgeText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  // QR / Gast
  codeBox: {
    alignItems: 'center', padding: 14,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
  },
  codeLabel: { fontSize: 9, color: 'rgba(201,168,76,0.5)', letterSpacing: 3, marginBottom: 6 },
  codeText:  { fontSize: 28, color: '#C9A84C', fontWeight: '900', letterSpacing: 6 },

  // Schriftrolle
  scrollContainer: {
    width: width * 0.9, backgroundColor: '#1A0E04',
    borderRadius: 4, borderWidth: 2, borderColor: '#8B6914', overflow: 'hidden',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20,
  },
  scrollEnd:  { height: 18, backgroundColor: '#8B6914', borderWidth: 1, borderColor: '#C9A84C' },
  scrollBody: { padding: 24 },
  scrollTitle: {
    fontSize: 18, color: '#C9A84C', fontWeight: '900',
    letterSpacing: 2, textAlign: 'center', marginBottom: 4,
  },
  scrollSubtitle: {
    fontSize: 10, color: 'rgba(201,168,76,0.5)',
    letterSpacing: 3, textAlign: 'center', marginBottom: 20,
  },
  diffBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 10, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  diffBtnActive: { borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)' },
  diffLabel:     { fontSize: 13, color: '#E8D5A3', fontWeight: '700' },
  diffDesc:      { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  scrollStartBtn: {
    marginTop: 8, padding: 18,
    backgroundColor: '#C9A84C', borderRadius: 12, alignItems: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  scrollStartText: { fontSize: 15, color: '#0A0704', fontWeight: '900', letterSpacing: 3 },

  // Shop
  shopGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shopCard: {
    width: (width - 44) / 2, backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12, padding: 12, borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)', alignItems: 'center',
  },
  shopItemImg:  { width: 70, height: 70, marginBottom: 8 },
  shopItemName: { fontSize: 12, color: '#E8D5A3', fontWeight: '700', textAlign: 'center' },
  shopItemDesc: { fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 4, marginBottom: 8 },
  shopPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  shopPrice:    { fontSize: 13, fontWeight: '700', color: '#C9A84C' },
  buyBtn:       { backgroundColor: '#C9A84C', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, width: '100%', alignItems: 'center' },
  buyBtnText:   { fontSize: 11, color: '#0A0704', fontWeight: '800', letterSpacing: 1 },
});
