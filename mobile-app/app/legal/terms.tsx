import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// App palette per user request
const WEB_PRIMARY = '#100e9aff';
const WEB_ACCENT = '#fcc22eff';
const WEB_ACCENT_GRAD_TO = '#fcc22eff';
const WEB_BORDER_LIGHT = '#ffffff';
const WEB_TEXT_DARK = '#100e9aff';
const WEB_TEXT_BODY = '#64748b';

export default function TermsScreen() {
  const { tokens, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isDarkMode = isDark;
  const surface = isDarkMode ? '#1e1e1e' : tokens.colors.surface;
  const footerBg = isDarkMode ? '#1a1a1a' : '#f8fafc';
  const bodyColor = isDarkMode ? '#b0b0b0' : WEB_TEXT_BODY;
  const headingColor = isDarkMode ? WEB_ACCENT : WEB_PRIMARY;
  const subHeadingColor = isDarkMode ? '#e0e0e0' : WEB_TEXT_DARK;
  const strongColor = isDarkMode ? '#e0e0e0' : WEB_TEXT_DARK;

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
          <ThemedText style={[styles.pageTitle, { color: tokens.colors.text }]}>Termeni și condiții</ThemedText>
        </View>

        {/* Hero Header (desktop style is hidden on web mobile, we'll show compact) */}
        <View style={[styles.desktopHeader, { backgroundColor: WEB_PRIMARY }]}>          
          <ThemedText style={styles.headerIcon}>📝</ThemedText>
          <ThemedText style={styles.headerH1}>Termeni și condiții</ThemedText>
          <ThemedText style={styles.headerDate}>Ultima actualizare: 5 septembrie 2025</ThemedText>
          <View style={styles.radialOverlay} />
        </View>

        {/* Intro Gradient Card (fallback without expo-linear-gradient) */}
        <View
          style={[styles.introCard, { backgroundColor: WEB_ACCENT }]}
        >
          <View style={styles.introRow}>
            <ThemedText style={styles.introIcon}>ℹ️</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.introStrong}>Acordul de utilizare a platformei Hobbiz</ThemedText>
              <ThemedText style={styles.introParagraph}>
                Prin accesarea și utilizarea platformei Hobbiz, acceptați să respectați termenii și condițiile prezentate în acest document. Vă rugăm să citiți cu atenție aceste prevederi înainte de a crea un cont sau de a utiliza serviciile noastre.
              </ThemedText>
            </View>
          </View>
  </View>

        {/* Section 1 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>1. Definiții și interpretare</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>
            În cadrul acestor termeni și condiții, următoarele definiții se aplică: <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Platforma&quot;</ThemedText> se referă la website-ul Hobbiz și toate aplicațiile mobile asociate; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Servicii&quot;</ThemedText> include toate funcționalitățile oferite prin platformă, inclusiv publicarea anunțurilor, căutarea, comunicarea între utilizatori și procesarea plăților; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Utilizator&quot;</ThemedText> desemnează orice persoană fizică sau juridică care accesează sau folosește platforma; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Conținut&quot;</ThemedText> include texte, imagini, video, date și alte materiale încărcate pe platformă.
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>
            Platforma Hobbiz funcționează ca un marketplace digital care conectează persoane interesate să vândă sau să cumpere produse și servicii diverse. Nu suntem proprietarii sau vânzătorii produselor listate, ci facilităm interacțiunea între utilizatori prin intermediul tehnologiilor web moderne, inclusiv React.js, Node.js și baze de date MongoDB.
          </ThemedText>
        </View>

        {/* Section 2 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>2. Eligibilitate și înregistrare</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Cerințe de vârstă și capacitate juridică</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Pentru a utiliza serviciile Hobbiz, trebuie să aveți minimum 18 ani și să dețineți capacitatea juridică deplină conform legislației românești. Minorilor cu vârsta cuprinsă între 16-18 ani li se permite utilizarea platformei doar cu consimțământul explicit al părinților sau reprezentanților legali și sub supravegherea acestora.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Persoanele juridice pot utiliza platforma prin intermediul reprezentanților autorizați, care răspund pentru toate acțiunile întreprinse în numele organizației. Verificăm documentele de înregistrare pentru conturile business și ne rezervăm dreptul de a solicita documente suplimentare pentru validarea identității.</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Procesul de înregistrare</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Crearea unui cont necesită furnizarea unor informații exacte și complete: nume real, adresă de email validă și număr de telefon funcțional. Informațiile false sau înșelătoare constituie o încălcare a acestor termeni și pot duce la suspendarea sau închiderea contului fără preaviz.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Suportăm înregistrarea prin metode multiple: email și parolă, autentificare prin Google OAuth 2.0, sau prin alți furnizori de identitate autorizați. Fiecare utilizator poate deține un singur cont activ, iar crearea de conturi multiple pentru evitarea restricțiilor este strict interzisă.</ThemedText>
        </View>

        {/* Section 3 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>3. Utilizarea platformei și anunțuri</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Publicarea anunțurilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Utilizatorii pot publica anunțuri pentru vânzarea de produse noi sau second-hand, prestarea de servicii, închirierea de bunuri sau alte tranzacții comerciale legale. Fiecare anunț trebuie să conțină o descriere exactă și completă a produsului sau serviciului, fotografii reale și nemodificate și un preț corect și transparent.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Este strict interzisă publicarea de anunțuri pentru: produse contrafăcute sau piratate, substanțe interzise prin lege, arme și muniții, animale protejate sau obținute ilegal, servicii ilegale sau imorale, conținut pentru adulți sau materiale ce încalcă drepturile de autor. Monitorizăm activ conținutul prin algoritmi automatizați și moderare umană.</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Responsabilitățile utilizatorilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Utilizatorii sunt integral responsabili pentru conținutul publicat, exactitatea informațiilor furnizate și respectarea tuturor legilor aplicabile. Ne rezervăm dreptul de a elimina orice conținut care încalcă acești termeni sau legislația în vigoare, fără obligația de a oferi explicații detaliate.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Comunicarea între utilizatori trebuie să se desfășoare într-un mod respectuos și profesional. Hărțuirea, amenințările, limbajul vulgar sau discriminatoriu, spam-ul și tentativele de fraudă vor fi sancționate prin restricții temporare sau permanente ale contului.</ThemedText>
        </View>

        {/* Section 4 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>4. Tranzacții și plăți</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Facilitarea tranzacțiilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Hobbiz acționează ca intermediar tehnologic între cumpărători și vânzători, fără a fi parte în tranzacțiile efectuate. Nu garantăm calitatea, autenticitatea sau conformitatea produselor vândute, acestea fiind responsabilitatea exclusivă a vânzătorilor. Recomandăm utilizatorilor să fie precauți și să verifice întotdeauna produsele înainte de finalizarea tranzacțiilor.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Pentru anumite servicii premium, procesăm plăți prin intermediul procesatorilor certificați Stripe și PayPal, care respectă standardele PCI DSS pentru securitatea datelor financiare. Nu stocăm informații despre carduri de credit pe serverele noastre, toate datele sensibile fiind gestionate exclusiv de furnizorii specializați.</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Dispute și rezolvarea conflictelor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>În cazul disputelor între utilizatori, oferim un sistem intern de raportare și mediere, însă responsabilitatea finală pentru rezolvarea conflictelor revine părților implicate. Pentru tranzacții de valoare mare, recomandăm utilizarea de contracte scrise și metode de plată securizate care oferă protecție pentru ambele părți.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Putem interveni prin suspendarea temporară a conturilor implicate în dispute repetate sau grave, dar nu avem obligația legală de a arbitra conflictele comerciale dintre utilizatori. Pentru situații care implică posibile infracțiuni, cooperăm cu autoritățile competente conform cerințelor legale.</ThemedText>
        </View>

        {/* Section 5 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>5. Proprietate intelectuală</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Drepturile platformei</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Codul sursă, designul, logo-ul, mărcile comerciale și toate elementele tehnice ale platformei Hobbiz sunt protejate prin drepturi de autor și proprietate intelectuală. Utilizarea neautorizată a acestor elemente, inclusiv copierea codului sau replicarea designului, constituie o încălcare a drepturilor noastre și poate fi urmărită legal.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Tehnologiile folosite (React.js, Node.js, MongoDB) sunt open-source și utilizate conform licențelor respective, însă implementarea specifică și arhitectura sistemului nostru sunt proprietate exclusivă. Interzicerea reverse engineering-ului sau tentativelor de replicare a funcționalităților este strict aplicată.</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Conținutul utilizatorilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Utilizatorii rămân proprietarii conținutului pe care îl publică (fotografii, descrieri, recenzii), dar acordă Hobbiz o licență neexclusivă, transferabilă și sub-licențiabilă pentru a afișa, modifica și distribui acest conținut în scopul furnizării serviciilor platformei.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Este responsabilitatea utilizatorilor să se asigure că dețin toate drepturile necesare pentru conținutul publicat și că nu încalcă drepturile de autor ale terților. În cazul reclamațiilor DMCA valide, vom elimina prompt conținutul problematic și vom lua măsurile necesare împotriva conturilor care încalcă în mod repetat drepturile de autor.</ThemedText>
        </View>

        {/* Section 6 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>6. Securitate și protecția datelor</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Măsuri de securitate tehnice</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Implementăm măsuri avansate de securitate informatică: criptarea SSL/TLS pentru toate comunicațiile, hashing-ul securizat al parolelor cu algoritmi bcrypt, protecție împotriva atacurilor CSRF și XSS, firewall-uri configurate și monitorizare constantă pentru activități suspecte. Actualizăm regulat toate componentele software pentru a corecta vulnerabilitățile de securitate.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Datele sunt stocate în centre de date certificate SOC 2 Type II, cu backup-uri automate zilnice și sisteme de redundanță geografică. Accesul la sistemele de producție este strict controlat prin autentificare cu doi factori și jurnalizarea completă a activităților administrative.</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Responsabilitățile utilizatorilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Utilizatorii trebuie să păstreze confidențialitatea credențialelor de acces, să folosească parole complexe și unice și să ne notifice imediat în cazul suspiciunii că contul a fost compromis. Nu suntem responsabili pentru pierderi rezultate din neglijența utilizatorilor în păstrarea securității conturilor.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Activarea autentificării cu doi factori este puternic recomandată pentru toate conturile, în special pentru cele care gestionează tranzacții financiare frecvente. Oferim opțiuni multiple: SMS, aplicații TOTP (Google Authenticator, Authy) și chei hardware compatibile FIDO2.</ThemedText>
        </View>

        {/* Section 7 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>7. Limitări de răspundere</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Excluderi de răspundere</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Hobbiz nu este responsabil pentru: daunele rezultate din tranzacțiile între utilizatori, pierderea de date din cauza defecțiunilor hardware sau software, întreruperile temporare ale serviciilor din motive tehnice, acțiunile frauduloase ale utilizatorilor sau terților sau consecințele utilizării inadecvate a platformei.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>În niciun caz răspunderea noastră totală nu va depăși valoarea taxelor plătite de utilizator pentru serviciile premium în ultimele 12 luni. Această limitare se aplică indiferent de natura reclamației: contractuală, delictuală sau din orice altă cauză legală.</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Forță majoră</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Nu suntem responsabili pentru întârzieri sau imposibilitatea de a îndeplini obligațiile din cauza evenimentelor de forță majoră: dezastre naturale, războaie, atacuri cibernetice la scară largă, reglementări guvernamentale restrictive sau alte evenimente în afara controlului nostru rezonabil.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>În astfel de situații, vom depune toate eforturile rezonabile pentru a minimiza impactul asupra utilizatorilor și pentru a restabili serviciile cât mai rapid posibil. Utilizatorii vor fi informați prompt despre orice întreruperi majore prin canalele noastre oficiale de comunicare.</ThemedText>
        </View>

        {/* Section 8 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>8. Modificări și încetarea serviciilor</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Modificări ale termenilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Ne rezervăm dreptul de a modifica acești termeni și condiții pentru a reflecta schimbările în serviciile oferite, cerințele legale sau practicile comerciale. Utilizatorii vor fi notificați cu minimum 30 de zile înainte de intrarea în vigoare a modificărilor majore prin email și notificări în platformă.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Continuarea utilizării serviciilor după intrarea în vigoare a modificărilor constituie acceptarea noilor termeni. Utilizatorii care nu sunt de acord cu modificările pot închide conturile și înceta utilizarea platformei fără penalități suplimentare.</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Suspendarea și închiderea conturilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Putem suspenda sau închide conturile care încalcă acești termeni, participă la activități frauduloase, afectează negativ experiența altor utilizatori sau prezintă riscuri de securitate pentru platformă. În funcție de gravitatea încălcării, putem aplica avertismente, restricții temporare sau închiderea definitivă.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Utilizatorii pot închide voluntar conturile oricând prin setările platformei. La închiderea contului, datele personale vor fi anonimizate sau șterse conform politicii noastre de confidențialitate, iar anunțurile active vor fi eliminate automat.</ThemedText>
        </View>

        {/* Section 9 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>9. Legea aplicabilă și jurisdicția</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Cadrul legal</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Acești termeni și condiții sunt guvernați de legea română și se interpretează conform acesteia. Toate disputele rezultate din utilizarea platformei vor fi soluționate de instanțele competente din România, utilizatorii renunțând la orice pretenție de incompetență teritorială.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Pentru utilizatorii din Uniunea Europeană, respectăm prevederile Regulamentului Digital Services Act (DSA) și ale Directivei privind Drepturile Consumatorilor. Consumatorii pot beneficia de proceduri alternative de soluționare a disputelor conform reglementărilor UE aplicabile.</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Conformitate cu reglementările</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Platforma respectă prevederile GDPR pentru protecția datelor, reglementările PSD2 pentru serviciile de plată, cerințele de e-commerce conform OUG 34/2014 și alte acte normative relevante din România și UE. Cooperăm cu autoritățile de reglementare și aplicăm prompt orice cerințe legale noi.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Pentru problemele specifice protecției consumatorilor, utilizatorii se pot adresa ANPC (Autoritatea Națională pentru Protecția Consumatorilor) sau pot folosi platforma europeană ODR pentru soluționarea online a disputelor comerciale.</ThemedText>
        </View>

        {/* Section 10 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>10. Contact și asistență</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Informații de contact</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Pentru întrebări despre acești termeni și condiții, reclamații sau solicitări de asistență, ne puteți contacta prin următoarele modalități: email oficial la <ThemedText style={styles.strong}>legal@hobbiz.ro</ThemedText>, formularul de contact din platformă sau poșta tradițională la adresa sediului social înregistrat.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Echipa noastră de asistență răspunde în general în termen de 24-48 de ore pentru întrebările standard și în maximum 72 de ore pentru problemele complexe care necesită investigații tehnice sau legale. Pentru urgențe de securitate, oferim suport accelerat prin canale prioritare.</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>Procedura de reclamații</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Reclamațiile se pot depune prin sistemul integrat din platformă, care permite urmărirea statusului și primirea de notificări automate. Pentru situații grave, acceptăm și comunicarea directă prin email la adresa dedicată <ThemedText style={styles.strong}>complaints@hobbiz.ro</ThemedText>.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>Investigăm toate reclamațiile într-un mod imparțial și transparent, respectând drepturile tuturor părților implicate. Rezultatele investigațiilor sunt comunicate în scris, iar pentru cazurile complexe oferim explicații detaliate despre măsurile luate.</ThemedText>
        </View>

        {/* Footer notice */}
        <View style={[styles.footerNotice, { backgroundColor: footerBg, borderLeftColor: WEB_PRIMARY }]}>          
          <ThemedText style={[styles.footerParagraph, { color: isDarkMode ? '#888' : '#64748b' }]}>Documentul a fost actualizat la data de 5 septembrie 2025 și intră în vigoare imediat pentru toți utilizatorii platformei Hobbiz. Pentru versiunile anterioare ale acestor termeni, vă rugăm să ne contactați la adresa legal@hobbiz.ro.</ThemedText>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 80, gap: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pageTitle: { fontSize: 22, fontWeight: '700' },

  desktopHeader: { marginTop: 40, borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  headerIcon: { fontSize: 54, marginBottom: 16, zIndex: 2 },
  headerH1: { fontSize: 40, fontWeight: '700', letterSpacing: -0.5, color: '#fff', zIndex: 2, marginBottom: 12 },
  headerDate: { fontSize: 15, color: 'rgba(255,255,255,0.9)', zIndex: 2 },
  radialOverlay: { position: 'absolute', top: -120, right: -120, width: 360, height: 360, backgroundColor: 'rgba(252,194,46,0.15)', borderRadius: 360, transform: [{ rotate: '30deg' }] },

  introCard: { borderRadius: 20, padding: 28, backgroundColor: WEB_ACCENT, shadowColor: WEB_ACCENT_GRAD_TO, shadowOpacity: 0.3, shadowRadius: 32, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  introRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  introIcon: { fontSize: 30, marginTop: 2 },
  introStrong: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 10 },
  introParagraph: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.95)' },

  sectionCard: { borderRadius: 16, padding: 28, marginTop: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 4 } },
  h2: { fontSize: 26, fontWeight: '700', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 3, borderBottomColor: WEB_ACCENT, alignSelf: 'flex-start' },
  h3: { fontSize: 18, fontWeight: '600', marginTop: 28, marginBottom: 12, paddingLeft: 20, position: 'relative' },
  paragraph: { fontSize: 14, lineHeight: 22, marginBottom: 14, textAlign: 'left' },
  strong: { fontWeight: '600' },
  footerNotice: { marginTop: 16, padding: 24, borderRadius: 16, borderLeftWidth: 4 },
  footerParagraph: { fontSize: 13, lineHeight: 20, fontStyle: 'italic', textAlign: 'center' },
});
