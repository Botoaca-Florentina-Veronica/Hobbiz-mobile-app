import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Linking } from 'react-native';
import { useAppTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';

interface LegalLink {
  label: string;
  url: string;
}

interface LegalSection {
  title: string;
  links: LegalLink[];
}

const legalSections: LegalSection[] = [
  {
    title: 'Legal',
    links: [
      { label: 'Termeni și condiții', url: '/termeni' },
      { label: 'Politică de Confidențialitate', url: '/confidentialitate' },
      { label: 'Cookie Policy', url: '/cookie' },
    ],
  },
];

export default function LegalFooter({ hideLegalSection }: { hideLegalSection?: boolean }) {
  const { tokens } = useAppTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();

  // Breakpoint pentru tablete și dispozitive mari (similar cu media query 900px)
  const isTabletOrLarger = width >= 768;

  const handleLinkPress = (url: string) => {
    if (url === '/about') {
      router.push('/about');
      return;
    }
    if (url === '/termeni') {
      // the mobile route is /legal
      router.push('/legal');
      return;
    }
    if (url.startsWith('/')) {
      console.log('Internal route not yet implemented:', url);
      return;
    }
    Linking.openURL(url).catch(() => console.warn('Cannot open URL: ', url));
  };

  const sectionsToRender = legalSections.filter((s) => !(hideLegalSection && s.title === 'Legal'));

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
      <View style={[styles.sectionsWrapper, isTabletOrLarger && styles.sectionsRow]}>
        {sectionsToRender.map((section, sectionIndex) => (
          <View 
            key={sectionIndex} 
            style={[
              styles.section,
              isTabletOrLarger && styles.sectionTablet,
              !isTabletOrLarger && sectionIndex > 0 && styles.sectionSpacing,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
              {section.title}
            </Text>
            <View style={styles.linksList}>
              {section.links.map((link, linkIndex) => (
                <TouchableOpacity
                  key={linkIndex}
                  onPress={() => handleLinkPress(link.url)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.linkText, { color: tokens.colors.muted }]}>
                    {link.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 0,
    paddingRight: 12,
    paddingBottom: 76,
    paddingLeft: 20,
  },
  sectionsWrapper: {
    flexDirection: 'column',
  },
  sectionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 60,
    flexWrap: 'wrap',
  },
  section: {
    marginBottom: 8,
  },
  sectionTablet: {
    flex: 1,
    minWidth: 250,
    marginBottom: 0,
  },
  sectionSpacing: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 42,
    marginBottom: 6,
  },
  linksList: {
    gap: 6,
  },
  linkText: {
    fontSize: 17.92, // 1.12rem ≈ 17.92px
    marginBottom: 6,
  },
});
