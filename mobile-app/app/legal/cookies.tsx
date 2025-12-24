import React, { useRef, useEffect } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, findNodeHandle, UIManager, Animated, Easing, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import storage from '@/src/services/storage';
import { useLocale } from '@/src/context/LocaleContext';

const TRANSLATIONS = {
  ro: {
    title: 'Politica cookie-urilor',
    heroBadge: 'Politica Cookie-urilor',
    heroTitle: 'Înțelege cum folosim',
    heroHighlight: 'cookie-urile',
    tocTitle: 'Cuprins',
    tocItems: [
      'Ce sunt cookie-urile?',
      'Tipuri de cookie-uri',
      'De ce folosim cookie-uri?',
      'Cum să gestionezi cookie-urile',
      'Cookie-uri de la terți',
      'Consimțământul tău',
      'Actualizări',
      'Contact',
    ],
    sec1Title: 'Ce sunt cookie-urile?',
    sec1P1: 'Cookie-urile sunt fișiere text mici care sunt plasate pe dispozitivul tău (computer, telefon mobil sau tabletă) atunci când vizitezi un site web. Acestea sunt procesate și stocate de browser-ul tău web și ne ajută să îți oferim o experiență mai bună pe site-ul nostru.',
    sec1P2: 'Cookie-urile sunt inofensive în sine și servesc funcții cruciale pentru site-uri web. Ele pot fi vizualizate și șterse cu ușurință din setările browser-ului tău.',
    sec2Title: 'Tipuri de cookie-uri pe care le folosim',
    sec2Type1: '1. Cookie-uri strict necesare',
    sec2Type1Desc: 'Aceste cookie-uri sunt esențiale pentru funcționarea platformei Hobbiz. Ele îți permit să navighezi pe site, să te autentifici în contul tău, să publici anunțuri, să salvezi favorite și să folosești sistemul de chat. Fără aceste cookie-uri, serviciile de bază ale platformei nu ar putea funcționa.',
    sec2Tags1: ['Autentificare', 'Sesiune utilizator', 'Coș favorite', 'Chat securizat'],
    sec2Type2: '2. Cookie-uri de preferințe',
    sec2Type2Desc: 'Aceste cookie-uri îți permit să personalizezi experiența pe Hobbiz prin salvarea preferințelor tale, cum ar fi tema preferată (modul întunecat/luminos), categoriile favorite de anunțuri, regiunea ta pentru afișarea anunțurilor locale și setările de notificare.',
    sec2Tags2: ['Tema (light/dark)', 'Regiunea preferată', 'Categorii favorite', 'Setări notificări'],
    sec2Type3: '3. Cookie-uri de analiză',
    sec2Type3Desc: 'Aceste cookie-uri sunt folosite prin platforme precum Google Analytics și Umami pentru a colecta informații despre modul în care folosești site-ul nostru. Ele ne ajută să înțelegem care pagini sunt vizitate cel mai des și cum navighezi prin platforma Hobbiz. Datele sunt anonimizate și agregate.',
    sec2Tags3: ['Google Analytics', 'Umami Analytics', 'Statistici vizite', 'Comportament navigare'],
    sec2Type4: '4. Cookie-uri de personalizare',
    sec2Type4Desc: 'Aceste cookie-uri ne ajută să îți afișăm recomandări relevante pe platforma Hobbiz. De exemplu, îți putem sugera anunțuri din categoriile care te interesează sau servicii similare cu cele pe care le-ai vizitat anterior. Nu vindem sau partajăm aceste informații cu terți.',
    sec2Tags4: ['Recomandări anunțuri', 'Categorii de interes', 'Servicii similare', 'Experiență personalizată'],
    sec3Title: 'De ce folosim cookie-uri?',
    sec3Reason1Title: 'Securitate și autentificare',
    sec3Reason1Desc: 'Pentru a-ți menține contul securizat și pentru a-ți permite să publici anunțuri și să folosești chat-ul în siguranță.',
    sec3Reason2Title: 'Funcționalitate și îmbunătățiri',
    sec3Reason2Desc: 'Pentru a salva preferințele tale (tema, regiunea, anunțurile favorite) și pentru a îmbunătăți platforma pe baza modului în care este folosită.',
    sec3Reason3Title: 'Recomandări relevante',
    sec3Reason3Desc: 'Pentru a-ți sugera anunțuri și servicii care te-ar putea interesa pe baza categoriilor pe care le explorezi.',
    sec4Title: 'Cum să gestionezi cookie-urile',
    sec4P1: 'Poți controla și/sau șterge cookie-urile după cum dorești. Poți șterge toate cookie-urile care sunt deja pe computerul tău și poți seta majoritatea browserelor să le împiedice să fie plasate.',
    sec4GuidesTitle: 'Ghiduri pentru browsere populare:',
    sec4Chrome: 'Setări → Confidențialitate și securitate → Cookie-uri și alte date ale site-urilor',
    sec4Firefox: 'Opțiuni → Confidențialitate și securitate → Cookie-uri și date ale site-ului',
    sec4Safari: 'Preferințe → Confidențialitate → Gestionarea datelor site-ului web',
    sec4Edge: 'Setări → Cookie-uri și permisiuni site',
    sec4NoteTitle: '⚠️ Notă importantă',
    sec4Note: 'Dacă dezactivezi anumite cookie-uri, este posibil ca unele funcții ale platformei Hobbiz să nu funcționeze corect. De exemplu, s-ar putea să nu poți rămâne autentificat, să-ți pierzi anunțurile favorite salvate, sau să nu primești notificări noi pentru mesajele din chat.',
    sec5Title: 'Cookie-uri de la terți',
    sec5P1: 'Pe platforma Hobbiz folosim servicii de la terți care pot plasa propriile cookie-uri pentru a îmbunătăți experiența ta:',
    sec5Cloudinary: 'Pentru optimizarea și livrarea rapidă a imaginilor anunțurilor',
    sec5Analytics: 'Folosite pentru a analiza traficul pe site și comportamentul utilizatorilor',
    sec5Maps: 'Pentru afișarea locațiilor anunțurilor',
    sec5P2: 'Aceste servicii au propriile politici de confidențialitate și cookie-uri pe care te încurajăm să le citești.',
    sec6Title: 'Consimțământul tău',
    sec6P1: 'Prin utilizarea platformei Hobbiz, îți dai consimțământul pentru utilizarea cookie-urilor conform acestei politici. Pentru funcțiile esențiale (autentificare, publicare anunțuri, chat), cookie-urile sunt necesare pentru buna funcționare a serviciului.',
    sec6P2: 'Poți să-ți retragi consimțământul pentru cookie-urile non-esențiale oricând prin modificarea setărilor browser-ului tău sau prin contactarea administratorului platformei. Pentru a renunța la Google Analytics, dezactivați analiza din setările aplicației sau contactați team.hobbiz@gmail.com. Pentru a opri notificările push, dezactivați-le în setările dispozitivului sau în setările aplicației. Platformă este gratuită și operată de o persoană fizică - nu vindem datele tale către terți.',
    sec7Title: 'Actualizări ale acestei politici',
    sec7P1: 'Această politică de cookie-uri poate fi actualizată periodic pentru a reflecta modificările în practicile noastre sau din motive legale și de reglementare. Te încurajăm să revizuiești această pagină din când în când.',
    sec7Updated: 'Ultima actualizare:',
    sec7Date: '13 Decembrie 2025',
    sec8Title: 'Contactează-ne',
    sec8P1: 'Dacă ai întrebări despre această politică de cookie-uri sau despre utilizarea datelor pe platforma Hobbiz, te rugăm să ne contactezi:',
    sec8Email: 'Email:',
    sec8EmailValue: 'team.hobbiz@gmail.com',
    sec8Support: 'Suport:',
    sec8SupportValue: 'prin chat-ul de pe platformă',
    sec8Address: 'Adresă:',
    sec8AddressValue: 'București, România',
  },
  en: {
    title: 'Cookie Policy',
    heroBadge: 'Cookie Policy',
    heroTitle: 'Understand how we use',
    heroHighlight: 'cookies',
    tocTitle: 'Table of Contents',
    tocItems: [
      'What are cookies?',
      'Types of cookies',
      'Why do we use cookies?',
      'How to manage cookies',
      'Third-party cookies',
      'Your consent',
      'Updates',
      'Contact',
    ],
    sec1Title: 'What are cookies?',
    sec1P1: 'Cookies are small text files that are placed on your device (computer, mobile phone, or tablet) when you visit a website. They are processed and stored by your web browser and help us provide you with a better experience on our site.',
    sec1P2: 'Cookies are harmless in themselves and serve crucial functions for websites. They can be easily viewed and deleted from your browser settings.',
    sec2Title: 'Types of cookies we use',
    sec2Type1: '1. Strictly necessary cookies',
    sec2Type1Desc: 'These cookies are essential for the operation of the Hobbiz platform. They allow you to navigate the site, log into your account, post announcements, save favorites, and use the chat system. Without these cookies, the basic services of the platform would not work.',
    sec2Tags1: ['Authentication', 'User session', 'Favorites cart', 'Secure chat'],
    sec2Type2: '2. Preference cookies',
    sec2Type2Desc: 'These cookies allow you to personalize your experience on Hobbiz by saving your preferences, such as your preferred theme (dark/light mode), favorite announcement categories, your region for displaying local announcements, and notification settings.',
    sec2Tags2: ['Theme (light/dark)', 'Preferred region', 'Favorite categories', 'Notification settings'],
    sec2Type3: '3. Analytics cookies',
    sec2Type3Desc: 'These cookies are used through platforms like Google Analytics and Umami to collect information about how you use our site. They help us understand which pages are visited most often and how you navigate through the Hobbiz platform. The data is anonymized and aggregated.',
    sec2Tags3: ['Google Analytics', 'Umami Analytics', 'Visit statistics', 'Browsing behavior'],
    sec2Type4: '4. Personalization cookies',
    sec2Type4Desc: 'These cookies help us show you relevant recommendations on the Hobbiz platform. For example, we can suggest announcements from categories that interest you or services similar to those you have previously visited. We do not sell or share this information with third parties.',
    sec2Tags4: ['Announcement recommendations', 'Categories of interest', 'Similar services', 'Personalized experience'],
    sec3Title: 'Why do we use cookies?',
    sec3Reason1Title: 'Security and authentication',
    sec3Reason1Desc: 'To keep your account secure and allow you to post announcements and use chat safely.',
    sec3Reason2Title: 'Functionality and improvements',
    sec3Reason2Desc: 'To save your preferences (theme, region, favorite announcements) and improve the platform based on how it is used.',
    sec3Reason3Title: 'Relevant recommendations',
    sec3Reason3Desc: 'To suggest announcements and services that might interest you based on the categories you explore.',
    sec4Title: 'How to manage cookies',
    sec4P1: 'You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and set most browsers to prevent them from being placed.',
    sec4GuidesTitle: 'Guides for popular browsers:',
    sec4Chrome: 'Settings → Privacy and security → Cookies and other site data',
    sec4Firefox: 'Options → Privacy and security → Cookies and site data',
    sec4Safari: 'Preferences → Privacy → Manage website data',
    sec4Edge: 'Settings → Cookies and site permissions',
    sec4NoteTitle: '⚠️ Important note',
    sec4Note: 'If you disable certain cookies, some features of the Hobbiz platform may not work properly. For example, you may not be able to stay logged in, lose saved favorite announcements, or not receive new notifications for chat messages.',
    sec5Title: 'Third-party cookies',
    sec5P1: 'On the Hobbiz platform, we use third-party services that may place their own cookies to improve your experience:',
    sec5Cloudinary: 'For optimizing and fast delivery of announcement images',
    sec5Analytics: 'Used to analyze site traffic and user behavior',
    sec5Maps: 'For displaying announcement locations',
    sec5P2: 'These services have their own privacy and cookie policies that we encourage you to read.',
    sec6Title: 'Your consent',
    sec6P1: 'By using the Hobbiz platform, you consent to the use of cookies in accordance with this policy. For essential functions (authentication, posting announcements, chat), cookies are necessary for the proper functioning of the service.',
    sec6P2: 'You can withdraw your consent for non-essential cookies at any time by changing your browser settings or contacting the platform administrator. To opt out of Google Analytics, disable analytics in the app settings or contact team.hobbiz@gmail.com. To stop push notifications, disable them in your device settings or in-app Notifications settings. This platform is free and operated by an individual - we do not sell your data to third parties.',
    sec7Title: 'Updates to this policy',
    sec7P1: 'This cookie policy may be updated periodically to reflect changes in our practices or for legal and regulatory reasons. We encourage you to review this page from time to time.',
    sec7Updated: 'Last updated:',
    sec7Date: 'December 13, 2025',
    sec8Title: 'Contact us',
    sec8P1: 'If you have questions about this cookie policy or about data usage on the Hobbiz platform, please contact us:',
    sec8Email: 'Email:',
    sec8EmailValue: 'team.hobbiz@gmail.com',
    sec8Support: 'Support:',
    sec8SupportValue: 'through the platform chat',
    sec8Address: 'Address:',
    sec8AddressValue: 'Bucharest, Romania',
  },
};

export default function CookiesScreen() {
  const { tokens, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { locale } = useLocale();
  const scrollRef = useRef<any>(null);
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const t = TRANSLATIONS[locale === 'en' ? 'en' : 'ro'];

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
  <Animated.ScrollView ref={scrollRef} style={Platform.OS === 'web' ? { height: '100vh' as any } : { flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{t.title}</ThemedText>
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
                <ThemedText style={[styles.heroBadgeText, { color: '#ffffff' }]}>{t.heroBadge}</ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.heroTitle, { color: '#ffffff' }]}>{t.heroTitle} <ThemedText style={[styles.highlight, { color: '#fa4875' }]}>{t.heroHighlight}</ThemedText></ThemedText>
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
                <ThemedText style={[styles.heroBadgeText, { color: '#121212' }]}>{t.heroBadge}</ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.heroTitle, { color: '#121212' }]}>{t.heroTitle} <ThemedText style={[styles.highlight, { color: '#fa4875' }]}>{t.heroHighlight}</ThemedText></ThemedText>
          </LinearGradient>
        )}

        {/* Content */}
        {/* Table of Contents */}
  <View style={[styles.cookieToc, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <ThemedText style={styles.tocTitle}>{t.tocTitle}</ThemedText>
          <View style={styles.tocList}>
            <TouchableOpacity onPress={() => scrollToSection(secCeRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[0]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secTipuriRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[1]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secDeCeRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[2]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secGestionareRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[3]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secTertiRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[4]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secConsimRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[5]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secUpdatesRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[6]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secContactRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[7]}</ThemedText></TouchableOpacity>
          </View>
        </View>

  <View ref={secCeRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: isDark ? '#ffffff' : tokens.colors.text }]}>{t.sec1Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#d6d6d6' : '#575757' }]}>{t.sec1P1}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#d6d6d6' : '#575757' }]}>{t.sec1P2}</ThemedText>
        </View>

  <View ref={secTipuriRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: 'rgb(214, 214, 214)' }]}>{t.sec2Title}</ThemedText>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: 'rgb(214, 214, 214)' }]}>{t.sec2Type1}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: 'rgb(214, 214, 214)' }]}>{t.sec2Type1Desc}</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>{t.sec2Tags1[0]}</CookieTag>
              <CookieTag>{t.sec2Tags1[1]}</CookieTag>
              <CookieTag>{t.sec2Tags1[2]}</CookieTag>
              <CookieTag>{t.sec2Tags1[3]}</CookieTag>
            </View>
          </View>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: 'rgb(214, 214, 214)' }]}>{t.sec2Type2}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: 'rgb(214, 214, 214)' }]}>{t.sec2Type2Desc}</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>{t.sec2Tags2[0]}</CookieTag>
              <CookieTag>{t.sec2Tags2[1]}</CookieTag>
              <CookieTag>{t.sec2Tags2[2]}</CookieTag>
              <CookieTag>{t.sec2Tags2[3]}</CookieTag>
            </View>
          </View>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: 'rgb(214, 214, 214)' }]}>{t.sec2Type3}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: 'rgb(214, 214, 214)' }]}>{t.sec2Type3Desc}</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>{t.sec2Tags3[0]}</CookieTag>
              <CookieTag>{t.sec2Tags3[1]}</CookieTag>
              <CookieTag>{t.sec2Tags3[2]}</CookieTag>
              <CookieTag>{t.sec2Tags3[3]}</CookieTag>
            </View>
          </View>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: 'rgb(214, 214, 214)' }]}>{t.sec2Type4}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: 'rgb(214, 214, 214)' }]}>{t.sec2Type4Desc}</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>{t.sec2Tags4[0]}</CookieTag>
              <CookieTag>{t.sec2Tags4[1]}</CookieTag>
              <CookieTag>{t.sec2Tags4[2]}</CookieTag>
              <CookieTag>{t.sec2Tags4[3]}</CookieTag>
            </View>
          </View>
        </View>

  <View ref={secDeCeRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec3Title}</ThemedText>
          <View style={styles.reasonsGrid}>
            <View style={styles.reasonCard}>
              <ThemedText style={styles.reasonIcon}>🔐</ThemedText>
              <ThemedText style={[styles.reasonTitle, { color: tokens.colors.text }]}>{t.sec3Reason1Title}</ThemedText>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec3Reason1Desc}</ThemedText>
            </View>
            <View style={styles.reasonCard}>
              <ThemedText style={styles.reasonIcon}>⚙️</ThemedText>
              <ThemedText style={[styles.reasonTitle, { color: tokens.colors.text }]}>{t.sec3Reason2Title}</ThemedText>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec3Reason2Desc}</ThemedText>
            </View>
            <View style={styles.reasonCard}>
              <ThemedText style={styles.reasonIcon}>🎯</ThemedText>
              <ThemedText style={[styles.reasonTitle, { color: tokens.colors.text }]}>{t.sec3Reason3Title}</ThemedText>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec3Reason3Desc}</ThemedText>
            </View>
          </View>
        </View>

  <View ref={secGestionareRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec4Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec4P1}</ThemedText>

          <ThemedText style={[styles.h3, { color: tokens.colors.text }]}>{t.sec4GuidesTitle}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Chrome:</ThemedText> {t.sec4Chrome}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Firefox:</ThemedText> {t.sec4Firefox}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Safari:</ThemedText> {t.sec4Safari}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Edge:</ThemedText> {t.sec4Edge}</ThemedText>

          <ThemedText style={[styles.h3, { color: tokens.colors.text }]}>{t.sec4NoteTitle}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec4Note}</ThemedText>
        </View>

  <View ref={secTertiRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec5Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec5P1}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Cloudinary:</ThemedText> {t.sec5Cloudinary}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Firebase (FCM):</ThemedText> Push notifications (push tokens) and related services used to deliver in-app notifications.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Google Analytics/Umami</ThemedText> {t.sec5Analytics}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Google Maps:</ThemedText> {t.sec5Maps}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec5P2}</ThemedText>
        </View>

  <View ref={secConsimRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec6Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec6P1}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec6P2}</ThemedText>
        </View>

  <View ref={secUpdatesRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec7Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec7P1}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>{t.sec7Updated}</ThemedText> {t.sec7Date}</ThemedText>
        </View>

  <View ref={secContactRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec8Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec8P1}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>{t.sec8Email}</ThemedText> {t.sec8EmailValue}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>{t.sec8Support}</ThemedText> {t.sec8SupportValue}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>{t.sec8Address}</ThemedText> {t.sec8AddressValue}</ThemedText>
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