import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, ScrollView, View, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// App palette per user request
const WEB_PRIMARY = '#100e9aff';
const WEB_ACCENT = '#fcc22eff';
const WEB_ACCENT_GRAD_TO = '#fcc22eff';
const WEB_BORDER_LIGHT = '#ffffff';
const WEB_TEXT_DARK = '#100e9aff';
const WEB_TEXT_BODY = '#64748b';

export default function PrivacyScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = tokens.colors.bg === '#121212';

  const openMail = (addr: string) => Linking.openURL(`mailto:${addr}`);

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.bulletRow}>
      <ThemedText style={[styles.bulletSymbol, { color: tokens.colors.primary }]}>→</ThemedText>
      <ThemedText style={[styles.paragraph, styles.bulletText, { color: isDark ? '#ffffff' : '#4a5568' }]}>{children}</ThemedText>
    </View>
  );

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>      
      <LinearGradient colors={[tokens.colors.primary, isDark ? '#f5186644' : WEB_ACCENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sectionGradient} />
      <ThemedText style={[styles.sectionHeading, { color: isDark ? '#ffffff' : WEB_PRIMARY }]}>{title}</ThemedText>
      {children}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top header with back */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Politica de confidențialitate</ThemedText>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? `${WEB_PRIMARY}22` : WEB_PRIMARY }]}>          
          <View style={styles.heroOverlay} />
            <ThemedText style={[styles.heroIcon, { color: isDark ? tokens.colors.primary : '#fff' }]}>🛡️</ThemedText>
            <ThemedText style={[styles.heroTitle, { color: '#fff' }]}>Politica de confidențialitate</ThemedText>
            <ThemedText style={[styles.heroDate, { color: '#fff' }]}>Ultima actualizare: 19 iulie 2025</ThemedText>
        </View>

        {/* Intro / Transparency Box */}
        <View style={[styles.introBox, { backgroundColor: isDark ? '#282828' : WEB_ACCENT, borderColor: isDark ? 'rgba(245,24,102,0.3)' : WEB_ACCENT }]}>          
          <ThemedText style={[styles.introIcon, { color: isDark ? tokens.colors.primary : '#2c5f7a' }]}>ℹ️</ThemedText>
          <View style={styles.introContent}>            
            <ThemedText style={[styles.introStrong, { color: isDark ? '#fff' : '#2c5f7a' }]}>Transparență și protecție a datelor</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#fff' : '#2c5f7a' }]}>La Hobbiz, considerăm protecția datelor personale o responsabilitate fundamentală. Acest document descrie în detaliu practicile noastre de gestionare a informațiilor, conform Regulamentului General privind Protecția Datelor (GDPR) și legislației românești aplicabile.</ThemedText>
          </View>
        </View>

        {/* Sections */}
        <SectionCard title="1. Scopul și domeniul de aplicare">
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Această politică se aplică tuturor informațiilor colectate prin intermediul platformei Hobbiz, inclusiv prin website, aplicații mobile și orice alte interfețe asociate. Documentul definește cadrul legal și operațional pentru prelucrarea datelor cu caracter personal, inclusiv scopurile de colectare, metodele de procesare, drepturile utilizatorilor și măsurile de securitate implementate.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Operatorul de date este SC Hobbiz SRL, înregistrată în România, care determină scopurile și mijloacele prelucrării datelor. Pentru orice nelămuriri referitoare la conținutul acestei politici, vă rugăm să ne contactați folosind detaliile furnizate în secțiunea finală.</ThemedText>
        </SectionCard>

        <SectionCard title="2. Categorii de date prelucrate">
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>Date furnizate voluntar</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>În procesul de creare a contului și utilizare a platformei colectăm nume complet, email, telefon, date demografice opționale (vârstă, gen) și orice informații introduse voluntar în profil sau conținut generat. Pentru servicii premium, datele de plată sunt procesate exclusiv prin procesatori certificați PCI DSS.</ThemedText>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>Date colectate automat</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Adresă IP, identificatori dispozitiv, browser, sistem de operare, date de utilizare (pagini, timp, acțiuni), localizare aproximativă derivată și tehnologii cookie pentru funcționalitate, analiză și personalizare.</ThemedText>
        </SectionCard>

        <SectionCard title="3. Scopurile și bazele juridice ale prelucrării">
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>Executarea contractului</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Acces la platformă, gestionare cont, publicare anunțuri, facilitarea comunicării și procesarea tranzacțiilor.</ThemedText>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>Interese legitime</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Îmbunătățirea serviciilor, prevenirea fraudelor și abuzurilor, analiză utilizare, dezvoltare funcționalități, securizare infrastructură.</ThemedText>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>Consimțământ</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Marketing direct, anumite analize și cookie-uri neesențiale (revocabil oricând).</ThemedText>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>Conformitate legală</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Îndeplinirea obligațiilor fiscale, AML și alte reglementări aplicabile.</ThemedText>
        </SectionCard>

        <SectionCard title="4. Securitatea și confidențialitatea datelor">
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Măsuri tehnice și organizatorice: criptare în tranzit și la rest, control granular de acces (principiul privilegiilor minime), monitorizare și jurnalizare, teste de penetrare periodice, politici interne și instruire personal.</ThemedText>
          <Bullet>Criptare avansată (TLS 1.2+/TLS 1.3, AES, criptare suplimentară per câmp)</Bullet>
          <Bullet>Control acces și revizuiri permisiuni</Bullet>
          <Bullet>Testări de securitate și management vulnerabilități</Bullet>
          <Bullet>Politici interne + training periodic</Bullet>
        </SectionCard>

        <SectionCard title="5. Securitatea informațiilor tale">
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Arhitectură multi-layer (centre date Tier III+/ISO 27001 UE), protecție perimetrală, securitate aplicativă secure-by-design, MFA pentru acces privilegiat, criptare end-to-end, backup redundant și plan de răspuns la incidente.</ThemedText>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>Recomandări utilizatori</ThemedText>
          <Bullet>Folosiți parole complexe și unice</Bullet>
          <Bullet>Activați autentificarea cu doi factori</Bullet>
          <Bullet>Evitați rețele Wi‑Fi publice nesecurizate</Bullet>
          <Bullet>Verificați periodic activitatea contului</Bullet>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Întrebări de securitate: <ThemedText onPress={() => openMail('security@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>security@hobbiz.ro</ThemedText></ThemedText>
        </SectionCard>

        <SectionCard title="6. Drepturile utilizatorilor">
          <Bullet>Dreptul de acces și portabilitate</Bullet>
          <Bullet>Dreptul de rectificare</Bullet>
          <Bullet>Dreptul la ștergere</Bullet>
            <Bullet>Dreptul la restricționare</Bullet>
          <Bullet>Dreptul de opoziție și retragere consimțământ</Bullet>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>Solicitări la: <ThemedText onPress={() => openMail('protectiadatelor@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>protectiadatelor@hobbiz.ro</ThemedText> (răspuns în max. 30 zile; putem cere verificare identitate).</ThemedText>
        </SectionCard>

        <SectionCard title="7. Contact și informații suplimentare">
          <Bullet>Operator: SC Hobbiz SRL</Bullet>
          <Bullet>DPO: <ThemedText onPress={() => openMail('dpo@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>dpo@hobbiz.ro</ThemedText></Bullet>
          <Bullet>Incidente securitate: <ThemedText onPress={() => openMail('security@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>security@hobbiz.ro</ThemedText></Bullet>
          <Bullet>Plângeri: Autoritatea Națională de Supraveghere</Bullet>
        </SectionCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  heroCard: { padding: 40, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  heroOverlay: { position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(252,194,46,0.18)' },
  heroIcon: { fontSize: 48, marginBottom: 20 },
  heroTitle: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  heroDate: { fontSize: 14, fontWeight: '500', opacity: 0.95 },
  introBox: { borderRadius: 20, padding: 28, flexDirection: 'row', gap: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  introIcon: { fontSize: 30, marginTop: 4 },
  introContent: { flex: 1 },
  introStrong: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sectionCard: { borderRadius: 20, padding: 24, marginBottom: 10, overflow: 'hidden', position: 'relative', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },
  sectionGradient: { position: 'absolute', top: 0, left: 0, height: 4, right: 0 },
  sectionHeading: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  subHeading: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  paragraph: { fontSize: 14.5, lineHeight: 22, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bulletSymbol: { fontSize: 16, marginRight: 6, lineHeight: 22, fontWeight: '700' },
  bulletText: { flex: 1, marginBottom: 0 },
  link: { textDecorationLine: 'underline' },
});
