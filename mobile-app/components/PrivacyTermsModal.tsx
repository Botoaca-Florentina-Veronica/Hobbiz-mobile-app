import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../src/context/ThemeContext';
import { useLocale } from '../src/context/LocaleContext';

const { width, height } = Dimensions.get('window');

interface PrivacyTermsModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function PrivacyTermsModal({ visible, onAccept }: PrivacyTermsModalProps) {
  const [isChecked, setIsChecked] = useState(false);
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const router = useRouter();

  const WEB_PRIMARY = '#100e9aff';
  const WEB_ACCENT = '#fcc22eff';

  const handleTermsPress = () => {
    router.push('/legal/terms');
  };

  const handlePrivacyPress = () => {
    router.push('/legal/privacy');
  };

  const handleAccept = () => {
    if (isChecked) {
      onAccept();
    }
  };

  const texts = {
    en: {
      title: 'Privacy & Terms',
      welcome: 'Welcome to Hobbiz! Please review our policies to continue.',
      agree: 'I agree to the',
      termsOfUse: 'Terms of Use',
      and: 'and',
      privacyPolicy: 'Privacy Policy',
      getStarted: 'Get Started',
    },
    ro: {
      title: 'Termeni si confidentialitate',
      welcome: 'Bine ai venit la Hobbiz! Te rugăm să verifici politicile noastre pentru a continua.',
      agree: 'Sunt de acord cu',
      termsOfUse: 'Termenii de Utilizare',
      and: 'și',
      privacyPolicy: 'Politica de Confidențialitate',
      getStarted: 'Începe',
    },
  };

  const t = locale === 'ro' ? texts.ro : texts.en;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 40 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        <View style={styles.overlay}>
          <View style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
              borderColor: isDark ? '#333333' : '#e2e8f0',
            }
          ]}>
            {/* Logo */}
            <Image
              source={require('../assets/images/logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />

            {/* Title */}
            <Text style={[
              styles.title,
              { color: isDark ? '#ffffff' : '#1a202c' }
            ]}>
              {t.title}
            </Text>

            {/* Description */}
            <Text style={[
              styles.description,
              { color: isDark ? '#b0b0b0' : '#64748b' }
            ]}>
              {t.welcome}
            </Text>

            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsChecked(!isChecked)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                {
                  borderColor: isDark ? '#444444' : '#cbd5e0',
                  backgroundColor: isChecked
                    ? WEB_PRIMARY
                    : (isDark ? '#2a2a2a' : '#ffffff'),
                }
              ]}>
                {isChecked && (
                  <Ionicons name="checkmark" size={18} color="#ffffff" />
                )}
              </View>
              <View style={styles.checkboxTextContainer}>
                <Text style={[
                  styles.checkboxText,
                  { color: isDark ? '#e0e0e0' : '#2d3748' }
                ]}>
                  {t.agree}{' '}
                </Text>
                <TouchableOpacity onPress={handleTermsPress}>
                  <Text style={[
                    styles.link,
                    { color: WEB_PRIMARY }
                  ]}>
                    {t.termsOfUse}
                  </Text>
                </TouchableOpacity>
                <Text style={[
                  styles.checkboxText,
                  { color: isDark ? '#e0e0e0' : '#2d3748' }
                ]}>
                  {' '}{t.and}{' '}
                </Text>
                <TouchableOpacity onPress={handlePrivacyPress}>
                  <Text style={[
                    styles.link,
                    { color: WEB_PRIMARY }
                  ]}>
                    {t.privacyPolicy}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Get Started Button */}
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isChecked ? WEB_PRIMARY : (isDark ? '#333333' : '#e2e8f0'),
                  opacity: isChecked ? 1 : 0.5,
                }
              ]}
              onPress={handleAccept}
              disabled={!isChecked}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.buttonText,
                {
                  color: isChecked ? '#ffffff' : (isDark ? '#666666' : '#94a3b8')
                }
              ]}>
                {t.getStarted}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: 1,
  },
  logo: {
    width: '92%',
    maxWidth: 520,
    height: 160,
    marginBottom: 10,
    marginTop: 10,
    alignSelf: 'center',
  },

  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 28,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  link: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    textDecorationLine: 'underline',
    lineHeight: 20,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5,
  },
});