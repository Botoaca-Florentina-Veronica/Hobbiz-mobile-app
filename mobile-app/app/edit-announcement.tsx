import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { Toast } from '../components/ui/Toast';

interface ImageItem { id: string; uri?: string; }
interface Category { key: string; label: string; icon: string; color: string; }

const CATEGORIES: Category[] = [
  { key: 'fotografie', label: 'Fotografie', icon: 'camera-outline', color: '#FF6B6B' },
  { key: 'prajituri', label: 'Prăjituri', icon: 'ice-cream-outline', color: '#4ECDC4' },
  { key: 'muzica', label: 'Muzică', icon: 'musical-notes-outline', color: '#45B7D1' },
  { key: 'reparatii', label: 'Reparații', icon: 'construct-outline', color: '#96CEB4' },
  { key: 'dans', label: 'Dans', icon: 'woman-outline', color: '#FFEAA7' },
  { key: 'curatenie', label: 'Curățenie', icon: 'sparkles-outline', color: '#DDA0DD' },
  { key: 'gradinarit', label: 'Grădinărit', icon: 'leaf-outline', color: '#98D8C8' },
  { key: 'sport', label: 'Sport', icon: 'barbell-outline', color: '#F7DC6F' },
  { key: 'arta', label: 'Artă', icon: 'color-palette-outline', color: '#BB8FCE' },
  { key: 'tehnologie', label: 'Tehnologie', icon: 'laptop-outline', color: '#85C1E9' },
  { key: 'auto', label: 'Auto', icon: 'car-sport-outline', color: '#F8C471' },
  { key: 'meditatii', label: 'Meditații', icon: 'school-outline', color: '#82E0AA' },
];

export default function EditAnnouncementScreen() {
  const { tokens, isDark } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams();
  const announcementId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Toată țara');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const remainingTitle = 70 - title.length;
  const remainingDesc = 9000 - description.length;

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Eroare', 'Trebuie să fii autentificat pentru a edita un anunț.');
      router.replace('/login');
      return;
    }
    if (!announcementId) {
      Alert.alert('Eroare', 'ID anunț invalid.');
      router.back();
      return;
    }
    fetchAnnouncement();
  }, [announcementId, isAuthenticated]);

  const fetchAnnouncement = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/my-announcements/${announcementId}`);
      const announcement = response.data;

      setTitle(announcement.title || '');
      setCategory(announcement.category || null);
      setDescription(announcement.description || '');
      setContactName(announcement.contactPerson || '');
      setEmail(announcement.contactEmail || '');
      setPhone(announcement.contactPhone || '');
      setLocation(announcement.location || 'Toată țara');
      
      // Set existing images
      if (announcement.images && announcement.images.length > 0) {
        setExistingImages(announcement.images);
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
      Alert.alert('Eroare', 'Nu am putut încărca datele anunțului.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  async function pickImages() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisiune necesară', 'Te rog permite accesul la galerie pentru a selecta imagini.');
        return;
      }

      const result: any = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      const assets = result.assets || [];
      if (!assets || assets.length === 0) return;

      const jpgAssets = assets.filter((a: any) => {
        const uri = a.uri || a;
        if (!uri) return false;
        const low = uri.toLowerCase();
        return low.endsWith('.jpg') || low.endsWith('.jpeg') || (a.type && a.type === 'image/jpeg');
      });

      if (jpgAssets.length === 0) {
        Alert.alert('Format neacceptat', 'Te rog selectează fișiere JPG (jpeg).');
        return;
      }

      const newImages = jpgAssets.map((a: any, idx: number) => ({ 
        id: Date.now().toString() + '_' + idx, 
        uri: a.uri 
      }));
      setImages(prev => [...prev, ...newImages]);
    } catch (e) {
      console.error('pickImages error', e);
      Alert.alert('Eroare', 'Nu am putut selecta imaginile.');
    }
  }

  const removeExistingImage = (imgUrl: string) => {
    setExistingImages(prev => prev.filter(img => img !== imgUrl));
  };

  const removeNewImage = (imgId: string) => {
    setImages(prev => prev.filter(img => img.id !== imgId));
  };

  const handleSubmit = async () => {
    // Validare
    if (title.length < 16) {
      Alert.alert('Validare', 'Titlul trebuie să aibă cel puțin 16 caractere.');
      return;
    }
    if (title.length > 70) {
      Alert.alert('Validare', 'Titlul nu poate depăși 70 de caractere.');
      return;
    }
    if (!category) {
      Alert.alert('Validare', 'Trebuie să selectezi o categorie.');
      return;
    }
    if (description.length < 40) {
      Alert.alert('Validare', 'Descrierea trebuie să aibă cel puțin 40 de caractere.');
      return;
    }
    if (description.length > 9000) {
      Alert.alert('Validare', 'Descrierea nu poate depăși 9000 de caractere.');
      return;
    }
    if (!contactName.trim()) {
      Alert.alert('Validare', 'Numele persoanei de contact este obligatoriu.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      Alert.alert('Validare', 'Trebuie să completezi cel puțin email-ul sau telefonul.');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('contactPerson', contactName);
      if (email.trim()) formData.append('contactEmail', email);
      if (phone.trim()) formData.append('contactPhone', phone);

      // Append existing images that weren't removed
      formData.append('existingImages', JSON.stringify(existingImages));

      // Append new images
      images.forEach((img) => {
        if (img.uri) {
          const filename = img.uri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formData.append('images', {
            uri: img.uri,
            name: filename,
            type,
          } as any);
        }
      });

      await api.put(`/api/users/my-announcements/${announcementId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showToast('Anunțul a fost actualizat cu succes!', 'success');
      
      // Navigate back after a short delay to allow toast to be visible
      setTimeout(() => {
        router.back();
      }, 2500);
    } catch (error: any) {
      console.error('Error updating announcement:', error);
      const errorMsg = error.response?.data?.error || 'Eroare la actualizarea anunțului.';
      Alert.alert('Eroare', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getImageSrc = (img: string) => {
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    return `${base}/uploads/${img.replace(/^.*[\\/]/, '')}`;
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>
        <View style={[styles.loadingContainer]}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <ThemedText style={[styles.loadingText, { color: tokens.colors.muted }]}>
            Se încarcă datele anunțului...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const disabledPublish = title.length < 16 || description.length < 40 || !contactName || submitting;

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: tokens.colors.text }]}>Editează anunțul</ThemedText>
        </View>

        {/* Section: Descrie-ti anuntul */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>Descrie-ți anunțul cu lux de detalii!</ThemedText>
          
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Adaugă un titlu clar*</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder="ex: Predau lecții de fizică, online"
              placeholderTextColor={tokens.colors.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={70}
            />
            <View style={styles.helperRow}>
              <ThemedText style={[styles.helper, { color: tokens.colors.muted }]}>Introdu cel puțin 16 caractere</ThemedText>
              <ThemedText style={[styles.counter, { color: tokens.colors.muted }]}>{remainingTitle} caractere rămase</ThemedText>
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Categoria*</ThemedText>
            <TouchableOpacity
              style={[styles.input, styles.selectLike, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}
              activeOpacity={0.75}
              onPress={() => setCategoryModalOpen(true)}
            >
              <ThemedText style={{ color: category ? tokens.colors.text : tokens.colors.muted }}>
                {category || 'Alege categoria'}
              </ThemedText>
              <Ionicons name="chevron-down" size={18} color={tokens.colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Descriere*</ThemedText>
            <TextInput
              style={[styles.textarea, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder="Încearcă să scrii ce ai vrea tu să afli dacă te-ai uita la acest anunț"
              placeholderTextColor={tokens.colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={9000}
            />
            <View style={styles.helperRow}>
              <ThemedText style={[styles.helper, { color: tokens.colors.muted }]}>Introdu cel puțin 40 caractere</ThemedText>
              <ThemedText style={[styles.counter, { color: tokens.colors.muted }]}>{remainingDesc} caractere rămase</ThemedText>
            </View>
          </View>
        </View>

        {/* Section: Imagini */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>Imagini</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>
            Încarcă imagini relevante (format JPG). Maximum 10 imagini.
          </ThemedText>
          
          <View style={styles.imagesRow}>
            {/* Existing images */}
            {existingImages.map((imgUrl, idx) => (
              <View key={`existing-${idx}`} style={[styles.imageCard, { borderColor: tokens.colors.border }]}>
                <Image source={{ uri: getImageSrc(imgUrl) }} style={styles.imageThumb} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => removeExistingImage(imgUrl)}
                  style={styles.removeImageBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={24} color="#dc3545" />
                </TouchableOpacity>
                {idx === 0 && (
                  <View style={styles.mainImageBadge}>
                    <ThemedText style={styles.mainImageText}>Principală</ThemedText>
                  </View>
                )}
              </View>
            ))}
            
            {/* New images */}
            {images.map((img) => (
              <View key={img.id} style={[styles.imageCard, { borderColor: tokens.colors.border }]}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => removeNewImage(img.id)}
                  style={styles.removeImageBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={24} color="#dc3545" />
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add button */}
            {(existingImages.length + images.length) < 10 && (
              <TouchableOpacity
                onPress={pickImages}
                activeOpacity={0.7}
                style={[styles.addImageCard, { borderColor: tokens.colors.border, backgroundColor: tokens.colors.elev }]}
              >
                <Ionicons name="add-circle-outline" size={32} color={tokens.colors.primary} />
                <ThemedText style={[styles.addImageText, { color: tokens.colors.text }]}>Adaugă imagine</ThemedText>
                <View style={styles.addUnderline} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section: Localitate */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>Localitate*</ThemedText>
          <TouchableOpacity
            style={[styles.input, styles.selectLike, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}
            activeOpacity={0.75}
            onPress={() => setLocationModalOpen(true)}
          >
            <ThemedText style={{ color: tokens.colors.text }}>{location}</ThemedText>
            <Ionicons name="chevron-down" size={18} color={tokens.colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Section: Contact */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>Detalii de contact</ThemedText>
          
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Persoană de contact*</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder="ex: Ion Popescu"
              placeholderTextColor={tokens.colors.muted}
              value={contactName}
              onChangeText={setContactName}
            />
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Email</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder="exemplu@email.com"
              placeholderTextColor={tokens.colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Telefon</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder="07xx xxx xxx"
              placeholderTextColor={tokens.colors.muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>
            * Cel puțin unul dintre email sau telefon este obligatoriu
          </ThemedText>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtonsWrapper}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={disabledPublish}
            style={[
              styles.publishBtn,
              { backgroundColor: disabledPublish ? tokens.colors.muted : tokens.colors.primary }
            ]}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={[styles.publishText, { color: '#fff' }]}>
                Actualizează anunțul
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Category Modal */}
      {categoryModalOpen && (
        <View style={[styles.categoryOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)' }]}>          
          <View style={[styles.categorySheet, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>            
            <View style={[styles.categoryHeader, { borderColor: tokens.colors.border }]}>              
              <ThemedText style={[styles.categoryHeaderTitle, { color: tokens.colors.text }]}>Alege categoria</ThemedText>
              <TouchableOpacity onPress={() => setCategoryModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={tokens.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => { setCategory(cat.label); setCategoryModalOpen(false); }}
                  activeOpacity={0.65}
                  style={[styles.categoryRow, { borderColor: tokens.colors.border }]}
                >
                  <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + '22' }]}>                    
                    <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                  </View>
                  <ThemedText style={[styles.categoryLabel, { color: tokens.colors.text }]}>{cat.label}</ThemedText>
                  {category === cat.label && (
                    <Ionicons name="checkmark" size={18} color={tokens.colors.primary} style={{ marginLeft:'auto' }} />
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      )}

      {/* Location Modal */}
      {locationModalOpen && (
        <View style={[styles.categoryOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)' }]}>          
          <View style={[styles.categorySheet, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>            
            <View style={[styles.categoryHeader, { borderColor: tokens.colors.border }]}>              
              <ThemedText style={[styles.categoryHeaderTitle, { color: tokens.colors.text }]}>Alege localitatea</ThemedText>
              <TouchableOpacity onPress={() => setLocationModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={tokens.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
              {[
                'Toată țara', 'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brașov', 'Brăila',
                'Buzău', 'Călărași', 'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj',
                'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț', 'Olt',
                'Prahova', 'Satu Mare', 'Sălaj', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea'
              ].map(loc => (
                <TouchableOpacity
                  key={loc}
                  onPress={() => { setLocation(loc); setLocationModalOpen(false); }}
                  activeOpacity={0.65}
                  style={[styles.categoryRow, { borderColor: tokens.colors.border }]}
                >
                  <ThemedText style={[styles.categoryLabel, { color: tokens.colors.text }]}>{loc}</ThemedText>
                </TouchableOpacity>
              ))}
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      )}

      {/* Custom Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={4000}
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 24, gap: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: '600' },
  card: { borderRadius: 16, padding: 20, gap: 20, borderWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  fieldBlock: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: 15 },
  textarea: { borderWidth: 1, borderRadius: 14, padding: 18, minHeight: 140, textAlignVertical: 'top', fontSize: 15 },
  helperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  helper: { fontSize: 12, fontWeight: '500' },
  counter: { fontSize: 12 },
  selectLike: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paragraph: { fontSize: 13, lineHeight: 18 },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  addImageCard: { width: 120, height: 120, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8 },
  addImageText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  addUnderline: { height: 2, width: 38, backgroundColor: '#e0b400' },
  imageCard: { width: 120, height: 120, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  imageThumb: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 2 },
  mainImageBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: '#388e3c', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  mainImageText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  bottomButtonsWrapper: { flexDirection: 'row', gap: 12, marginTop: 8 },
  publishBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  publishText: { fontSize: 15, fontWeight: '600' },
  categoryOverlay: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  categorySheet: { maxHeight: '75%', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, overflow: 'hidden' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  categoryHeaderTitle: { fontSize: 16, fontWeight: '600' },
  closeBtn: { padding: 6, borderRadius: 8 },
  categoryList: {},
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  categoryIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 15, fontWeight: '500' },
});
