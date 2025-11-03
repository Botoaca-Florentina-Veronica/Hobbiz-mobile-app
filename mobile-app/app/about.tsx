import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface FAQ { question: string; answer: string; }

const FAQS: FAQ[] = [
  { question: 'Este gratuit să folosesc Hobbiz?', answer: 'Da, înregistrarea și utilizarea de bază a platformei Hobbiz sunt complet gratuite. Poți publica și răspunde la anunțuri și comunica cu alți utilizatori fără costuri.' },
  { question: 'Cum îmi protejez datele personale?', answer: 'Luăm în serios protecția datelor tale. Folosim criptare avansată și nu împărtășim informațiile tale personale cu terți fără consimțământ explicit.' },
  { question: 'Pot vinde atât produse cât și servicii?', answer: 'Absolut! Poți promova servicii, produse handmade, obiecte, vechituri, alimente și multe altele.' },
  { question: 'Cum funcționează sistemul de mesagerie?', answer: 'Mesageria integrată îți permite discuții directe, negociere și coordonare în siguranță.' },
];

export default function AboutScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  // Use a conservative breakpoint: >=350dp -> 2 coloane, altfel 1 coloană
  const isTwoCol = width >= 350;

  // Dark palette tints (used as accents). Matches the attached palette.
  const tints = {
    a10: '#f51866',
    a20: '#fa4875',
    a30: '#fe6585',
    a40: '#ff7e95',
    a50: '#ff96a6',
    a60: '#ffabb7',
  } as const;
  const tintList = [tints.a10, tints.a20, tints.a30, tints.a40, tints.a50, tints.a60];

  const toggle = (idx: number) => setOpen(open === idx ? null : idx);
  const features = [
    'Descoperi o nouă sursă de venit',
    'Publici anunțuri pentru serviciile sau produsele tale',
    'Află despre ofertele locale sau naționale',
    'Salvează anunțurile preferate și contactează direct vânzătorii',
    'Cunoaște alți oameni cu aceleași pasiuni și colaborează sau conversează cu ei',
    'Gestionează-ți contul și anunțurile rapid și intuitiv',
  ];

  const reasons = [
    'Platformă modernă și rapidă',
    'Comunitate prietenoasă și suport rapid',
    'Promovare gratuită pentru pasiunile tale',
    'Interfață intuitivă și experiență de utilizare optimă',
    'Securitate și confidențialitate garantate',
    'Conectare directă între creatori și cumpărători',
  ];

  const steps = [
    { n: 1, t: 'Înregistrează-te', d: 'Creează un cont gratuit' },
    { n: 2, t: 'Publică sau caută', d: 'Adaugă anunțuri sau găsește ce îți trebuie' },
    { n: 3, t: 'Conectează-te', d: 'Discuții directe prin mesagerie' },
    { n: 4, t: 'Colaborează', d: 'Tranzacții sigure și colaborări' },
  ];

  const values = [
    { icon: '🛡️', title: 'Securitate', text: 'Protejăm datele și interacțiunile tale.' },
    { icon: '🤝', title: 'Comunitate', text: 'Spațiu prietenos și colaborativ.' },
    { icon: '🏗️', title: 'Dezvoltare', text: 'Îmbunătățim constant experiența.' },
    { icon: '⚡', title: 'Simplitate', text: 'Ne dorim să facilităm cât mai mult utilizarea platformei.' },
  ];

  // StrokeWord: layered white text behind the colored word to simulate a simple contour/stroke
  const StrokeWord = ({ children, color = tints.a10, stroke = true }: { children: React.ReactNode; color?: string; stroke?: boolean }) => (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {stroke && (
        <>
          <ThemedText style={[styles.heroTitle, { color: '#ffffff', position: 'absolute', left: -1, top: 0, zIndex: 0 }]}>{children}</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: '#ffffff', position: 'absolute', left: 1, top: 0, zIndex: 0 }]}>{children}</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: '#ffffff', position: 'absolute', left: 0, top: -1, zIndex: 0 }]}>{children}</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: '#ffffff', position: 'absolute', left: 0, top: 1, zIndex: 0 }]}>{children}</ThemedText>
        </>
      )}
      <ThemedText style={[styles.heroTitle, { color: color, fontWeight: '800', zIndex: 1 }]}>{children}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
              </TouchableOpacity>
              <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Despre noi</ThemedText>
            </View>

            {/* Hero */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: tints.a10,
                  borderRadius: tokens.radius.lg,
                  padding: tokens.spacing.xl,
                  ...tokens.shadow.elev2,
                },
              ]}
            >
              <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: '#ffffff',
                      borderRadius: tokens.radius.pill,
                      paddingHorizontal: tokens.spacing.lg,
                      paddingVertical: tokens.spacing.sm,
                      borderWidth: 0,
                      alignSelf: 'center',
                    },
                  ]}
                >
                  <ThemedText style={[styles.badgeText, { color: tints.a10, textAlign: 'center' }]}>✨ Platforma pasionaților</ThemedText>
                </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: tokens.spacing.md }}>
                <ThemedText style={[styles.heroTitle, { color: '#ffffff' }]}>Transformă-ți </ThemedText>
                <View style={{ marginHorizontal: 4 }}>
                  <StrokeWord color={tints.a40} stroke={false}>pasiunea</StrokeWord>
                </View>
                <ThemedText style={[styles.heroTitle, { color: '#ffffff' }]}> în oportunitate</ThemedText>
              </View>

            {/* subtle decorative element: a lighter strip to mimic web gradient */}
              <View
                style={{
                  position: 'absolute',
                  right: -10,
                  bottom: -20,
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: tints.a60,
                  opacity: 0.12,
                  transform: [{ rotate: '20deg' }],
                }}
              />
            </View>

            {/* Mission */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <View style={styles.missionHeader}>            
                <View style={[styles.missionIcon, { backgroundColor: tokens.colors.elev }]}>              
                  <ThemedText style={{ fontSize: 22 }}>🎯</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.missionTitle, { color: tokens.colors.text }]}>Misiunea noastră</ThemedText>
                  <ThemedText style={[styles.missionSubtitle, { color: tokens.colors.muted }]}>Construim punți între talente și oportunități</ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.text }]}>Hobbiz este o comunitate care celebrează autenticitatea și creativitatea. Credem că fiecare talent merită să fie văzut și apreciat.</ThemedText>

              <View style={styles.pillars}>            
                {[
                  { icon: '🌟', title: 'Autenticitate', text: 'Promovăm produse și servicii unice, create cu pasiune' },
                  { icon: '🤝', title: 'Comunitate', text: 'Legăm pasionați și clienți în mod direct și cald' },
                  { icon: '🚀', title: 'Creștere', text: 'Oferim instrumente pentru dezvoltarea afacerilor creative' },
                ].map(p => (
                  <View key={p.title} style={[styles.pillarItem, { borderColor: tokens.colors.border }]}>                
                    <View style={styles.pillarIcon}><ThemedText>{p.icon}</ThemedText></View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.pillarTitle, { color: tokens.colors.text }]}>{p.title}</ThemedText>
                      <ThemedText style={[styles.pillarText, { color: tokens.colors.muted }]}>{p.text}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Features */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>Ce poți face pe Hobbiz?</ThemedText>
              <View style={styles.checkList}>
                {features.map(line => (
                  <View key={line} style={styles.checkRow}>
                    <View style={[styles.checkIconWrapper, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border }]}
                    >
                      <Ionicons name="checkmark" size={16} color={tintList[features.indexOf(line) % tintList.length]} />
                    </View>
                    <ThemedText style={[styles.checkText, { color: tokens.colors.muted }]}>{line}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* Reasons */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>De ce să alegi Hobbiz?</ThemedText>
              <View style={styles.checkList}>
                {reasons.map(line => (
                  <View key={line} style={styles.checkRow}>
                    <View style={[styles.checkIconWrapper, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border }]}>
                      <Ionicons name="checkmark" size={16} color={tintList[reasons.indexOf(line) % tintList.length]} />
                    </View>
                    <ThemedText style={[styles.checkText, { color: tokens.colors.muted }]}>{line}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* How it works */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>Cum funcționează?</ThemedText>
              {steps.map((step, idx) => (
                <View key={step.n} style={styles.stepRow}>
                  <View style={[styles.stepCircle, { backgroundColor: tintList[idx % tintList.length], borderColor: 'transparent', borderWidth: 0 }]}>
                    <ThemedText style={[styles.stepNumber, { color: '#ffffff' }]}>{step.n}</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.stepTitle, { color: tokens.colors.text }]}>{step.t}</ThemedText>
                    <ThemedText style={[styles.stepDesc, { color: tokens.colors.muted }]}>{step.d}</ThemedText>
                  </View>
                </View>
              ))}
            </View>

            {/* Values */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>Valorile noastre</ThemedText>
              <View style={styles.valuesGrid}>
                {values.map(v => (
                  <View key={v.title} style={[
                    styles.valueCard, 
                    { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border },
                    isTwoCol ? { width: '48%' } : { width: '100%' }
                  ]}>
                    <ThemedText style={styles.valueIcon}>{v.icon}</ThemedText>
                    <ThemedText style={[styles.valueTitle, { color: tokens.colors.text }]}>{v.title}</ThemedText>
                    <ThemedText style={[styles.valueText, { color: tokens.colors.muted }]}>{v.text}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* FAQ */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>Întrebări frecvente</ThemedText>
              {FAQS.map((f, idx) => {
                const tint = tintList[idx % tintList.length];
                return (
                  <View key={f.question}>
                    <TouchableOpacity
                      onPress={() => toggle(idx)}
                      activeOpacity={0.7}
                      style={[
                        styles.faqQuestion,
                        { borderColor: tokens.colors.border, borderLeftWidth: 4, borderLeftColor: tint, paddingLeft: 12 },
                      ]}
                    >
                      <ThemedText style={[styles.faqQuestionText, { color: tint }]}>{f.question}</ThemedText>
                      <Ionicons name={open === idx ? 'chevron-up' : 'chevron-down'} size={18} color={tint} />
                    </TouchableOpacity>
                    {open === idx && (
                      <View style={styles.faqAnswer}>                  
                        <ThemedText style={{ color: tokens.colors.muted, lineHeight: 20 }}>{f.answer}</ThemedText>
                      </View>
                    )}
                  </View>
                );
              })}
              <ThemedText style={[styles.updateText, { color: tokens.colors.muted }]}>Ultima actualizare: 19 iulie 2025</ThemedText>
            </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 120, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 24, fontWeight: '600' },

  heroCard: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgePill: { alignSelf: 'flex-start', marginBottom: 12 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  heroTitle: { fontSize: 30, fontWeight: '800', lineHeight: 40 },

  card: { borderRadius: 16, padding: 18, gap: 16, borderWidth: 1 },
  missionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  missionIcon: { width: 54, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  missionTitle: { fontSize: 18, fontWeight: '700' },
  missionSubtitle: { fontSize: 13, fontWeight: '500' },
  paragraph: { fontSize: 14, lineHeight: 20 },

  pillars: { gap: 12, marginTop: 12 },
  pillarItem: { flexDirection: 'row', gap: 12, padding: 12, borderWidth: 1, borderRadius: 12 },
  pillarIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.04)' },
  pillarTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  pillarText: { fontSize: 13, lineHeight: 18 },

  sectionHeader: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  checkList: { marginTop: 8 },
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 },
  checkIconWrapper: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  checkText: { flex: 1, fontSize: 14, lineHeight: 20 },

  stepRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 12 },
  stepCircle: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNumber: { fontSize: 16, fontWeight: '700' },
  stepTitle: { fontSize: 15, fontWeight: '700' },
  stepDesc: { fontSize: 13, lineHeight: 18 },

  valuesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },
  valueCard: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 8, minHeight: 130, marginBottom: 12 },
  valueIcon: { fontSize: 22 },
  valueTitle: { fontSize: 15, fontWeight: '700' },
  valueText: { fontSize: 12, lineHeight: 16, flex: 1 },

  faqQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  faqQuestionText: { fontSize: 15, fontWeight: '600', flex: 1, paddingRight: 8 },
  faqAnswer: { paddingVertical: 12 },
  updateText: { fontSize: 11, marginTop: 12, textAlign: 'center' },
});
