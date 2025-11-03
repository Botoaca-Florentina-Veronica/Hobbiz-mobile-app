import React from 'react';
import { StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/ThemeContext';

// Simple layout wrapper for /legal pages. Exports a default React component.
export default function LegalLayout() {
	const { tokens } = useAppTheme();
	const insets = useSafeAreaInsets();
	return (
		<ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>
			<Slot />
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
			flex: 1,
			padding: 0,
	},
});
