import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { useAppTheme } from '../../src/context/ThemeContext';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  icon?: string;
  iconColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmă',
  cancelText = 'Anulează',
  confirmColor,
  icon = 'alert-circle-outline',
  iconColor,
  onConfirm,
  onCancel,
}) => {
  const { tokens, isDark } = useAppTheme();
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const finalConfirmColor = confirmColor || (isDark ? '#f44336' : '#d32f2f');
  const finalIconColor = iconColor || finalConfirmColor;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.25)',
            opacity: fadeAnim,
          },
        ]}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 40 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          experimentalBlurMethod="dimezisBlurView"
        />
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onCancel}
        >
          <Animated.View
            style={[
              styles.dialog,
              {
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                transform: [{ scale: scaleAnim }],
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDark ? 0.6 : 0.25,
                    shadowRadius: 20,
                  },
                  android: {
                    elevation: 12,
                  },
                  web: {
                    boxShadow: isDark
                      ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                      : '0 8px 32px rgba(0, 0, 0, 0.25)',
                  },
                }),
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Ionicons name={icon as any} size={32} color={finalIconColor} />
            </View>

            {/* Title */}
            <ThemedText
              style={[
                styles.title,
                {
                  color: isDark ? '#FFFFFF' : '#1A1A1A',
                },
              ]}
            >
              {title}
            </ThemedText>

            {/* Message */}
            <ThemedText
              style={[
                styles.message,
                {
                  color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                },
              ]}
            >
              {message}
            </ThemedText>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.buttonText,
                    {
                      color: isDark ? '#FFFFFF' : '#1A1A1A',
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {cancelText}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  {
                    backgroundColor: finalConfirmColor,
                  },
                ]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <ThemedText 
                  style={[styles.buttonText, styles.confirmButtonText]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {confirmText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Poppins-Regular',
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {},
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
});
