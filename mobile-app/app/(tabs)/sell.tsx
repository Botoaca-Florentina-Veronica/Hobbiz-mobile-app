import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { localitatiPeJudet } from '../../assets/comunePeJudet';

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

// Map category keys to the same images used in the Explore page
const CATEGORY_IMAGES: Record<string, any> = {
  fotografie: require('../../assets/images/camera.png'),
  prajituri: require('../../assets/images/bake.png'),
  muzica: require('../../assets/images/guitar.png'),
  reparatii: require('../../assets/images/pipe.png'),
  dans: require('../../assets/images/salsa.png'),
  curatenie: require('../../assets/images/cleaning.png'),
  gradinarit: require('../../assets/images/gardening-logo.jpg'),
  sport: require('../../assets/images/tennis.png'),
  arta: require('../../assets/images/arta.png'),
  tehnologie: require('../../assets/images/laptop.png'),
  auto: require('../../assets/images/car.png'),
  meditatii: require('../../assets/images/carte.png'),
};

export default function SellScreen() {
  const { tokens, isDark } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Toată țara');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [countyExpanded, setCountyExpanded] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const remainingTitle = 70 - title.length;
  const remainingDesc = 9000 - description.length;

  const addImagePlaceholder = () => {
    pickImages();
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

      // Newer API returns { canceled, assets: [{uri, ...}] }
      if (result.canceled) return;

      const assets = result.assets || (result.selected ? result.selected : []);
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

      const newImages = jpgAssets.map((a: any, idx: number) => ({ id: Date.now().toString() + '_' + idx, uri: a.uri }));
      setImages(prev => [...prev, ...newImages]);
    } catch (e) {
      console.error('pickImages error', e);
      Alert.alert('Eroare', 'Nu am putut selecta imaginile.');
    }
  }

  const disabledPublish = title.length < 16 || description.length < 40 || !contactName || submitting;

  

  const handleSubmit = async () => {
    // Validations (mirror edit flow)
    if (!isAuthenticated) {
      Alert.alert('Eroare', 'Trebuie să fii autentificat pentru a publica un anunț.');
      return;
    }
    if (title.length < 16) {
      Alert.alert('Validare', 'Titlul trebuie să aibă cel puțin 16 caractere.');
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
      formData.append('category', category || '');
      formData.append('description', description);
      formData.append('location', location);
      formData.append('contactPerson', contactName);
      if (email.trim()) formData.append('contactEmail', email);
      if (phone.trim()) formData.append('contactPhone', phone);

      images.forEach((img) => {
        if (img.uri) {
          const filename = img.uri.split('/').pop() || `image_${Date.now()}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          // For React Native / Expo, pass an object with uri, name, type
          formData.append('images', {
            uri: img.uri,
            name: filename,
            type,
          } as any);
        }
      });

      await api.post('/api/users/my-announcements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const submittedTitle = title.trim();
      // clear the form so the Sell page doesn't keep the submitted data
      const resetForm = () => {
        setTitle('');
        setCategory(null);
        setDescription('');
        setContactName('');
        setEmail('');
        setPhone('');
        setLocation('Toată țara');
        setImages([]);
        setCategoryModalOpen(false);
        setLocationModalOpen(false);
        setCountyExpanded(null);
      };

      resetForm();
  router.replace({ pathname: '/post-success', params: { title: submittedTitle } });
    } catch (error: any) {
      console.error('Error publishing announcement:', error);
      const errMsg = error?.response?.data?.error || 'Eroare la publicarea anunțului. Încearcă din nou.';
      Alert.alert('Eroare', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

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
          <ThemedText style={[styles.headerTitle, { color: tokens.colors.text }]}>Publică un anunț</ThemedText>
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
              <ThemedText style={[styles.helper, { color: tokens.colors.primary }]}>Introdu cel puțin 16 caractere</ThemedText>
              <ThemedText style={[styles.counter, { color: tokens.colors.muted }]}>{title.length}/70</ThemedText>
            </View>
          </View>
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Categoria*</ThemedText>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => setCategoryModalOpen(true)}
              style={[styles.input, styles.selectLike, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}
            >
              <ThemedText style={{ color: category ? tokens.colors.text : tokens.colors.muted }}>{category || 'Alege categoria'}</ThemedText>
              <Ionicons name="chevron-down" size={18} color={tokens.colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Imagini */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>Imagini</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>Poți adăuga mai multe imagini. Prima va fi imaginea principală a anunțului tău.</ThemedText>
          <View style={styles.imagesRow}>
            <TouchableOpacity onPress={addImagePlaceholder} activeOpacity={0.8} style={[styles.addImageCard, { backgroundColor: isDark ? tokens.colors.elev : '#fff8ea', borderColor: isDark ? tokens.colors.border : '#ffe7b3' }]}>              
              <ThemedText style={[styles.addImageText, { color: tokens.colors.text }]}>Adaugă imagini</ThemedText>
              <View style={[styles.addUnderline, { backgroundColor: isDark ? tokens.colors.primary : '#e0b400' }]} />
            </TouchableOpacity>
            {images.map(img => (
              <View key={img.id} style={[styles.imageCard, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}> 
                {img.uri ? (
                  <Image source={{ uri: img.uri }} style={styles.imageThumb} resizeMode="cover" />
                ) : (
                  <Ionicons name="camera" size={28} color={tokens.colors.text} />
                )}
              </View>
            ))}
            {/* Placeholder extra slot */}
            <View style={[styles.imageCard, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}>              
              <Ionicons name="camera" size={28} color={tokens.colors.text} />
            </View>
          </View>
        </View>

        {/* Section: Descriere mare */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.label, styles.blockLabel, { color: tokens.colors.text }]}>Descriere*</ThemedText>
          <TextInput
            style={[styles.textarea, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
            placeholder="Încearcă să scrii ce ai vrea tu să afli dacă te-ai uita la acest anunț"
            placeholderTextColor={tokens.colors.muted}
            multiline
            value={description}
            maxLength={9000}
            onChangeText={setDescription}
          />
          <View style={styles.helperRow}>
            <ThemedText style={[styles.helper, { color: tokens.colors.primary }]}>Introdu cel puțin 40 caractere</ThemedText>
            <ThemedText style={[styles.counter, { color: tokens.colors.muted }]}>{description.length}/9000</ThemedText>
          </View>
        </View>

        {/* Section: Localitate */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.label, styles.blockLabel, { color: tokens.colors.text }]}>Localitate*</ThemedText>
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => setLocationModalOpen(true)}
            style={[styles.input, styles.selectLike, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}
          >
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <Ionicons name="location-outline" size={18} color={tokens.colors.muted} />
              <ThemedText style={{ color: tokens.colors.text }}>{location}</ThemedText>
            </View>
            <Ionicons name="chevron-down" size={18} color={tokens.colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Section: Informații de contact */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>Informații de contact</ThemedText>
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Persoana de contact*</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder="Nume și prenume"
              placeholderTextColor={tokens.colors.muted}
              value={contactName}
              onChangeText={setContactName}
            />
          </View>
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Adresa de email</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder="ex: exemplu@gmail.com"
              placeholderTextColor={tokens.colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Numărul de telefon</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder="ex: 07xxxxxxx"
              placeholderTextColor={tokens.colors.muted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        {/* Bottom buttons */}
        <View style={styles.bottomButtonsWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.previewBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
          >            
            <ThemedText style={[styles.previewText, { color: tokens.colors.primary }]}>Previzualizați anunțul</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={disabledPublish}
            onPress={handleSubmit}
            style={[
              styles.publishBtn,
              {
                backgroundColor: isDark ? '#f51866' : (disabledPublish ? tokens.colors.muted : tokens.colors.primary),
                opacity: isDark && disabledPublish ? 0.6 : 1,
                borderColor: isDark ? '#f51866' : tokens.colors.border,
                // remove shadow/elevation in dark mode so the color isn't visually darkened
                shadowOpacity: isDark ? 0 : undefined,
                elevation: isDark ? 0 : undefined,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={isDark ? '#ffffff' : tokens.colors.primaryContrast} />
            ) : (
              <ThemedText style={[styles.publishText, { color: isDark ? '#ffffff' : tokens.colors.primaryContrast }]}>Publică un anunț</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
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
                  <View style={[styles.categoryIconWrap]}>                    
                    {CATEGORY_IMAGES[cat.key] ? (
                      <Image source={CATEGORY_IMAGES[cat.key]} style={{ width: 36, height: 36 }} resizeMode="contain" />
                    ) : (
                      <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                    )}
                  </View>
                  <ThemedText style={[styles.categoryLabel, { color: tokens.colors.text }]}>{cat.label}</ThemedText>
                  {category === cat.label && (
                    <Ionicons name="checkmark" size={18} color={tokens.colors.primary} style={{ marginLeft:'auto' }} />
                  )}
                </TouchableOpacity>
              ))}
            
            </ScrollView>
          </View>
        </View>
      )}
      {locationModalOpen && (
        <View style={[styles.categoryOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)' }]}>          
          <View style={[styles.categorySheet, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>            
            <View style={[styles.categoryHeader, { borderColor: tokens.colors.border }]}>              
              {/* When a county is expanded show back arrow + county name, otherwise show default title */}
              {countyExpanded ? (
                <>
                  <TouchableOpacity onPress={() => setCountyExpanded(null)} style={[styles.closeBtn, { marginRight: 8 }]}> 
                    <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
                  </TouchableOpacity>
                  <ThemedText style={[styles.categoryHeaderTitle, { color: tokens.colors.text }]}>{countyExpanded}</ThemedText>
                  <TouchableOpacity onPress={() => { setLocationModalOpen(false); setCountyExpanded(null); }} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color={tokens.colors.text} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <ThemedText style={[styles.categoryHeaderTitle, { color: tokens.colors.text }]}>Alege localitatea</ThemedText>
                  <TouchableOpacity onPress={() => setLocationModalOpen(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color={tokens.colors.text} />
                  </TouchableOpacity>
                </>
              )}
            </View>
            <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
              {/* If a county is expanded, show its localities, otherwise show the list of counties + 'Toată țara' */}
              {countyExpanded ? (
                // show localities for selected county
                (() => {
                  const data = (localitatiPeJudet as any)[countyExpanded];
                  const orase = data?.orase?.map((o: any) => o.nume) || [];
                  const comune = data?.comune || [];
                  const localities = [...orase, ...comune];
                  // Some localities may repeat (same name in orase/comune). Use index-based keys or include county to guarantee uniqueness.
                  return localities.map((loc: string, idx: number) => (
                    <TouchableOpacity
                      key={`${countyExpanded}-${loc}-${idx}`}
                      onPress={() => { setLocation(loc + ', ' + countyExpanded); setLocationModalOpen(false); setCountyExpanded(null); }}
                      activeOpacity={0.65}
                      style={[styles.categoryRow, { borderColor: tokens.colors.border }]}
                    >
                      <ThemedText style={[styles.categoryLabel, { color: tokens.colors.text }]}>{loc}</ThemedText>
                    </TouchableOpacity>
                  ));
                })()
              ) : (
                // show counties list
                ['Toată țara', ...Object.keys(localitatiPeJudet)].map((loc: string) => (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => {
                      if (loc === 'Toată țara') {
                        setLocation(loc);
                        setLocationModalOpen(false);
                        setCountyExpanded(null);
                      } else {
                        // expand county to show localities
                        setCountyExpanded(loc);
                      }
                    }}
                    activeOpacity={0.65}
                    style={[styles.categoryRow, { borderColor: tokens.colors.border }]}
                  >
                    <ThemedText style={[styles.categoryLabel, { color: tokens.colors.text }]}>{loc}</ThemedText>
                  </TouchableOpacity>
                ))
              )}
              
            </ScrollView>
          </View>
        </View>
      )}
      
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1 },
  scroll:{ padding:16, paddingBottom:24, gap:20 },
  headerRow:{ flexDirection:'row', alignItems:'center', gap:12 },
  backButton:{ width:44, height:44, borderRadius:999, alignItems:'center', justifyContent:'center', borderWidth:1 },
  headerTitle:{ fontSize:24, fontWeight:'600' },
  card:{ borderRadius:16, padding:20, gap:20, borderWidth:1 },
  sectionTitle:{ fontSize:18, fontWeight:'700' },
  fieldBlock:{ gap:8 },
  label:{ fontSize:14, fontWeight:'600' },
  blockLabel:{ marginBottom:8 },
  input:{ borderWidth:1, borderRadius:14, paddingHorizontal:18, paddingVertical:14, fontSize:15 },
  textarea:{ borderWidth:1, borderRadius:14, padding:18, minHeight:140, textAlignVertical:'top', fontSize:15 },
  helperRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  helper:{ fontSize:12, fontWeight:'500' },
  counter:{ fontSize:12 },
  selectLike:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  paragraph:{ fontSize:13, lineHeight:18 },
  imagesRow:{ flexDirection:'row', flexWrap:'wrap', gap:14 },
  addImageCard:{ width:120, height:120, borderRadius:14, borderWidth:1, alignItems:'center', justifyContent:'center', padding:12, gap:8 },
  addImageText:{ fontSize:14, fontWeight:'600', textAlign:'center' },
  addUnderline:{ height:2, width:38, backgroundColor:'#e0b400' },
  imageCard:{ width:120, height:120, borderRadius:14, borderWidth:1, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  imageThumb:{ width:'100%', height:'100%' },
  bottomButtonsWrapper:{ flexDirection:'row', gap:12, marginTop:8 },
  previewBtn:{ flex:1, paddingVertical:14, paddingHorizontal:18, borderRadius:24, borderWidth:1, alignItems:'center', justifyContent:'center' },
  publishBtn:{ flex:1, paddingVertical:14, paddingHorizontal:18, borderRadius:24, alignItems:'center', justifyContent:'center' },
  previewText:{ fontSize:15, fontWeight:'600', textAlign:'center' },
  publishText:{ fontSize:15, fontWeight:'600', textAlign:'center' },
  categoryOverlay:{ position:'absolute', left:0, top:0, right:0, bottom:0, justifyContent:'flex-end' },
  categorySheet:{ maxHeight:'75%', borderTopLeftRadius:18, borderTopRightRadius:18, borderWidth:1, overflow:'hidden' },
  categoryHeader:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1 },
  categoryHeaderTitle:{ fontSize:16, fontWeight:'600' },
  closeBtn:{ padding:6, borderRadius:8 },
  categoryList:{ },
  categoryRow:{ flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1 },
  categoryIconWrap:{ width:44, height:44, borderRadius:10, alignItems:'center', justifyContent:'center' },
  categoryLabel:{ fontSize:15, fontWeight:'500' },
  devPreviewBtn: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    paddingVertical:12,
    paddingHorizontal:16,
    borderRadius:16,
    elevation:8,
    shadowColor:'#000',
    shadowOffset:{ width:0, height:6 },
    shadowOpacity:0.12,
    shadowRadius:12,
  },
});

