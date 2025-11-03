import React, { useEffect, useState } from 'react';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

type ImageSource = { uri?: string } | string | number;

type Props = {
  images: ImageSource[];
  imageIndex?: number;
  visible: boolean;
  onRequestClose: () => void;
  onImageIndexChange?: (index: number) => void;
  HeaderComponent?: any;
  FooterComponent?: any;
  showCounter?: boolean; // fallback-only: show X/Y indicator
  [key: string]: any;
};

export default function ImageViewer(props: Props) {
  const { images = [], imageIndex = 0, visible, onRequestClose, onImageIndexChange, showCounter = false, ...rest } = props;

  // Prefer native package on mobile platforms. Use dynamic require so bundlers on web
  // don't try to resolve the native-only package.
  if (Platform.OS !== 'web') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ImageViewing = require('react-native-image-viewing').default;
      return (
        // @ts-ignore - pass through props to native component with smooth transition settings
        <ImageViewing 
          images={images as any} 
          imageIndex={imageIndex} 
          visible={visible} 
          onRequestClose={onRequestClose} 
          onImageIndexChange={onImageIndexChange}
          animationType="fade"
          swipeToCloseEnabled={true}
          doubleTapToZoomEnabled={true}
          presentationStyle="overFullScreen"
          {...rest} 
        />
      );
    } catch (e) {
      // If require fails for any reason, fall through to web fallback below.
      // This may happen in unit tests or if the package is missing.
      // eslint-disable-next-line no-console
      console.warn('react-native-image-viewing not available, using fallback viewer', e);
    }
  }

  // Web / fallback implementation: simple modal with prev/next and image display.
  const [index, setIndex] = useState(imageIndex);

  useEffect(() => {
    setIndex(imageIndex);
  }, [imageIndex, visible]);

  useEffect(() => {
    if (onImageIndexChange) onImageIndexChange(index);
  }, [index]);

  const resolveSource = (src: ImageSource) => {
    if (typeof src === 'string') return { uri: src };
    if (typeof src === 'number') return src as any;
    if (src && typeof src === 'object' && 'uri' in src && src.uri) return { uri: (src as any).uri };
    return undefined;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onRequestClose} accessibilityLabel="Închide">
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>

        <View style={styles.imageWrap}>
          {resolveSource(images[index]) ? (
            <Image source={resolveSource(images[index]) as any} style={styles.image} resizeMode="contain" />
          ) : null}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity disabled={index <= 0} onPress={() => setIndex(Math.max(0, index - 1))} style={styles.navBtn}>
            <Text style={[styles.navText, index <= 0 && styles.disabled]}>Prev</Text>
          </TouchableOpacity>
          {showCounter && (
            <Text style={styles.counter}>{index + 1}/{images.length}</Text>
          )}
          <TouchableOpacity disabled={index >= images.length - 1} onPress={() => setIndex(Math.min(images.length - 1, index + 1))} style={styles.navBtn}>
            <Text style={[styles.navText, index >= images.length - 1 && styles.disabled]}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 20, right: 18, zIndex: 20 },
  closeText: { color: '#fff', fontSize: 32, lineHeight: 36 },
  imageWrap: { width: '100%', height: '80%', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  controls: { position: 'absolute', bottom: 36, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28, alignItems: 'center' },
  navBtn: { padding: 12 },
  navText: { color: '#fff', fontSize: 16 },
  disabled: { opacity: 0.35 },
  counter: { color: '#fff', fontSize: 14 },
});
