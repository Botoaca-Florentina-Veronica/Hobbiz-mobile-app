import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Linking } from 'react-native';
import { ThemedText } from './themed-text';
import { useAppTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';
import storage from '../src/services/storage';
import { useLocale } from '../src/context/LocaleContext';

interface LegalLink {
  label: string;
  url: string;
}

interface LegalSection {
  title: string;
  links: LegalLink[];
}

// Move labels into the component so they can depend on locale

export default function LegalFooter({ hideLegalSection }: { hideLegalSection?: boolean }) {
  const { tokens } = useAppTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { locale } = useLocale();

  const legalSections: LegalSection[] = [
    {
      title: locale === 'en' ? 'Legal' : 'Legal',
      links: [
        { label: locale === 'en' ? 'Terms and Conditions' : 'Termeni și condiții', url: '/termeni' },
        { label: locale === 'en' ? 'Privacy Policy' : 'Politică de Confidențialitate', url: '/confidentialitate' },
        { label: locale === 'en' ? 'Cookie Policy' : 'Cookie Policy', url: '/cookie' },
        { label: locale === 'en' ? 'Data Deletion' : 'Ștergerea Datelor', url: '/data-deletion' },
      ],
    },
  ];

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
    if (url === '/data-deletion') {
      router.push('/legal/data-deletion' as any);
      return;
    }
    if (url.startsWith('/')) {
      console.log('Internal route not yet implemented:', url);
      return;
    }
    Linking.openURL(url).catch(() => console.warn('Cannot open URL: ', url));
  };

  const sectionsToRender = legalSections.filter((s) => !(hideLegalSection && s.title === 'Legal'));

  // Dacă toate secțiunile sunt ascunse (ex: pe pagina "Explorează"), nu randăm nimic
  if (sectionsToRender.length === 0) {
    return null;
  }

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
            <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>
              {section.title}
            </ThemedText>
            <View style={styles.linksList}>
              {section.links.map((link, linkIndex) => (
                <TouchableOpacity
                  key={linkIndex}
                  onPress={() => handleLinkPress(link.url)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.linkText, { color: tokens.colors.muted }]}>
                    {link.label}
                  </ThemedText>
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
    fontFamily: 'Poppins-Bold',
  },
  linksList: {
    gap: 6,
  },
  linkText: {
    fontSize: 17.92, // 1.12rem ≈ 17.92px
    marginBottom: 6,
    fontFamily: 'Poppins-Regular',
  },
});