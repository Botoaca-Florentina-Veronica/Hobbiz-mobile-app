import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useAppTheme } from '../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '../src/services/storage';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function StarredMessagesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { tokens, isDark } = useAppTheme();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (!user?.id) return;
    try {
      const raw = await storage.getItemAsync(`starredMessages:${user.id}`);
      const list = raw ? JSON.parse(raw) : [];
      setItems(list.reverse());
    } catch (err) {
      console.error('Failed loading starred messages', err);
      Alert.alert('Eroare', 'Nu s-au putut încărca mesajele favorite.');
    }
  };

  useEffect(() => { load(); }, [user]);
  useFocusEffect(
    React.useCallback(() => {
      load();
      return () => {};
    }, [user])
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.left}>
        <Image source={{ uri: item.image || undefined }} style={styles.thumb} />
      </View>
      <View style={styles.center}>
        <Text style={styles.text} numberOfLines={2}>{item.text || (item.image ? 'Imagine' : 'Mesaj')}</Text>
        <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.action} onPress={async () => {
        // remove
        try {
          if (!user?.id) return;
          const raw = await storage.getItemAsync(`starredMessages:${user.id}`);
          const list = raw ? JSON.parse(raw) : [];
          const updated = list.filter((s: any) => String(s._id) !== String(item._id));
          await storage.setItemAsync(`starredMessages:${user.id}`, JSON.stringify(updated));
          setItems(updated.reverse());
        } catch (err) {
          console.error('Remove starred error', err);
        }
      }}>
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, backgroundColor: tokens.colors.bg }] }>
      <View style={styles.header}>
        <Text style={styles.title}>Mesaje cu stea</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#666' }}>Nu ai mesaje salvate cu stea.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  left: { marginRight: 12 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f2f2f2' },
  center: { flex: 1 },
  text: { fontSize: 15, color: '#222' },
  meta: { fontSize: 12, color: '#888', marginTop: 6 },
  action: { padding: 8 },
});
