import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Dimensions, StatusBar, Animated
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Karten nach Schwierigkeits-Level
const KARTEN = {
  1: [
    { text: 'Alle zeigen auf die Person die am meisten trinkt — der Betroffene trinkt nochmal.', typ: '👥' },
    { text: 'Nenne 5 Länder in 5 Sekunden. Schaffst du es nicht → trink.', typ: '🧠' },
    { text: 'Wer ist am eitelsten am Tisch?', typ: '❓' },
    { text: 'Stille Runde — wer als Erstes spricht trinkt 2 Schlucke.', typ: '🤫' },
    { text: 'Wer hat heute schon gelogen? Schweigen = 2 Schlucke trinken.', typ: '❓' },
    { text: 'Alle trinken — wer zuletzt das Glas hebt trinkt doppelt.', typ: '👥' },
    { text: 'Erzähle einen Witz. Lacht niemand → trink 2 Schlucke.', typ: '🎭' },
    { text: 'Wer gibt am meisten Geld für unnötige Dinge aus?', typ: '❓' },
    { text: 'Zeig den letzten Screenshot auf deinem Handy. Oder trink 3 Schlucke.', typ: '📱' },
    { text: 'Mach 10 Liegestütze — oder trink 2 Schlucke.', typ: '💪' },
  ],
  2: [
    { text: 'WAHRHEIT: Was war dein peinlichster Moment dieses Jahr? Oder trink 3.', typ: '🔮' },
    { text: 'Tanz 30 Sekunden alleine. Alle bewerten — unter 5 Punkte → trink.', typ: '🎭' },
    { text: 'Imitiere jemanden am Tisch bis alle erraten wer es ist.', typ: '🎭' },
    { text: 'Wer würde als Erstes in einem Horrorfilm sterben?', typ: '❓' },
    { text: 'Sing 15 Sekunden ein Lied. Alle geben Daumen hoch oder runter.', typ: '🎵' },
    { text: 'Beschreibe dein letztes Date ohne Namen. Gruppe rät wer.', typ: '💘' },
    { text: 'PFLICHT: Zeige deinen Handybildschirm 5 Sekunden. Oder trink 4.', typ: '📱' },
    { text: 'Wer ist heimlich am verliebtesten am Tisch?', typ: '❓' },
    { text: 'Schreibe mit dem falschen Arm deinen Namen. Unleserlich → trink.', typ: '✍️' },
    { text: 'Mache den besten Bösewicht-Monolog — unter 8 Sekunden → trink.', typ: '🎭' },
  ],
  3: [
    { text: 'WAHRHEIT: Wen am Tisch würdest du heiraten wenn du müsstest?', typ: '🔮' },
    { text: 'PFLICHT: Schreib jemandem in deinen Kontakten "Ich denke oft an dich" und schick es ab.', typ: '📱' },
    { text: 'Wer würde seinen besten Freund für 1 Million verraten?', typ: '❓' },
    { text: 'Abstimmung: Wer hat die wildeste Geschichte? Der muss sie erzählen.', typ: '👥' },
    { text: 'WAHRHEIT: Was ist dein größtes Geheimnis das du noch nie jemandem gesagt hast? Oder trink 5.', typ: '🔮' },
    { text: 'Jeder flüstert dem Nachbarn ein Geheimnis — das letzte wird laut erzählt.', typ: '🤫' },
    { text: 'Wer hat die meisten Exen am Tisch?', typ: '❓' },
    { text: 'PFLICHT: Ruf deine Mutter an und sag ihr dass du sie liebst. Jetzt.', typ: '📱' },
    { text: 'Erzähle eine Lüge. Glaubt die Gruppe → alle anderen trinken 2.', typ: '🎭' },
    { text: 'Wer wäre der beste Kriminelle am Tisch?', typ: '❓' },
  ],
  4: [
    { text: '💀 TODESURTEIL: Du trinkst 5 Schlucke UND machst eine Aufgabe die die Gruppe wählt.', typ: '💀' },
    { text: '💀 FLUCH: Du teilst 8 Schlucke frei auf alle aus — aber du trinkst auch 3.', typ: '💀' },
    { text: '💀 WAHRHEIT ODER TOD: Enthülle dein größtes Geheimnis oder trink 6 Schlucke.', typ: '💀' },
    { text: '💀 SCHANDE: Alle zeigen auf dich und rufen "Schande!" — du trinkst für jeden Finger.', typ: '💀' },
    { text: '💀 DOPPELFLUCH: Du und die Person links trinken je 4 Schlucke.', typ: '💀' },
    { text: '💀 KÖNIGSURTEIL: Die Gruppe entscheidet über dein Schicksal — Abstimmung was du tun musst.', typ: '💀' },
  ],
};

type Karte = { text: string; typ: string };
type Player = { name: string; avatar: string; level?: number };
type Props = { players: Player[]; onBack: () => void; };

function getKarte(runde: number): Karte {
  let pool: Karte[];
  if (runde <= 5) pool = KARTEN[1];
  else if (runde <= 12) pool = [...KARTEN[1], ...KARTEN[2]];
  else if (runde <= 20) pool = [...KARTEN[2], ...KARTEN[3]];
  else pool = [...KARTEN[3], ...KARTEN[4]];
  return pool[Math.floor(Math.random() * pool.length)];
}

const TYP_FARBE: Record<string, string> = {
  '❓': '#C9A84C', '🎭': '#F97316', '💪': '#10B981',
  '🧠': '#3B82F6', '📱': '#8B5CF6', '👥': '#EC4899',
  '🤫': '#6B7280', '🎵': '#F59E0B', '💘': '#EF4444',
  '✍️': '#14B8A6', '🔮': '#A855F7', '💀': '#DC2626',
};

export default function HeisseFackel({ players, onBack }: Props) {
  const [aktSpieler, setAktSpieler] = useState(0);
  const [timer, setTimer] = useState(0);
  const [laeuft, setLaeuft] = useState(false);
  const [explodiert, setExplodiert] = useState(false);
  const [karte, setKarte] = useState<Karte | null>(null);
  const [showRegeln, setShowRegeln] = useState(true);
  const [runde, setRunde] = useState(1);
  const [gesamtRunden] = useState(Math.floor(Math.random() * 6) + 20); // 20-25 Runden

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Pulse wenn Timer niedrig
  useEffect(() => {
    if (timer <= 5 && timer > 0 && laeuft) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [timer]);

  useEffect(() => {
    if (!laeuft) return;
    if (timer <= 0) {
      // Explosion wenn gesamtRunden erreicht
      if (runde >= gesamtRunden) {
        setLaeuft(false);
        setExplodiert(true);
        setKarte(getKarte(runde));
        // Schütteln
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 15, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -15, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
      } else {
        // Weitergeben erzwingen
        setLaeuft(false);
        setAktSpieler(prev => (prev + 1) % players.length);
        setRunde(prev => prev + 1);
        const neuerTimer = Math.floor(Math.random() * 8) + 3;
        setTimer(neuerTimer);
        setLaeuft(true);
      }
      return;
    }
    const t = setTimeout(() => setTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [laeuft, timer]);

  const starten = () => {
    const startTimer = Math.floor(Math.random() * 8) + 3;
    setTimer(startTimer);
    setLaeuft(true);
    setExplodiert(false);
    setShowRegeln(false);
  };

  const weitergeben = () => {
    if (!laeuft) return;
    setAktSpieler(prev => (prev + 1) % players.length);
    setRunde(prev => prev + 1);
    const neuerTimer = Math.floor(Math.random() * 8) + 3;
    setTimer(neuerTimer);
  };

  const naechsteRunde = () => {
    setExplodiert(false);
    setKarte(null);
    setAktSpieler(prev => (prev + 1) % players.length);
    setRunde(1);
    const startTimer = Math.floor(Math.random() * 8) + 3;
    setTimer(startTimer);
    setLaeuft(true);
  };

  const timerFarbe = timer <= 3 ? '#EF4444' : timer <= 6 ? '#F97316' : '#10B981';
  const spannung = Math.min((runde / gesamtRunden) * 100, 100);
  const kartenFarbe = karte ? (TYP_FARBE[karte.typ] ?? '#C9A84C') : '#C9A84C';

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.back}>← LOBBY</Text>
        </TouchableOpacity>
        <View style={s.headerMitte}>
          <Text style={s.titel}>🕯️ HEISZE FACKEL</Text>
          <Text style={s.rundeText}>Runde {runde} von ~{gesamtRunden}</Text>
        </View>
        <View style={s.spannungsContainer}>
          <Text style={s.spannungsLabel}>⚡</Text>
          <View style={s.spannungsBar}>
            <View style={[s.spannungsFill, { width: `${spannung}%`, backgroundColor: spannung > 80 ? '#EF4444' : spannung > 50 ? '#F97316' : '#C9A84C' }]} />
          </View>
        </View>
      </View>

      {/* Regeln Modal */}
      <Modal visible={showRegeln} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.box}>
            <Text style={s.boxTitel}>⚔️ DIE FACKEL BRENNT</Text>
            <Text style={s.boxText}>
              Gib die Fackel weiter bevor der Timer abläuft!{'\n\n'}
              🕯️ Drücke <Text style={{ color: '#C9A84C', fontWeight: '800' }}>WEITERGEBEN</Text> um die Fackel zu reichen.{'\n\n'}
              ⚡ Nach ~20 Runden explodiert sie — wer sie dann hält muss eine Aufgabe erfüllen!{'\n\n'}
              💀 Je länger das Spiel dauert, desto wilderen Karten kommen.
            </Text>
            <TouchableOpacity style={s.goldBtn} onPress={starten}>
              <Text style={s.goldBtnText}>🔥 FACKEL ENTZÜNDEN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Explosion Modal */}
      <Modal visible={explodiert} transparent animationType="fade">
        <View style={s.overlay}>
          <Animated.View style={[s.box, { borderColor: kartenFarbe, transform: [{ translateX: shakeAnim }] }]}>
            <Text style={s.explosionEmoji}>💥</Text>
            <Text style={[s.kartenTyp, { color: kartenFarbe }]}>
              {karte?.typ} SCHICKSAL
            </Text>
            <Text style={s.opferText}>
              ⚔️ {players[aktSpieler]?.name ?? 'Spieler'} muss:
            </Text>
            <Text style={s.kartenText}>{karte?.text}</Text>
            <TouchableOpacity style={[s.goldBtn, { backgroundColor: kartenFarbe }]} onPress={naechsteRunde}>
              <Text style={s.goldBtnText}>⚔️ NEUE RUNDE</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Hauptbereich */}
      <View style={s.mitte}>
        {/* Fackel */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
          <Text style={[s.fackel, { fontSize: timer <= 3 && laeuft ? 100 : 80 }]}>
            {explodiert ? '💀' : laeuft ? '🔥' : '🕯️'}
          </Text>
          {laeuft && (
            <Text style={[s.timer, { color: timerFarbe }]}>{timer}s</Text>
          )}
        </Animated.View>

        {/* Timer Bar */}
        {laeuft && (
          <View style={s.timerBarContainer}>
            <Animated.View style={[s.timerBarFill, { backgroundColor: timerFarbe, width: `${(timer / 10) * 100}%` }]} />
          </View>
        )}

        {/* Aktueller Spieler */}
        <View style={s.spielerBadge}>
          <Text style={s.spielerAvatar}>{players[aktSpieler]?.avatar ?? '⚔️'}</Text>
          <View>
            <Text style={s.spielerLabel}>FACKEL BEI</Text>
            <Text style={s.spielerName}>{players[aktSpieler]?.name ?? 'Spieler'}</Text>
          </View>
        </View>

        {/* Alle Spieler */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scroll} contentContainerStyle={s.scrollContent}>
          {players.map((sp, i) => (
            <View key={i} style={[s.miniSpieler, i === aktSpieler && s.miniAktiv]}>
              <Text style={s.miniAvatar}>{sp.avatar}</Text>
              <Text style={[s.miniName, i === aktSpieler && s.miniNameAktiv]}>{sp.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Buttons */}
        {laeuft && (
          <TouchableOpacity style={s.goldBtn} onPress={weitergeben} activeOpacity={0.8}>
            <Text style={s.goldBtnText}>🔥 WEITERGEBEN</Text>
          </TouchableOpacity>
        )}
        {!laeuft && !explodiert && !showRegeln && (
          <TouchableOpacity style={s.goldBtn} onPress={starten}>
            <Text style={s.goldBtnText}>🔥 NEUE RUNDE</Text>
          </TouchableOpacity>
        )}

        {/* Spannungs-Warnung */}
        {spannung > 75 && laeuft && (
          <Text style={s.warnung}>⚠️ Die Fackel brennt heiss...</Text>
        )}
        {spannung > 90 && laeuft && (
          <Text style={[s.warnung, { color: '#EF4444', fontSize: 14 }]}>💀 SIE KANN JETZT EXPLODIEREN!</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0704' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.1)',
    gap: 8,
  },
  backBtn: { padding: 4 },
  back: { color: 'rgba(201,168,76,0.6)', fontSize: 10, letterSpacing: 1 },
  headerMitte: { flex: 1, alignItems: 'center' },
  titel: { fontSize: 13, color: '#C9A84C', fontWeight: '800', letterSpacing: 1 },
  rundeText: { fontSize: 9, color: 'rgba(201,168,76,0.4)', marginTop: 2 },
  spannungsContainer: { alignItems: 'center', gap: 3 },
  spannungsLabel: { fontSize: 10 },
  spannungsBar: { width: 50, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  spannungsFill: { height: '100%', borderRadius: 2 },
  mitte: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  fackel: { textAlign: 'center' },
  timer: { fontSize: 56, fontWeight: '900', textAlign: 'center', letterSpacing: -2 },
  timerBarContainer: { width: width * 0.8, height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  timerBarFill: { height: '100%', borderRadius: 2 },
  spielerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24, paddingVertical: 14,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: 30, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
  },
  spielerLabel: { fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: 2 },
  spielerAvatar: { fontSize: 28 },
  spielerName: { fontSize: 20, color: '#E8D5A3', fontWeight: '800' },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: 8, gap: 8 },
  miniSpieler: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  miniAktiv: { borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)' },
  miniAvatar: { fontSize: 18 },
  miniName: { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  miniNameAktiv: { color: '#C9A84C' },
  goldBtn: {
    width: width * 0.85, paddingVertical: 20,
    backgroundColor: '#C9A84C', borderRadius: 16, alignItems: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16,
  },
  goldBtnText: { fontSize: 17, color: '#0A0704', fontWeight: '900', letterSpacing: 2 },
  warnung: { fontSize: 12, color: '#F97316', textAlign: 'center', letterSpacing: 1 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  box: {
    width: '100%', backgroundColor: '#120A03',
    borderRadius: 20, padding: 28,
    borderWidth: 2, borderColor: 'rgba(201,168,76,0.3)',
  },
  boxTitel: {
    fontSize: 18, color: '#C9A84C', fontWeight: '800',
    letterSpacing: 2, marginBottom: 14, textAlign: 'center',
  },
  boxText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22, marginBottom: 24 },
  explosionEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 8 },
  kartenTyp: { fontSize: 11, fontWeight: '800', letterSpacing: 3, textAlign: 'center', marginBottom: 8 },
  opferText: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 10 },
  kartenText: {
    fontSize: 19, color: '#E8D5A3', fontWeight: '600',
    textAlign: 'center', lineHeight: 28, marginBottom: 24,
  },
});