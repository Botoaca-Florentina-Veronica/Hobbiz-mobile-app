import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, ScrollView, View, TouchableOpacity, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocale } from '@/src/context/LocaleContext';
import { LinearGradient } from 'expo-linear-gradient';

const WEB_PRIMARY = '#100e9aff';
const WEB_ACCENT = '#fcc22eff';

export default function DataDeletionScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = tokens.colors.bg === '#121212';
  const { locale } = useLocale();

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

  const StepCard = ({ step, title, children }: { step: string; title: string; children: React.ReactNode }) => (
    <View style={[styles.stepCard, { backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa', borderColor: tokens.colors.border }]}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepNumber, { backgroundColor: tokens.colors.primary }]}>
          <ThemedText style={styles.stepNumberText}>{step}</ThemedText>
        </View>
        <ThemedText style={[styles.stepTitle, { color: tokens.colors.text }]}>{title}</ThemedText>
      </View>
      <View style={styles.stepContent}>
        {children}
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top header with back */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{locale === 'en' ? 'Data Deletion' : "Ștergerea datelor"}</ThemedText>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? `${WEB_PRIMARY}22` : WEB_PRIMARY }]}>          
          <View style={styles.heroOverlay} />
            <ThemedText style={[styles.heroIcon, { color: isDark ? tokens.colors.primary : '#fff' }]}>🗑️</ThemedText>
            <ThemedText style={[styles.heroTitle, { color: '#fff' }]}>{locale === 'en' ? 'Data Deletion Instructions' : 'Instrucțiuni ștergere date'}</ThemedText>
            <ThemedText style={[styles.heroDate, { color: '#fff' }]}>{locale === 'en' ? 'Your right to data deletion' : 'Dreptul tău de a șterge datele'}</ThemedText>
        </View>

        {/* Intro Box */}
        <View style={[styles.introBox, { backgroundColor: isDark ? '#282828' : WEB_ACCENT, borderColor: isDark ? 'rgba(245,24,102,0.3)' : WEB_ACCENT }]}>          
          <ThemedText style={[styles.introIcon, { color: isDark ? tokens.colors.primary : '#2c5f7a' }]}>ℹ️</ThemedText>
          <View style={styles.introContent}>            
            <ThemedText style={[styles.introStrong, { color: isDark ? '#fff' : '#2c5f7a' }]}>{locale === 'en' ? 'Complete Control Over Your Data' : 'Control complet asupra datelor tale'}</ThemedText>
              <ThemedText style={[styles.paragraph, { color: isDark ? '#fff' : '#2c5f7a' }]}>{locale === 'en' ? 'At Hobbiz, we respect your right to privacy and data deletion under GDPR. You have full control over your personal data and can request deletion at any time. This page explains how to delete all data associated with your account, including data received through Facebook Login or other third-party authentication services.' : 'La Hobbiz, respectăm dreptul tău la confidențialitate și ștergerea datelor conform GDPR. Ai control complet asupra datelor tale personale și poți solicita ștergerea oricând. Această pagină explică cum să ștergi toate datele asociate contului tău, inclusiv datele primite prin Facebook Login sau alte servicii de autentificare terțe.'}</ThemedText>
          </View>
        </View>

        {/* Data Deletion Options */}
        <SectionCard title={locale === 'en' ? '1. What data will be deleted?' : '1. Ce date vor fi șterse?'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'When you request account deletion, the following data will be permanently removed from our systems:' : 'Când soliciți ștergerea contului, următoarele date vor fi eliminate permanent din sistemele noastre:'}</ThemedText>
          <Bullet>{locale === 'en' ? 'Account information (name, email, phone, profile picture, cover image)' : 'Informații cont (nume, email, telefon, poză profil, imagine copertă)'}</Bullet>
          <Bullet>{locale === 'en' ? 'All announcements you created (titles, descriptions, images, contact details)' : 'Toate anunțurile create de tine (titluri, descrieri, imagini, detalii contact)'}</Bullet>
          <Bullet>{locale === 'en' ? 'Messages and conversations with other users' : 'Mesaje și conversații cu alți utilizatori'}</Bullet>
          <Bullet>{locale === 'en' ? 'Reviews you wrote and reviews others wrote about you' : 'Recenzii scrise de tine și recenzii scrise despre tine'}</Bullet>
          <Bullet>{locale === 'en' ? 'Favorite/saved announcements' : 'Anunțuri favorite/salvate'}</Bullet>
          <Bullet>{locale === 'en' ? 'Login credentials and authentication tokens (including Facebook/Google login data)' : 'Credențiale login și token-uri autentificare (inclusiv date login Facebook/Google)'}</Bullet>
          <Bullet>{locale === 'en' ? 'App usage data and preferences' : 'Date utilizare aplicație și preferințe'}</Bullet>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568', fontStyle: 'italic', marginTop: 8 }]}>{locale === 'en' ? 'Note: Some anonymous analytics data may be retained for platform improvement, but this data cannot be linked back to your identity.' : 'Notă: Unele date analitice anonime pot fi păstrate pentru îmbunătățirea platformei, dar aceste date nu pot fi legate de identitatea ta.'}</ThemedText>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '2. How to delete your data' : '2. Cum să îți ștergi datele'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'You have three options to delete your Hobbiz account and all associated data:' : 'Ai trei opțiuni pentru a-ți șterge contul Hobbiz și toate datele asociate:'}</ThemedText>
          
          <StepCard step="A" title={locale === 'en' ? 'Delete from App Settings (Recommended)' : 'Ștergere din Setări Aplicație (Recomandat)'}>
            <Bullet>{locale === 'en' ? 'Open the Hobbiz app and log into your account' : 'Deschide aplicația Hobbiz și autentifică-te în cont'}</Bullet>
            <Bullet>{locale === 'en' ? 'Go to Settings > Account > Delete Account' : 'Mergi la Setări > Cont > Șterge Cont'}</Bullet>
            <Bullet>{locale === 'en' ? 'Read the warning and confirm deletion' : 'Citește avertismentul și confirmă ștergerea'}</Bullet>
            <Bullet>{locale === 'en' ? 'Enter your password for final confirmation' : 'Introdu parola pentru confirmarea finală'}</Bullet>
            <Bullet>{locale === 'en' ? 'Your data will be permanently deleted within 30 days' : 'Datele tale vor fi șterse permanent în 30 de zile'}</Bullet>
          </StepCard>

          <StepCard step="B" title={locale === 'en' ? 'Delete via Email Request' : 'Ștergere prin Cerere Email'}>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>
              {locale === 'en' ? <>Send an email to <ThemedText onPress={() => openMail('team.hobbiz@gmail.com')} style={[styles.link, { color: tokens.colors.primary }]}>team.hobbiz@gmail.com</ThemedText> with the subject line &quot;Data Deletion Request&quot; and include:</> : <>Trimite un email la <ThemedText onPress={() => openMail('team.hobbiz@gmail.com')} style={[styles.link, { color: tokens.colors.primary }]}>team.hobbiz@gmail.com</ThemedText> cu subiectul &quot;Cerere Ștergere Date&quot; și include:</>}
            </ThemedText>
            <Bullet>{locale === 'en' ? 'Your full name as registered on Hobbiz' : 'Numele complet așa cum este înregistrat pe Hobbiz'}</Bullet>
            <Bullet>{locale === 'en' ? 'Your email address associated with your account' : 'Adresa de email asociată contului tău'}</Bullet>
            <Bullet>{locale === 'en' ? 'Statement confirming you want to delete all your data' : 'Declarație confirmând că dorești ștergerea tuturor datelor'}</Bullet>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568', marginTop: 8 }]}>{locale === 'en' ? 'We will verify your identity and process the deletion within 30 days. You will receive a confirmation email once completed.' : 'Vom verifica identitatea ta și vom procesa ștergerea în 30 de zile. Vei primi un email de confirmare odată finalizat.'}</ThemedText>
          </StepCard>

          <StepCard step="C" title={locale === 'en' ? 'Revoke Facebook Access' : 'Revocă Accesul Facebook'}>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'If you signed up using Facebook Login, you can also revoke Hobbiz\'s access to your Facebook data:' : 'Dacă te-ai înregistrat folosind Facebook Login, poți revoca și accesul Hobbiz la datele tale Facebook:'}</ThemedText>
            <Bullet>{locale === 'en' ? 'Go to Facebook Settings > Apps and Websites' : 'Mergi la Setări Facebook > Aplicații și Site-uri Web'}</Bullet>
            <Bullet>{locale === 'en' ? 'Find &quot;Hobbiz&quot; in the list of active apps' : 'Găsește "Hobbiz" în lista aplicațiilor active'}</Bullet>
            <Bullet>{locale === 'en' ? 'Click &quot;Remove&quot; to revoke all permissions' : 'Click pe "Elimină" pentru a revoca toate permisiunile'}</Bullet>
            <Bullet>{locale === 'en' ? 'Optionally, request deletion of your Hobbiz app activity on Facebook' : 'Opțional, solicită ștergerea activității tale din aplicația Hobbiz pe Facebook'}</Bullet>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568', fontStyle: 'italic', marginTop: 8 }]}>{locale === 'en' ? 'Note: Revoking Facebook access will only disconnect the app from Facebook. To completely delete your Hobbiz account data, you must also use Option A or B above.' : 'Notă: Revocarea accesului Facebook va deconecta doar aplicația de Facebook. Pentru a șterge complet datele contului Hobbiz, trebuie să folosești și Opțiunea A sau B de mai sus.'}</ThemedText>
          </StepCard>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '3. Data deletion timeline' : '3. Calendarul ștergerii datelor'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Our data deletion process follows these steps:' : 'Procesul nostru de ștergere a datelor urmează acești pași:'}</ThemedText>
          <View style={[styles.timelineItem, { borderLeftColor: tokens.colors.primary }]}>
            <ThemedText style={[styles.timelineTitle, { color: isDark ? '#ffffff' : WEB_PRIMARY }]}>{locale === 'en' ? 'Immediate (Day 0)' : 'Imediat (Ziua 0)'}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Your account is deactivated and no longer accessible to you or other users. Your profile, announcements, and messages disappear from the platform.' : 'Contul tău este dezactivat și nu mai este accesibil pentru tine sau alți utilizatori. Profilul, anunțurile și mesajele tale dispar de pe platformă.'}</ThemedText>
          </View>
          <View style={[styles.timelineItem, { borderLeftColor: tokens.colors.primary }]}>
            <ThemedText style={[styles.timelineTitle, { color: isDark ? '#ffffff' : WEB_PRIMARY }]}>{locale === 'en' ? 'Within 7 days' : 'În 7 zile'}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'All user-visible data is removed from production databases. Backup copies are marked for deletion.' : 'Toate datele vizibile pentru utilizatori sunt eliminate din bazele de date de producție. Copiile de backup sunt marcate pentru ștergere.'}</ThemedText>
          </View>
          <View style={[styles.timelineItem, { borderLeftColor: tokens.colors.primary }]}>
            <ThemedText style={[styles.timelineTitle, { color: isDark ? '#ffffff' : WEB_PRIMARY }]}>{locale === 'en' ? 'Within 30 days' : 'În 30 de zile'}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Complete and permanent deletion from all systems, including backups and archives. Deletion confirmation email is sent to your registered email address.' : 'Ștergere completă și permanentă din toate sistemele, inclusiv backup-uri și arhive. Email-ul de confirmare a ștergerii este trimis la adresa ta de email înregistrată.'}</ThemedText>
          </View>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568', marginTop: 12 }]}>{locale === 'en' ? 'During the first 7 days after deletion request, you can contact us to cancel the deletion and recover your account. After 7 days, deletion becomes irreversible.' : 'În primele 7 zile după cererea de ștergere, poți să ne contactezi pentru a anula ștergerea și recupera contul. După 7 zile, ștergerea devine ireversibilă.'}</ThemedText>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '4. Important considerations' : '4. Considerații importante'}>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>{locale === 'en' ? 'Data that may be retained' : 'Date care pot fi păstrate'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'In certain limited circumstances, some data may be retained even after deletion:' : 'În anumite circumstanțe limitate, unele date pot fi păstrate chiar și după ștergere:'}</ThemedText>
          <Bullet>{locale === 'en' ? 'Legal obligations: We may retain certain records if required by law or for legitimate legal purposes (e.g., fraud prevention, regulatory compliance)' : 'Obligații legale: Putem păstra anumite înregistrări dacă este necesar prin lege sau pentru scopuri legale legitime (ex. prevenirea fraudei, conformitate reglementară)'}</Bullet>
          <Bullet>{locale === 'en' ? 'Anonymous analytics: Aggregated, anonymized usage data that cannot be linked to you personally' : 'Analize anonime: Date agregate, anonimizate de utilizare care nu pot fi legate de tine personal'}</Bullet>
          <Bullet>{locale === 'en' ? 'Third-party copies: Content you shared publicly may have been copied by other users before deletion. We cannot control or delete such copies.' : 'Copii terțe: Conținutul partajat public poate fi fost copiat de alți utilizatori înainte de ștergere. Nu putem controla sau șterge astfel de copii.'}</Bullet>
          
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070', marginTop: 16 }]}>{locale === 'en' ? 'This action is permanent' : 'Această acțiune este permanentă'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Account deletion is irreversible after the 7-day grace period. Once your data is permanently deleted:' : 'Ștergerea contului este ireversibilă după perioada de grație de 7 zile. Odată ce datele tale sunt șterse permanent:'}</ThemedText>
          <Bullet>{locale === 'en' ? 'You cannot recover your account, announcements, messages, or reviews' : 'Nu poți recupera contul, anunțurile, mesajele sau recenziile'}</Bullet>
          <Bullet>{locale === 'en' ? 'If you want to use Hobbiz again, you must create a new account from scratch' : 'Dacă vrei să folosești Hobbiz din nou, trebuie să creezi un cont nou de la zero'}</Bullet>
          <Bullet>{locale === 'en' ? 'Your username and email may become available for others to register' : 'Numele de utilizator și email-ul tău pot deveni disponibile pentru alții să se înregistreze'}</Bullet>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '5. Need help?' : '5. Ai nevoie de ajutor?'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>
            {locale === 'en' ? <>If you have questions about data deletion or encounter any issues, please contact our support team at <ThemedText onPress={() => openMail('team.hobbiz@gmail.com')} style={[styles.link, { color: tokens.colors.primary }]}>team.hobbiz@gmail.com</ThemedText>. We typically respond within 48 hours.</> : <>Dacă ai întrebări despre ștergerea datelor sau întâmpini probleme, te rugăm să contactezi echipa noastră de suport la <ThemedText onPress={() => openMail('team.hobbiz@gmail.com')} style={[styles.link, { color: tokens.colors.primary }]}>team.hobbiz@gmail.com</ThemedText>. De obicei răspundem în 48 de ore.</>}
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568', marginTop: 12 }]}>{locale === 'en' ? 'For more information about how we handle your data, please review our Privacy Policy and Terms and Conditions.' : 'Pentru mai multe informații despre cum gestionăm datele tale, te rugăm să consulți Politica de Confidențialitate și Termenii și Condițiile.'}</ThemedText>
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
  stepCard: { 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700'
  },
  stepTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600'
  },
  stepContent: {
    paddingLeft: 48
  },
  timelineItem: {
    borderLeftWidth: 3,
    paddingLeft: 16,
    marginBottom: 16,
    paddingBottom: 8
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6
  }
});