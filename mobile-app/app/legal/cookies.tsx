import React, { useRef, useEffect } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, findNodeHandle, UIManager, Animated, Easing, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function CookiesScreen() {
  const { tokens, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<any>(null);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const secCeRef = useRef<View | null>(null);
  const secTipuriRef = useRef<View | null>(null);
  const secDeCeRef = useRef<View | null>(null);
  const secGestionareRef = useRef<View | null>(null);
  const secTertiRef = useRef<View | null>(null);
  const secConsimRef = useRef<View | null>(null);
  const secUpdatesRef = useRef<View | null>(null);
  const secContactRef = useRef<View | null>(null);

  const scrollToSection = (ref: React.RefObject<View | null>) => {
    if (!ref.current || !scrollRef.current) return;

    // Web: avoid calling findNodeHandle (not supported). Use DOM scrollIntoView when available.
    if (Platform.OS === 'web') {
      try {
        // Some RNW components expose the underlying DOM node via getNode()
        const possibleNode: any = (ref.current as any)?.getNode ? (ref.current as any).getNode() : (ref.current as any);
        if (possibleNode && typeof possibleNode.scrollIntoView === 'function') {
          possibleNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        // Fallback: try scrolling the container element
        const container: any = (scrollRef.current as any)?.getNode ? (scrollRef.current as any).getNode() : (scrollRef.current as any);
        if (container && typeof container.scrollTo === 'function' && possibleNode && possibleNode.offsetTop != null) {
          container.scrollTo({ top: Math.max(0, possibleNode.offsetTop - 12), behavior: 'smooth' });
          return;
        }
      } catch (e) {
        // ignore and fall back to native approach below if any
      }
      return;
    }

    // Native (iOS/Android): use findNodeHandle + UIManager.measureLayout to compute Y offset and animate.
    const node = findNodeHandle(ref.current);
    const scrollNode = findNodeHandle(scrollRef.current as any);
    if (!node || !scrollNode) return;
    try {
      UIManager.measureLayout(
        node,
        scrollNode,
        () => {},
        (_x, y, _w, _h) => {
          // Animate the scroll position using Animated.Value to control duration/easing
          Animated.timing(scrollAnim, {
            toValue: Math.max(0, y - 12),
            duration: 550,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start();
        }
      );
    } catch (e) {
      // ignore
    }
  };

  // Keep the Animated value driving the actual ScrollView position.
  useEffect(() => {
    const id = scrollAnim.addListener(({ value }) => {
      scrollRef.current?.scrollTo({ y: value, animated: false });
    });
    return () => {
      scrollAnim.removeListener(id);
    };
  }, [scrollAnim]);

  function CookieTag({ children }: { children: React.ReactNode }) {
    return (
      <LinearGradient colors={["#f51866", "#fa4875"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cookieTag}>
        <ThemedText style={styles.cookieTagText}>{children}</ThemedText>
      </LinearGradient>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
  <Animated.ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Politica cookie-urilor</ThemedText>
        </View>

        {/* Hero */}
        {isDark ? (
          <View style={[styles.hero, { backgroundColor: '#282828', shadowColor: '#000', shadowOpacity: 0.35 }]}> 
            <View
              style={[
                styles.heroBefore,
                { backgroundColor: 'rgba(245,24,102,0.18)' },
                Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined,
              ]}
              {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : {})}
            />
            <View style={styles.heroBadgeWrap}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(245,24,102,0.15)', borderColor: 'rgba(245,24,102,0.3)' }]}>
                <ThemedText style={styles.badgeEmoji}>🍪</ThemedText>
                <ThemedText style={[styles.heroBadgeText, { color: '#ffffff' }]}>Politica Cookie-urilor</ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.heroTitle, { color: '#ffffff' }]}>Înțelege cum folosim <ThemedText style={[styles.highlight, { color: '#fa4875' }]}>cookie-urile</ThemedText></ThemedText>
          </View>
        ) : (
          <LinearGradient
            colors={["#ffabb7", "#ff96a6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View
              style={[styles.heroBefore, Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined]}
              {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : {})}
            />
            <View style={styles.heroBadgeWrap}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(245,24,102,0.08)', borderColor: 'rgba(245,24,102,0.25)' }]}>
                <ThemedText style={styles.badgeEmoji}>🍪</ThemedText>
                <ThemedText style={[styles.heroBadgeText, { color: '#121212' }]}>Politica Cookie-urilor</ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.heroTitle, { color: '#121212' }]}>Înțelege cum folosim <ThemedText style={[styles.highlight, { color: '#fa4875' }]}>cookie-urile</ThemedText></ThemedText>
          </LinearGradient>
        )}

        {/* Content */}
        {/* Table of Contents */}
  <View style={[styles.cookieToc, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <ThemedText style={styles.tocTitle}>Cuprins</ThemedText>
          <View style={styles.tocList}>
            <TouchableOpacity onPress={() => scrollToSection(secCeRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• Ce sunt cookie-urile?</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secTipuriRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• Tipuri de cookie-uri</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secDeCeRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• De ce folosim cookie-uri?</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secGestionareRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• Cum să gestionezi cookie-urile</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secTertiRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• Cookie-uri de la terți</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secConsimRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• Consimțământul tău</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secUpdatesRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• Actualizări</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secContactRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• Contact</ThemedText></TouchableOpacity>
          </View>
        </View>

  <View ref={secCeRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: isDark ? '#ffffff' : tokens.colors.text }]}>Ce sunt cookie-urile?</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#d6d6d6' : '#575757' }]}>Cookie-urile sunt fișiere text mici care sunt plasate pe dispozitivul tău (computer, telefon mobil sau tabletă) atunci când vizitezi un site web. Acestea sunt procesate și stocate de browser-ul tău web și ne ajută să îți oferim o experiență mai bună pe site-ul nostru.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#d6d6d6' : '#575757' }]}>Cookie-urile sunt inofensive în sine și servesc funcții cruciale pentru site-uri web. Ele pot fi vizualizate și șterse cu ușurință din setările browser-ului tău.</ThemedText>
        </View>

  <View ref={secTipuriRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: 'rgb(214, 214, 214)' }]}>Tipuri de cookie-uri pe care le folosim</ThemedText>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: 'rgb(214, 214, 214)' }]}>1. Cookie-uri strict necesare</ThemedText>
            <ThemedText style={[styles.paragraph, { color: 'rgb(214, 214, 214)' }]}>Aceste cookie-uri sunt esențiale pentru funcționarea platformei Hobbiz. Ele îți permit să navighezi pe site, să te autentifici în contul tău, să publici anunțuri, să salvezi favorite și să folosești sistemul de chat. Fără aceste cookie-uri, serviciile de bază ale platformei nu ar putea funcționa.</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>Autentificare</CookieTag>
              <CookieTag>Sesiune utilizator</CookieTag>
              <CookieTag>Coș favorite</CookieTag>
              <CookieTag>Chat securizat</CookieTag>
            </View>
          </View>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: 'rgb(214, 214, 214)' }]}>2. Cookie-uri de preferințe</ThemedText>
            <ThemedText style={[styles.paragraph, { color: 'rgb(214, 214, 214)' }]}>Aceste cookie-uri îți permit să personalizezi experiența pe Hobbiz prin salvarea preferințelor tale, cum ar fi tema preferată (modul întunecat/luminos), categoriile favorite de anunțuri, regiunea ta pentru afișarea anunțurilor locale și setările de notificare.</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>Tema (light/dark)</CookieTag>
              <CookieTag>Regiunea preferată</CookieTag>
              <CookieTag>Categorii favorite</CookieTag>
              <CookieTag>Setări notificări</CookieTag>
            </View>
          </View>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: 'rgb(214, 214, 214)' }]}>3. Cookie-uri de analiză</ThemedText>
            <ThemedText style={[styles.paragraph, { color: 'rgb(214, 214, 214)' }]}>Aceste cookie-uri sunt folosite prin platforme precum Google Analytics și Umami pentru a colecta informații despre modul în care utilizezi site-ul nostru. Ele ne ajută să înțelegem care pagini sunt vizitate cel mai des și cum navighezi prin platforma Hobbiz. Datele sunt anonimizate și agregate.</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>Google Analytics</CookieTag>
              <CookieTag>Umami Analytics</CookieTag>
              <CookieTag>Statistici vizite</CookieTag>
              <CookieTag>Comportament navigare</CookieTag>
            </View>
          </View>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: 'rgb(214, 214, 214)' }]}>4. Cookie-uri de marketing</ThemedText>
            <ThemedText style={[styles.paragraph, { color: 'rgb(214, 214, 214)' }]}>Aceste cookie-uri ne ajută să îți afișăm anunțuri și recomandări relevante pe platforma Hobbiz. De exemplu, îți putem sugera anunțuri din categoriile care te interesează sau servicii similare cu cele pe care le-ai vizitat anterior. Nu împărtășim aceste informații cu terți pentru publicitate.</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>Recomandări anunțuri</CookieTag>
              <CookieTag>Categorii de interes</CookieTag>
              <CookieTag>Servicii similare</CookieTag>
              <CookieTag>Experiență personalizată</CookieTag>
            </View>
          </View>
        </View>

  <View ref={secDeCeRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>De ce folosim cookie-uri?</ThemedText>
          <View style={styles.reasonsGrid}>
            <View style={styles.reasonCard}>
              <ThemedText style={styles.reasonIcon}>🔐</ThemedText>
              <ThemedText style={[styles.reasonTitle, { color: tokens.colors.text }]}>Securitate și autentificare</ThemedText>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Pentru a-ți menține contul securizat și pentru a-ți permite să publici anunțuri și să folosești chat-ul în siguranță.</ThemedText>
            </View>
            <View style={styles.reasonCard}>
              <ThemedText style={styles.reasonIcon}>⚙️</ThemedText>
              <ThemedText style={[styles.reasonTitle, { color: tokens.colors.text }]}>Funcționalitate și îmbunătățiri</ThemedText>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Pentru a salva preferințele tale (tema, regiunea, anunțurile favorite) și pentru a îmbunătăți platforma pe baza modului în care este folosită.</ThemedText>
            </View>
            <View style={styles.reasonCard}>
              <ThemedText style={styles.reasonIcon}>🎯</ThemedText>
              <ThemedText style={[styles.reasonTitle, { color: tokens.colors.text }]}>Recomandări relevante</ThemedText>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Pentru a-ți sugera anunțuri și servicii care te-ar putea interesa pe baza categoriilor pe care le explorezi.</ThemedText>
            </View>
          </View>
        </View>

  <View ref={secGestionareRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>Cum să gestionezi cookie-urile</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Poți controla și/sau șterge cookie-urile după cum dorești. Poți șterge toate cookie-urile care sunt deja pe computerul tău și poți seta majoritatea browserelor să le împiedice să fie plasate.</ThemedText>

          <ThemedText style={[styles.h3, { color: tokens.colors.text }]}>Ghiduri pentru browsere populare:</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Chrome:</ThemedText> Setări → Confidențialitate și securitate → Cookie-uri și alte date ale site-urilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Firefox:</ThemedText> Opțiuni → Confidențialitate și securitate → Cookie-uri și date ale site-ului</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Safari:</ThemedText> Preferințe → Confidențialitate → Gestionarea datelor site-ului web</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Edge:</ThemedText> Setări → Cookie-uri și permisiuni site</ThemedText>

          <ThemedText style={[styles.h3, { color: tokens.colors.text }]}>⚠️ Notă importantă</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Dacă dezactivezi anumite cookie-uri, este posibil ca unele funcții ale platformei Hobbiz să nu funcționeze corect. De exemplu, s-ar putea să nu poți rămâne autentificat, să-ți pierzi anunțurile favorite salvate, sau să nu primești notificări noi pentru mesajele din chat.</ThemedText>
        </View>

  <View ref={secTertiRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>Cookie-uri de la terți</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Pe platforma Hobbiz folosim servicii de la terți care pot plasa propriile cookie-uri pentru a îmbunătăți experiența ta:</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Cloudinary:</ThemedText> Pentru optimizarea și livrarea rapidă a imaginilor anunțurilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Google Analytics/Umami</ThemedText> Folosite pentru a analiza traficul pe site și comportamentul utilizatorilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Google Maps:</ThemedText> Pentru afișarea locațiilor anunțurilor</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Aceste servicii au propriile politici de confidențialitate și cookie-uri pe care te încurajăm să le citești.</ThemedText>
        </View>

  <View ref={secConsimRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>Consimțământul tău</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Prin utilizarea platformei Hobbiz, îți dai consimțământul pentru utilizarea cookie-urilor conform acestei politici. Pentru funcțiile esențiale (autentificare, publicare anunțuri, chat), cookie-urile sunt necesare pentru buna funcționare a serviciului.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Poți să-ți retragi consimțământul pentru cookie-urile non-esențiale oricând prin modificarea setărilor browser-ului tău sau prin contactarea echipei Hobbiz.</ThemedText>
        </View>

  <View ref={secUpdatesRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>Actualizări ale acestei politici</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Această politică de cookie-uri poate fi actualizată periodic pentru a reflecta modificările în practicile noastre sau din motive legale și de reglementare. Te încurajăm să revizuiești această pagină din când în când.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Ultima actualizare:</ThemedText> Septembrie 2025</ThemedText>
        </View>

  <View ref={secContactRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>Contactează-ne</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Dacă ai întrebări despre această politică de cookie-uri sau despre utilizarea datelor pe platforma Hobbiz, te rugăm să ne contactezi:</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Email:</ThemedText> privacy@hobbiz.ro</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Suport:</ThemedText> prin chat-ul de pe platformă</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Adresă:</ThemedText> București, România</ThemedText>
        </View>
      
  </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },

  hero: { borderRadius: 18, paddingVertical: 28, paddingHorizontal: 18, marginBottom: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffd6db', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  heroBadgeWrap: { width: '100%', alignItems: 'center', marginBottom: 12 },
  heroBefore: { position: 'absolute', top: '-50%', right: '-50%', width: '200%', height: '200%', transform: [{ rotate: '30deg' }], backgroundColor: 'transparent' },
  badgePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: '#ffc0c8', borderWidth: 1, borderColor: '#ff9dac', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  badgeEmoji: { fontSize: 18, marginRight: 10 },
  heroBadgeText: { fontSize: 14, fontWeight: '700' },
  heroTitle: { fontSize: 34, fontWeight: '900', textAlign: 'center', lineHeight: 40 },
  highlight: { fontWeight: '900' },

  sectionCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  h2: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  h3: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  paragraph: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  strong: { fontWeight: '700', color: '#f51866' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, marginRight: 8, fontSize: 13 },

  reasonsGrid: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  reasonCard: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  reasonIcon: { fontSize: 22, marginBottom: 8 },
  reasonTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  /* TOC and content styles */
  cookieToc: { borderRadius: 14, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 20, shadowColor: '#3f3f3f', shadowOpacity: 0.08, shadowRadius: 6, elevation: 1 },
  tocTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color:'rgb(87, 87, 87)' },
  tocList: { gap: 6 },
  tocItem: { fontWeight: '600', fontSize: 15, paddingVertical: 6, color: 'rgb(87, 87, 87)'},

  cookieType: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cookieExamples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  cookieTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  cookieTagText: { color: '#ffffff', fontSize: 13, fontWeight: '500' },
});
