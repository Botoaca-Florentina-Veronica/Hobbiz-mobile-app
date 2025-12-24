import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { localitatiPeJudet } from '../../assets/comunePeJudet';
import storage from '../../src/services/storage';
import { useLocale } from '../../src/context/LocaleContext';
import { ProtectedRoute } from '@/src/components/ProtectedRoute';
import { Toast } from '../../components/ui/Toast';

interface ImageItem { 
  id: string; 
  uri?: string; 
  assetId?: string | null;
  width?: number;
  height?: number;
  type?: string;
  fileName?: string | null;
  fileSize?: number;
}
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

const TRANSLATIONS = {
  ro: {
    pageTitle: 'Publică un anunț',
    describeSection: 'Descrie-ți anunțul cu lux de detalii!',
    titleLabel: 'Adaugă un titlu clar*',
    titlePlaceholder: 'ex: Predau lecții de fizică, online',
    titleHelper: 'Introdu cel puțin 16 caractere',
    categoryLabel: 'Categoria*',
    categoryPlaceholder: 'Alege categoria',
    imagesSection: 'Imagini',
    imagesHelper: 'Prima imagine va fi coperta anunțului! Poți adăuga mai multe imagini.',
    duplicateImageTitle: 'Imagine duplicată',
    duplicateImageMessage: 'Această imagine a fost deja adăugată. Te rugăm să alegi o imagine diferită.',
    duplicateImageDismiss: 'Am înțeles',
    coverBadge: '⭐ Copertă',
    addImages: 'Adaugă imagini',
    descriptionLabel: 'Descriere*',
    descriptionPlaceholder: 'Încearcă să scrii ce ai vrea tu să afli dacă te-ai uita la acest anunț',
    descriptionHelper: 'Introdu cel puțin 40 caractere',
    locationLabel: 'Localitate*',
    contactSection: 'Informații de contact',
    contactNameLabel: 'Persoana de contact*',
    contactNamePlaceholder: 'Nume și prenume',
    emailLabel: 'Adresa de email*',
    emailPlaceholder: 'ex: exemplu@gmail.com',
    phoneLabel: 'Numărul de telefon*',
    phonePlaceholder: 'ex: 07xxxxxxx',
    previewButton: 'Previzualizați anunțul',
    publishButton: 'Publică un anunț',
    chooseCategoryTitle: 'Alege categoria',
    chooseLocationTitle: 'Alege localitatea',
    allCountry: 'Toată țara',
    authError: 'Trebuie să fii autentificat pentru a posta un anunț.',
    titleValidation: 'Titlul trebuie să aibă minim 16 caractere.',
    categoryValidation: 'Te rugăm să alegi o categorie.',
    descriptionValidation: 'Descrierea trebuie să aibă minim 40 caractere.',
    locationValidation: 'Te rugăm să alegi o localitate.',
    contactNameValidation: 'Te rugăm să introduci numele persoanei de contact.',
    emailValidation: 'Te rugăm să introduci o adresă de email.',
    emailFormatError: 'Adresa de email nu este validă.',
    phoneValidation: 'Te rugăm să introduci un număr de telefon.',
    phoneFormatError: 'Numărul de telefon nu este valid (ex: 07xxxxxxxx).',
    imageFormatError: 'Format imagine invalid',
    imageFormatMessage: 'Doar fișiere JPG sau JPEG.',
    postError: 'Eroare la postare',
    postErrorMessage: 'A intervenit o eroare. Te rugăm să încerci din nou.',
  },
  en: {
    pageTitle: 'Post an Announcement',
    describeSection: 'Describe your announcement in detail!',
    titleLabel: 'Add a clear title*',
    titlePlaceholder: 'e.g.: Physics lessons, online',
    titleHelper: 'Enter at least 16 characters',
    categoryLabel: 'Category*',
    categoryPlaceholder: 'Choose category',
    imagesSection: 'Images',
    imagesHelper: '⭐ The first image will be the cover! You can add multiple images.',
    duplicateImageTitle: 'Duplicate image',
    duplicateImageMessage: 'This image has already been added. Please choose a different image.',
    duplicateImageDismiss: 'Got it',
    coverBadge: '⭐ Cover',
    addImages: 'Add images',
    descriptionLabel: 'Description*',
    descriptionPlaceholder: 'Try to write what you would like to know if you were looking at this announcement',
    descriptionHelper: 'Enter at least 40 characters',
    locationLabel: 'Location*',
    contactSection: 'Contact Information',
    contactNameLabel: 'Contact person*',
    contactNamePlaceholder: 'First and last name',
    emailLabel: 'Email address*',
    emailPlaceholder: 'e.g.: example@gmail.com',
    phoneLabel: 'Phone number*',
    phonePlaceholder: 'e.g.: 07xxxxxxx',
    previewButton: 'Preview announcement',
    publishButton: 'Post an announcement',
    chooseCategoryTitle: 'Choose category',
    chooseLocationTitle: 'Choose location',
    allCountry: 'Entire country',
    authError: 'You must be authenticated to post an announcement.',
    titleValidation: 'The title must be at least 16 characters.',
    categoryValidation: 'Please choose a category.',
    descriptionValidation: 'The description must be at least 40 characters.',
    locationValidation: 'Please choose a location.',
    contactNameValidation: 'Please enter the contact person name.',
    emailValidation: 'Please enter an email address.',
    emailFormatError: 'The email address is invalid.',
    phoneValidation: 'Please enter a phone number.',
    phoneFormatError: 'The phone number is invalid (e.g. 07xxxxxxxx).',
    imageFormatError: 'Invalid image format',
    imageFormatMessage: 'Only JPG or JPEG files.',
    postError: 'Post error',
    postErrorMessage: 'An error occurred. Please try again.',
  },
};

// Category translation keys
const CATEGORY_LABELS: Record<string, { ro: string; en: string }> = {
  fotografie: { ro: 'Fotografie', en: 'Photography' },
  prajituri: { ro: 'Prăjituri', en: 'Baking' },
  muzica: { ro: 'Muzică', en: 'Music' },
  reparatii: { ro: 'Reparații', en: 'Repairs' },
  dans: { ro: 'Dans', en: 'Dance' },
  curatenie: { ro: 'Curățenie', en: 'Cleaning' },
  gradinarit: { ro: 'Grădinărit', en: 'Gardening' },
  sport: { ro: 'Sport', en: 'Sports' },
  arta: { ro: 'Artă', en: 'Art' },
  tehnologie: { ro: 'Tehnologie', en: 'Technology' },
  auto: { ro: 'Auto', en: 'Cars' },
  meditatii: { ro: 'Meditații', en: 'Tutoring' },
};

export default function SellScreen() {
  const { tokens, isDark } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [countyExpanded, setCountyExpanded] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const { isAuthenticated } = useAuth();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const t = TRANSLATIONS[locale === 'en' ? 'en' : 'ro'];

  const selectedCategoryLabel = categoryKey
    ? (CATEGORY_LABELS[categoryKey] ? (locale === 'en' ? CATEGORY_LABELS[categoryKey].en : CATEGORY_LABELS[categoryKey].ro) : (category || t.categoryPlaceholder))
    : (category || t.categoryPlaceholder);

  // Initialize location with translated text
  useEffect(() => {
    if (!location) {
      setLocation(t.allCountry);
    }
  }, [t]);

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
        showToast(t.imageFormatMessage, 'error');
        return;
      }

      let duplicatesFound = false;
      const timestampBase = Date.now();

      // Calculate existing signatures from current state 'images'
      const existingSignatures = new Set<string>();
      images.forEach(item => {
        if (item.uri) existingSignatures.add(item.uri);
        if (item.assetId) existingSignatures.add(item.assetId);
        if (item.width && item.height && item.fileSize) {
          existingSignatures.add(`${item.width}-${item.height}-${item.fileSize}`);
        }
      });

      const batchSignatures = new Set<string>();
      const additions: ImageItem[] = [];

      jpgAssets.forEach((asset: any, idx: number) => {
        const uri = asset.uri;
        if (!uri) return;
        
        const assetId = asset.assetId;
        const width = asset.width;
        const height = asset.height;
        const fileSize = asset.fileSize;
        
        const compositeSig = (width && height && fileSize) ? `${width}-${height}-${fileSize}` : null;

        let isDuplicate = false;
        
        if (existingSignatures.has(uri)) isDuplicate = true;
        if (assetId && existingSignatures.has(assetId)) isDuplicate = true;
        if (compositeSig && existingSignatures.has(compositeSig)) isDuplicate = true;
        
        if (batchSignatures.has(uri)) isDuplicate = true;
        if (assetId && batchSignatures.has(assetId)) isDuplicate = true;
        if (compositeSig && batchSignatures.has(compositeSig)) isDuplicate = true;

        if (isDuplicate) {
          duplicatesFound = true;
          return;
        }
        
        batchSignatures.add(uri);
        if (assetId) batchSignatures.add(assetId);
        if (compositeSig) batchSignatures.add(compositeSig);
        
        additions.push({ 
          id: `${timestampBase}_${idx}`, 
          uri,
          assetId,
          width,
          height,
          type: asset.type,
          fileName: asset.fileName,
          fileSize
        });
      });

      if (additions.length > 0) {
        setImages(prev => [...prev, ...additions]);
      }

      if (duplicatesFound) {
        setShowDuplicateModal(true);
      }
    } catch (e) {
      console.error('pickImages error', e);
      showToast('Nu am putut selecta imaginile.', 'error');
    }
  }

  const disabledPublish = title.length < 16 || description.length < 40 || !contactName || submitting;

  const handlePreview = () => {
    // Validate required fields before preview
    if (title.length < 16) {
      showToast(t.titleValidation, 'error');
      return;
    }
    if (!category) {
      showToast(t.categoryValidation, 'error');
      return;
    }
    if (description.length < 40) {
      showToast(t.descriptionValidation, 'error');
      return;
    }
    if (!contactName.trim()) {
      showToast(t.contactNameValidation, 'error');
      return;
    }
    if (!email.trim()) {
      showToast(t.emailValidation, 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast(t.emailFormatError, 'error');
      return;
    }

    if (!phone.trim()) {
      showToast(t.phoneValidation, 'error');
      return;
    }
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      showToast(t.phoneFormatError, 'error');
      return;
    }
    
    // Navigate to preview with all data
    const imageUris = images.filter(img => img.uri).map(img => img.uri);
    router.push({
      pathname: '/announcement-preview',
      params: {
        title,
        category: selectedCategoryLabel,
        description,
        location,
        contactPerson: contactName,
        contactEmail: email,
        contactPhone: phone,
        images: JSON.stringify(imageUris),
      },
    } as any);
  };

  

  const handleSubmit = async () => {
    // Validations (mirror edit flow)
    if (!isAuthenticated) {
      showToast(t.authError, 'error');
      return;
    }
    if (title.length < 16) {
      showToast(t.titleValidation, 'error');
      return;
    }
    if (!category) {
      showToast(t.categoryValidation, 'error');
      return;
    }
    if (description.length < 40) {
      showToast(t.descriptionValidation, 'error');
      return;
    }
    if (!contactName.trim()) {
      showToast(t.contactNameValidation, 'error');
      return;
    }
    if (!email.trim()) {
      showToast(t.emailValidation, 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast(t.emailFormatError, 'error');
      return;
    }

    if (!phone.trim()) {
      showToast(t.phoneValidation, 'error');
      return;
    }
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      showToast(t.phoneFormatError, 'error');
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

      const res = await api.post('/api/users/my-announcements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const submittedTitle = title.trim();
      // clear the form so the Sell page doesn't keep the submitted data
      const resetForm = () => {
        setTitle('');
        setCategory(null);
        setCategoryKey(null);
        setDescription('');
        setContactName('');
        setEmail('');
        setPhone('');
        setLocation(t.allCountry);
        setImages([]);
        setCategoryModalOpen(false);
        setLocationModalOpen(false);
        setCountyExpanded(null);
      };

      resetForm();

      // Try to extract the created announcement ID from server response
      const createdId = res?.data?._id || res?.data?.id || res?.data?.announcementId || null;
      if (createdId) {
        // Redirect directly to the announcement details page
        try {
          router.replace(`/announcement-details?id=${encodeURIComponent(String(createdId))}`);
        } catch (e) {
          // Fallback to post-success if navigation fails
          router.replace({ pathname: '/post-success', params: { title: submittedTitle } });
        }
      } else {
        // If server didn't return an ID, keep the existing success screen
        router.replace({ pathname: '/post-success', params: { title: submittedTitle } });
      }
    } catch (error: any) {
      console.error('Error publishing announcement:', error);
      const errMsg = error?.response?.data?.error || t.postErrorMessage;
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
  <ProtectedRoute>
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
          <ThemedText style={[styles.headerTitle, { color: tokens.colors.text }]}>{t.pageTitle}</ThemedText>
        </View>

        {/* Section: Descrie-ti anuntul */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>{t.describeSection}</ThemedText>
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>{t.titleLabel}</ThemedText>
            <ThemedTextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder={t.titlePlaceholder}
              placeholderTextColor={tokens.colors.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={70}
            />
            <View style={styles.helperRow}>
              <ThemedText style={[styles.helper, { color: tokens.colors.primary }]}>{t.titleHelper}</ThemedText>
              <ThemedText style={[styles.counter, { color: tokens.colors.muted }]}>{title.length}/70</ThemedText>
            </View>
          </View>
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>{t.categoryLabel}</ThemedText>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => setCategoryModalOpen(true)}
              style={[styles.input, styles.selectLike, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}
            >
              <ThemedText style={{ color: (categoryKey || category) ? tokens.colors.text : tokens.colors.muted }}>{selectedCategoryLabel}</ThemedText>
              <Ionicons name="chevron-down" size={18} color={tokens.colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Imagini */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>{t.imagesSection}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.imagesHelper}</ThemedText>
          <View style={styles.imagesRow}>
            <TouchableOpacity onPress={addImagePlaceholder} activeOpacity={0.8} style={[styles.addImageCard, { backgroundColor: isDark ? tokens.colors.elev : '#fff8ea', borderColor: isDark ? tokens.colors.border : '#ffe7b3' }]}>              
              <ThemedText style={[styles.addImageText, { color: tokens.colors.text }]}>{t.addImages}</ThemedText>
              <View style={[styles.addUnderline, { backgroundColor: isDark ? tokens.colors.primary : '#e0b400' }]} />
            </TouchableOpacity>
            {images.map((img, index) => {
              const isCover = index === 0;
              return (
                <View
                  key={img.id}
                  style={[
                    styles.imageCard,
                    {
                      backgroundColor: tokens.colors.elev,
                      borderColor: isCover ? tokens.colors.primary : tokens.colors.border,
                      borderWidth: isCover ? 2 : 1,
                    },
                  ]}
                >
                  {isCover && (
                    <View style={[styles.coverBadge, { backgroundColor: tokens.colors.primary }]}>
                      <ThemedText style={[styles.coverBadgeText, { color: tokens.colors.primaryContrast }]}>{t.coverBadge}</ThemedText>
                    </View>
                  )}
                  {img.uri ? (
                    <Image source={{ uri: img.uri }} style={styles.imageThumb} resizeMode="cover" />
                  ) : (
                    <Ionicons name="camera" size={28} color={tokens.colors.text} />
                  )}
                </View>
              );
            })}
            {/* Placeholder extra slot */}
            <View style={[styles.imageCard, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}>              
              <Ionicons name="camera" size={28} color={tokens.colors.text} />
            </View>
          </View>
        </View>

        {/* Section: Descriere mare */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.label, styles.blockLabel, { color: tokens.colors.text }]}>{t.descriptionLabel}</ThemedText>
          <ThemedTextInput
            style={[styles.textarea, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
            placeholder={t.descriptionPlaceholder}
            placeholderTextColor={tokens.colors.muted}
            multiline
            value={description}
            maxLength={9000}
            onChangeText={setDescription}
          />
          <View style={styles.helperRow}>
            <ThemedText style={[styles.helper, { color: tokens.colors.primary }]}>{t.descriptionHelper}</ThemedText>
            <ThemedText style={[styles.counter, { color: tokens.colors.muted }]}>{description.length}/9000</ThemedText>
          </View>
        </View>

        {/* Section: Localitate */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.label, styles.blockLabel, { color: tokens.colors.text }]}>{t.locationLabel}</ThemedText>
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
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>{t.contactSection}</ThemedText>
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>{t.contactNameLabel}</ThemedText>
            <ThemedTextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder={t.contactNamePlaceholder}
              placeholderTextColor={tokens.colors.muted}
              value={contactName}
              onChangeText={setContactName}
            />
          </View>
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>{t.emailLabel}</ThemedText>
            <ThemedTextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder={t.emailPlaceholder}
              placeholderTextColor={tokens.colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.label, { color: tokens.colors.text }]}>{t.phoneLabel}</ThemedText>
            <ThemedTextInput
              style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholder={t.phonePlaceholder}
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
            onPress={handlePreview}
            style={[styles.previewBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
          >            
            <ThemedText style={[styles.previewText, { color: tokens.colors.primary }]}>{t.previewButton}</ThemedText>
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
              <ThemedText style={[styles.publishText, { color: isDark ? '#ffffff' : tokens.colors.primaryContrast }]}>{t.publishButton}</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {categoryModalOpen && (
        <View style={[styles.categoryOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)' }]}>          
          <View style={[styles.categorySheet, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>            
            <View style={[styles.categoryHeader, { borderColor: tokens.colors.border }]}>              
              <ThemedText style={[styles.categoryHeaderTitle, { color: tokens.colors.text }]}>{t.chooseCategoryTitle}</ThemedText>
              <TouchableOpacity onPress={() => setCategoryModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={tokens.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => { setCategory(cat.label); setCategoryKey(cat.key); setCategoryModalOpen(false); }}
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
                  <ThemedText style={[styles.categoryLabel, { color: tokens.colors.text }]}>
                    {(CATEGORY_LABELS as any)[cat.key] ? (locale === 'en' ? (CATEGORY_LABELS as any)[cat.key].en : (CATEGORY_LABELS as any)[cat.key].ro) : cat.label}
                  </ThemedText>
                  {categoryKey === cat.key && (
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
                  <ThemedText style={[styles.categoryHeaderTitle, { color: tokens.colors.text }]}>{t.chooseLocationTitle}</ThemedText>
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
                [t.allCountry, ...Object.keys(localitatiPeJudet)].map((loc: string) => (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => {
                      if (loc === t.allCountry || loc === 'Toată țara' || loc === 'Entire country') {
                        setLocation(t.allCountry);
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

          {showDuplicateModal && (
            <View style={[styles.errorOverlay, { backgroundColor: isDark ? tokens.colors.overlayDark : tokens.colors.overlayLight }]}>          
              <View style={[styles.errorModal, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>            
                <Ionicons name="alert-circle" size={32} color={tokens.colors.primary} style={{ marginBottom: 12 }} />
                <ThemedText style={[styles.errorTitle, { color: tokens.colors.text }]}>{t.duplicateImageTitle}</ThemedText>
                <ThemedText style={[styles.errorMessage, { color: tokens.colors.muted }]}>{t.duplicateImageMessage}</ThemedText>
                <TouchableOpacity
                  onPress={() => setShowDuplicateModal(false)}
                  activeOpacity={0.8}
                  style={[styles.errorButton, { backgroundColor: tokens.colors.primary }]}
                >
                  <ThemedText style={[styles.errorButtonText, { color: tokens.colors.primaryContrast }]}>{t.duplicateImageDismiss}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
      
    </ThemedView>
    </ProtectedRoute>
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
  imageCard:{ width:120, height:120, borderRadius:14, borderWidth:1, alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' },
  imageThumb:{ width:'100%', height:'100%' },
  coverBadge:{ 
    position:'absolute', 
    top:6, 
    left:6, 
    paddingHorizontal:10, 
    paddingVertical:5, 
    borderRadius:999,
    shadowColor:'#000',
    shadowOffset:{ width:0, height:2 },
    shadowOpacity:0.25,
    shadowRadius:3.84,
    elevation:5,
  },
  coverBadgeText:{ fontSize:11, fontWeight:'700', letterSpacing:0.3 },
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
  errorOverlay:{ position:'absolute', top:0, left:0, right:0, bottom:0, alignItems:'center', justifyContent:'center', padding:24, zIndex: 2000, elevation: 2000 },
  errorModal:{ width:'100%', maxWidth:320, borderRadius:20, borderWidth:1, padding:24, alignItems:'center', gap:12, elevation: 2001, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  errorTitle:{ fontSize:18, fontWeight:'700', textAlign:'center' },
  errorMessage:{ fontSize:14, textAlign:'center', lineHeight:20 },
  errorButton:{ marginTop:4, borderRadius:16, paddingHorizontal:20, paddingVertical:10 },
  errorButtonText:{ fontSize:14, fontWeight:'600' },
});