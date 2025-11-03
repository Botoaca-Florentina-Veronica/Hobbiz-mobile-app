import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LegalMenu() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = [
    { key: 'terms', label: 'Termeni și condiții', route: '/legal/terms', icon: 'document-text-outline' },
    { key: 'cookies', label: 'Cookie policy', route: '/legal/cookies', icon: 'logo-chrome' },
    { key: 'privacy', label: 'Politica de confidențialitate', route: '/legal/privacy', icon: 'shield-checkmark-outline' },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Informații legale</ThemedText>
        </View>

        <View style={styles.group}>
          {items.map((it) => (
            <TouchableOpacity
              key={it.key}
              activeOpacity={0.75}
              style={[styles.row, { backgroundColor: tokens.colors.surface }]}
              onPress={() => router.push(it.route as any)}
            >
              <View style={styles.rowLeft}>
                <Ionicons name={it.icon as any} size={18} color={tokens.colors.primary} style={styles.rowIcon} />
                <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{it.label}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={tokens.colors.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  group: { marginTop: 12, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {},
  rowLabel: { fontSize: 15, fontWeight: '600' },
});
