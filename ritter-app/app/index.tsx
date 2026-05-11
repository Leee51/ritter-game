import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, ScrollView, Animated, Dimensions,
  StatusBar, Image, ImageBackground,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width, height } = Dimensions.get('window');

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
// SPIELE – Positionen auf dem Tisch (relativ)
// ═══════════════════════════════════════════════════
const GAMES = [
  { id: 'heisse_fackel', name: 'Heiße Fackel', locked: false, tablePos: { top: 0.38, left: 0.20 } },
  { id: 'werwolf',       name: 'Werwolf',       locked: true,  tablePos: { top: 0.28, left: 0.55 } },
  { id: 'imposter',      name: 'Imposter',       locked: true,  tablePos: { top: 0.50, left: 0.68 } },
  { id: 'kutschen',      name: 'Kutschen Fahrt', locked: true,  tablePos: { top: 0.52, left: 0.35 } },
];

// Sitz-Positionen (oktagonal)
const SEATS = [
  { top: 0.74, left: 0.50 },
  { top: 0.57, left: 0.12 },
  { top: 0.26, left: 0.08 },
  { top: 0.06, left: 0.50 },
  { top: 0.26, left: 0.88 },
  { top: 0.57, left: 0.86 },
];

function getTableLevel(level: number): keyof typeof IMG.tables {
  if (level >= 30) return 30;
  if (level >= 20) return 20;
  if (level >= 15) return 15;
  if (level >= 10) return 10;
  if (level >= 5) return 5;
  return 1;
}

type Player = { name: string; path: 'light' | 'shadow'; level: number } | null;

// ═══════════════════════════════════════════════════
// HAUPT APP
// ═══════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState<'lobby' | 'game' | 'shop'>('lobby');
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (screen === 'shop') return <ShopScreen onBack={() => setScreen('lobby')} />;
  if (screen === 'game' && activeGame === 'heisse_fackel') {
    return <HeisseFackelScreen onBack={() => { setScreen('lobby'); setActiveGame(null); }} />;
  }

  return (
    <LobbyScreen
      onStartGame={(id) => { setActiveGame(id); setScreen('game'); }}
      onShop={() => setScreen('shop')}
    />
  );
}

// ═══════════════════════════════════════════════════
// LOBBY
// ═══════════════════════════════════════════════════
function LobbyScreen({ onStartGame, onShop }: {
  onStartGame: (id: string) => void;
  onShop: () => void;
}) {
  const [players, setPlayers] = useState<Player[]>([
    { name: 'Leon', path: 'light', level: 3 },
    null, null, null, null, null,
  ]);

  // Modals
  const [seatModal, setSeatModal]   = useState<number | null>(null);
  const [newName, setNewName]       = useState('');
  const [newPath, setNewPath]       = useState<'light' | 'shadow'>('light');
  const [guestModal, setGuestModal] = useState(false);
  const [scrollModal, setScrollModal] = useState<typeof GAMES[0] | null>(null);
  const [unlockModal, setUnlockModal] = useState(false);
  const [difficulty, setDifficulty] = useState<1|2|3>(1);

  // Schriftrolle Animation
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const openScroll = (game: typeof GAMES[0]) => {
    if (game.locked) { setUnlockModal(true); return; }
    setScrollModal(game);
    scrollAnim.setValue(0);
    Animated.spring(scrollAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
  };

  const addPlayer = () => {
    if (!newName.trim() || seatModal === null) return;
    const updated = [...players];
    updated[seatModal] = { name: newName.trim(), path: newPath, level: 1 };
    setPlayers(updated);
    setSeatModal(null);
    setNewName('');
  };

  const removePlayer = (i: number) => {
    if (i === 0) return; // Hauptspieler nicht entfernen
    const updated = [...players];
    updated[i] = null;
    setPlayers(updated);
    setSeatModal(null);
  };

  const mainPlayer = players[0]!;
  const tableSize  = width * 0.92;
  const tableH     = tableSize * 0.88;
  const tableLevel = getTableLevel(mainPlayer.level);
  const gameCode   = '4F8K2R'; // Placeholder join code

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Hintergrund */}
      <ImageBackground source={IMG.background} style={StyleSheet.absoluteFill} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.52)' }]} />
      </ImageBackground>

      {/* ── HEADER ── */}
      <View style={s.header}>
        {/* Level */}
        <View style={s.levelBadge}>
          <Text style={s.levelNum}>{mainPlayer.level}</Text>
          <Text style={s.levelLabel}>LVL</Text>
        </View>

        {/* Titel */}
        <View style={{ alignItems: 'center' }}>
          <Text style={s.appTitle}>KNIGHT'S PASS</Text>
          <Text style={s.appSub}>DIE TAVERNE</Text>
        </View>

        {/* Währung */}
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

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── TISCH MIT SPIELERN + SPIELEN ── */}
        <View style={{ width: tableSize, height: tableH, marginVertical: 12 }}>
          {/* Tisch Bild */}
          <Image source={IMG.tables[tableLevel]}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            resizeMode="contain" />

          {/* Spiele-Icons AUF dem Tisch */}
          {GAMES.map(game => (
            <TouchableOpacity
              key={game.id}
              onPress={() => openScroll(game)}
              style={{
                position: 'absolute',
                top: game.tablePos.top * tableH - 24,
                left: game.tablePos.left * tableSize - 24,
                alignItems: 'center',
              }}
            >
              <View style={[s.gameOnTable, game.locked && { opacity: 0.5 }]}>
                <Image source={IMG.games[game.id as keyof typeof IMG.games]}
                  style={{ width: 42, height: 42 }}
                  resizeMode="contain" />
                {game.locked && (
                  <View style={s.lockOverlay}>
                    <Text style={{ fontSize: 12 }}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={s.gameOnTableLabel}>{game.name}</Text>
            </TouchableOpacity>
          ))}

          {/* Spieler an Sitzen */}
          {SEATS.map((pos, i) => {
            const player = players[i];
            const charImg = player
              ? (player.path === 'shadow'
                  ? IMG.chars.shadow[Math.min(player.level - 1, 8)]
                  : IMG.chars.light[Math.min(player.level - 1, 8)])
              : null;

            return (
              <TouchableOpacity
                key={i}
                onPress={() => { setSeatModal(i); setNewName(player?.name ?? ''); setNewPath(player?.path ?? 'light'); }}
                style={{
                  position: 'absolute',
                  top: pos.top * tableH - 34,
                  left: pos.left * tableSize - 26,
                  alignItems: 'center',
                  zIndex: 10,
                }}
              >
                {player && charImg ? (
                  <View style={s.seatFilled}>
                    <Image source={charImg} style={s.seatChar} resizeMode="contain" />
                    <Text style={s.seatName}>{player.name}</Text>
                    <Text style={s.seatLvl}>Lvl {player.level}</Text>
                  </View>
                ) : (
                  <View style={s.seatEmpty}>
                    <Text style={s.seatPlus}>+</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── BOTTOM NAV ── */}
        <View style={s.bottomNav}>
          <TouchableOpacity onPress={() => setGuestModal(true)} style={s.navBtn}>
            <Text style={s.navIcon}>🎫</Text>
            <Text style={s.navLabel}>GAST</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onShop} style={s.navBtn}>
            <Image source={IMG.alchemist} style={s.alchemistIcon} resizeMode="contain" />
            <Text style={s.navLabel}>SHOP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn}>
            <Text style={s.navIcon}>👤</Text>
            <Text style={s.navLabel}>PROFIL</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ══════════════════════════════════════
          MODAL: Sitz auswählen / Spieler edit
      ══════════════════════════════════════ */}
      <Modal visible={seatModal !== null} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            {seatModal !== null && players[seatModal] ? (
              // Bestehenden Spieler bearbeiten
              <>
                <Text style={s.modalTitle}>⚔ {players[seatModal]!.name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 16, textAlign: 'center', fontSize: 12 }}>
                  Lvl {players[seatModal]!.level} · {players[seatModal]!.path === 'light' ? '☀️ Licht' : '🌑 Schatten'}
                </Text>
                {/* Pfad wechseln */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <TouchableOpacity
                    style={[s.pathBtn, players[seatModal]!.path === 'light' && s.pathBtnActive]}
                    onPress={() => {
                      const u = [...players];
                      u[seatModal!] = { ...u[seatModal!]!, path: 'light' };
                      setPlayers(u); setSeatModal(null);
                    }}>
                    <Image source={IMG.chars.light[Math.min(players[seatModal]!.level-1,8)]}
                      style={{ width: 50, height: 60 }} resizeMode="contain" />
                    <Text style={s.pathLabel}>☀️ LICHT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.pathBtn, players[seatModal!]!.path === 'shadow' && s.pathBtnActive]}
                    onPress={() => {
                      const u = [...players];
                      u[seatModal!] = { ...u[seatModal!]!, path: 'shadow' };
                      setPlayers(u); setSeatModal(null);
                    }}>
                    <Image source={IMG.chars.shadow[Math.min(players[seatModal]!.level-1,8)]}
                      style={{ width: 50, height: 60 }} resizeMode="contain" />
                    <Text style={s.pathLabel}>🌑 SCHATTEN</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={() => setSeatModal(null)} style={s.cancelBtn}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>SCHLIESSEN</Text>
                  </TouchableOpacity>
                  {seatModal !== 0 && (
                    <TouchableOpacity onPress={() => removePlayer(seatModal!)} style={[s.cancelBtn, { borderColor: '#EF4444' }]}>
                      <Text style={{ color: '#EF4444', fontSize: 12 }}>ENTFERNEN</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              // Neuen Spieler hinzufügen
              <>
                <Text style={s.modalTitle}>RECKE HINZUFÜGEN</Text>
                <TextInput
                  style={s.input}
                  placeholder="Name..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                  onSubmitEditing={addPlayer}
                />
                {/* Charakter-Pfad wählen */}
                <Text style={{ color: 'rgba(201,168,76,0.5)', fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>CHARAKTER WÄHLEN</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <TouchableOpacity
                    style={[s.pathBtn, newPath === 'light' && s.pathBtnActive]}
                    onPress={() => setNewPath('light')}>
                    <Image source={IMG.chars.light[0]} style={{ width: 50, height: 60 }} resizeMode="contain" />
                    <Text style={s.pathLabel}>☀️ LICHT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.pathBtn, newPath === 'shadow' && s.pathBtnActive]}
                    onPress={() => setNewPath('shadow')}>
                    <Image source={IMG.chars.shadow[0]} style={{ width: 50, height: 60 }} resizeMode="contain" />
                    <Text style={s.pathLabel}>🌑 SCHATTEN</Text>
                  </TouchableOpacity>
                </View>
                {/* Gast-Option */}
                <TouchableOpacity onPress={() => { setSeatModal(null); setGuestModal(true); }} style={s.guestInlineBtn}>
                  <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '700' }}>🎫 ALS GAST MITSPIELEN</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity onPress={() => setSeatModal(null)} style={s.cancelBtn}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>ABBRUCH</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={addPlayer} style={s.confirmBtn}>
                    <Text style={{ color: '#0A0704', fontSize: 12, fontWeight: '800' }}>⚔ BEITRETEN</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════
          MODAL: Gast / QR Code
      ══════════════════════════════════════ */}
      <Modal visible={guestModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>🎫 GAST EINLADEN</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 20, fontSize: 12 }}>
              Gast scannt den QR-Code — sein Fortschritt{'\n'}wird automatisch geladen.
            </Text>

            {/* QR Code */}
            <View style={{ alignItems: 'center', marginBottom: 20, padding: 16,
              backgroundColor: 'white', borderRadius: 12 }}>
              <QRCode
                value={`knightspass://join/${gameCode}`}
                size={180}
                color="#0A0704"
                backgroundColor="white"
              />
            </View>

            {/* Code Text */}
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

      {/* ══════════════════════════════════════
          MODAL: Schriftrolle (Spiel starten)
      ══════════════════════════════════════ */}
      <Modal visible={scrollModal !== null} transparent animationType="fade">
        <View style={s.overlay}>
          <Animated.View style={[
            s.scrollContainer,
            {
              transform: [
                { scaleY: scrollAnim },
                { scaleX: scrollAnim.interpolate({ inputRange: [0,1], outputRange: [0.8, 1] }) },
              ],
              opacity: scrollAnim,
            }
          ]}>
            {/* Schriftrolle Dekoration oben */}
            <View style={s.scrollEnd} />

            <View style={s.scrollBody}>
              <Text style={s.scrollTitle}>📜 {scrollModal?.name?.toUpperCase()}</Text>
              <Text style={s.scrollSubtitle}>HÄRTEGRAD WÄHLEN</Text>

              {/* Schwierigkeits-Stufen */}
              {([
                { val: 1, label: 'LEICHT', desc: 'Harmlose Aufgaben & Fragen', icon: '🌿' },
                { val: 2, label: 'MITTEL', desc: 'Mutige Wahrheiten & Pflichten', icon: '🔥' },
                { val: 3, label: 'BRUTAL', desc: 'Nichts ist heilig — auf eigene Gefahr', icon: '💀' },
              ] as const).map(d => (
                <TouchableOpacity
                  key={d.val}
                  onPress={() => setDifficulty(d.val)}
                  style={[s.diffBtn, difficulty === d.val && s.diffBtnActive]}
                >
                  <Text style={{ fontSize: 20 }}>{d.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.diffLabel, difficulty === d.val && { color: '#C9A84C' }]}>{d.label}</Text>
                    <Text style={s.diffDesc}>{d.desc}</Text>
                  </View>
                  {difficulty === d.val && <Text style={{ color: '#C9A84C' }}>✓</Text>}
                </TouchableOpacity>
              ))}

              {/* Starten */}
              <TouchableOpacity
                style={s.scrollStartBtn}
                onPress={() => {
                  setScrollModal(null);
                  if (scrollModal) onStartGame(scrollModal.id);
                }}
              >
                <Text style={s.scrollStartText}>⚔ SPIEL STARTEN</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setScrollModal(null)} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Abbrechen</Text>
              </TouchableOpacity>
            </View>

            {/* Schriftrolle Dekoration unten */}
            <View style={s.scrollEnd} />
          </Animated.View>
        </View>
      </Modal>

      {/* Freischalten Modal */}
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
// HEISZE FACKEL SCREEN (Wrapper)
// ═══════════════════════════════════════════════════
function HeisseFackelScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <ImageBackground source={IMG.background} style={StyleSheet.absoluteFill} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
      </ImageBackground>
      <Image source={IMG.games.heisse_fackel} style={{ width: 120, height: 120, marginBottom: 20 }} resizeMode="contain" />
      <Text style={[s.appTitle, { marginBottom: 8 }]}>HEISZE FACKEL</Text>
      <Text style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>Lädt...</Text>
      <TouchableOpacity onPress={onBack} style={s.confirmBtn}>
        <Text style={{ color: '#0A0704', fontWeight: '800' }}>← ZURÜCK</Text>
      </TouchableOpacity>
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
  { id: 'holzschild',  name: 'Holzschild',    desc: '1 Schluck sparen',       price: 50,  file: 'holzschild.png' },
  { id: 'stahlschild', name: 'Stahlschild',   desc: '2 Schlucke sparen',      price: 150, file: 'Stahlschild.png' },
  { id: 'titanschild', name: 'Titanschild',   desc: 'Komplett immun',         price: 400, file: 'Titaniumschild.png' },
  { id: 'goldschild',  name: 'Goldschild',    desc: 'Schlucke ½ für 1 Runde', price: 200, file: 'goldschild.png' },
  { id: 'xptrank',     name: 'XP Trank',      desc: '+50% XP für 1 Abend',   price: 100, file: 'xp trank.png' },
  { id: 'xp2trank',    name: 'Doppel XP',     desc: '2× XP für 3 Runden',    price: 250, file: 'xp 2x trank.png' },
  { id: 'sanduhr',     name: 'Zeitglas',      desc: 'Timer pausieren',        price: 100, file: 'goldsanduhr.png' },
  { id: 'kerze',       name: 'Fluch',         desc: 'Jemand trinkt doppelt',  price: 180, file: 'lila kerze.png' },
  { id: 'schriftrolle',name: 'Kgl. Erlass',   desc: 'Aufgabe ablehnen',       price: 300, file: 'schriftrolle.png' },
  { id: 'ziege',       name: 'Sündenbock',    desc: 'Aufgabe weitergeben',    price: 250, file: 'holzziege.png' },
  { id: 'maske',       name: 'Doppelgänger',  desc: 'Aufgabe teilen',         price: 150, file: 'doppelmaske.png' },
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
          <Image source={IMG.alchemist} style={{ width: 48, height: 48 }} resizeMode="contain" />
          <Text style={[s.appTitle, { fontSize: 13 }]}>ALCHEMIST</Text>
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
              <View style={s.buyBtn}>
                <Text style={s.buyBtnText}>KAUFEN</Text>
              </View>
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

  // Header
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

  // Seat
  seatFilled: { alignItems: 'center' },
  seatChar:   { width: 46, height: 58, backgroundColor: 'transparent' },
  seatName:   { fontSize: 8, color: '#C9A84C', fontWeight: '700', marginTop: 1 },
  seatLvl:    { fontSize: 7, color: 'rgba(201,168,76,0.4)' },
  seatEmpty: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  seatPlus: { fontSize: 18, color: 'rgba(201,168,76,0.4)' },

  // Games on table
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

  // Section
  sectionTitle: {
    alignSelf: 'flex-start', fontSize: 10, color: 'rgba(201,168,76,0.5)',
    letterSpacing: 3, marginBottom: 10,
  },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row', gap: 14, marginTop: 8, paddingHorizontal: 20, width: '100%',
  },
  navBtn: {
    flex: 1, alignItems: 'center', gap: 4, padding: 12,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  navIcon:      { fontSize: 22 },
  navLabel:     { fontSize: 9, color: 'rgba(201,168,76,0.5)', letterSpacing: 2 },
  alchemistIcon:{ width: 32, height: 32 },

  // Modals
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modalBox: {
    width: '100%', backgroundColor: '#120A03',
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  modalTitle: {
    fontSize: 16, color: '#C9A84C', fontWeight: '800',
    letterSpacing: 2, marginBottom: 14, textAlign: 'center',
  },
  input: {
    padding: 14, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 10, color: '#E8D5A3', fontSize: 14, marginBottom: 14,
  },
  cancelBtn: {
    flex: 1, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
  },
  confirmBtn: {
    flex: 2, padding: 14, alignItems: 'center',
    backgroundColor: '#C9A84C', borderRadius: 10,
  },
  guestInlineBtn: {
    padding: 12, alignItems: 'center', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
    backgroundColor: 'rgba(201,168,76,0.06)',
  },

  // Path select
  pathBtn: {
    flex: 1, alignItems: 'center', padding: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pathBtnActive: { borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.12)' },
  pathLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '700' },

  // QR / Guest
  codeBox: {
    alignItems: 'center', padding: 14,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
  },
  codeLabel: { fontSize: 9, color: 'rgba(201,168,76,0.5)', letterSpacing: 3, marginBottom: 6 },
  codeText:  { fontSize: 28, color: '#C9A84C', fontWeight: '900', letterSpacing: 6 },

  // Schriftrolle
  scrollContainer: {
    width: width * 0.9,
    backgroundColor: '#1A0E04',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#8B6914',
    overflow: 'hidden',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  scrollEnd: {
    height: 18,
    backgroundColor: '#8B6914',
    borderWidth: 1,
    borderColor: '#C9A84C',
  },
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
  diffLabel: { fontSize: 13, color: '#E8D5A3', fontWeight: '700' },
  diffDesc:  { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  scrollStartBtn: {
    marginTop: 16, padding: 18,
    backgroundColor: '#C9A84C', borderRadius: 12, alignItems: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
  },
  scrollStartText: { fontSize: 15, color: '#0A0704', fontWeight: '900', letterSpacing: 3 },

  // Shop
  shopGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shopCard: {
    width: (width - 44) / 2,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)', alignItems: 'center',
  },
  shopItemImg:  { width: 70, height: 70, marginBottom: 8 },
  shopItemName: { fontSize: 12, color: '#E8D5A3', fontWeight: '700', textAlign: 'center' },
  shopItemDesc: { fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 4, marginBottom: 8 },
  shopPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  shopPrice:    { fontSize: 13, fontWeight: '700', color: '#C9A84C' },
  buyBtn: {
    backgroundColor: '#C9A84C', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 8, width: '100%', alignItems: 'center',
  },
  buyBtnText: { fontSize: 11, color: '#0A0704', fontWeight: '800', letterSpacing: 1 },
});
