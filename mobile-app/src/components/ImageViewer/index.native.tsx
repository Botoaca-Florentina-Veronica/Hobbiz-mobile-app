import React from 'react';
import ImageViewing from 'react-native-image-viewing';

type ImageSource = { uri?: string } | string | number;

type Props = {
  images: ImageSource[];
  imageIndex?: number;
  visible: boolean;
  onRequestClose: () => void;
  onImageIndexChange?: (index: number) => void;
  HeaderComponent?: any;
  FooterComponent?: any;
  showCounter?: boolean;
  [key: string]: any;
};

export default function ImageViewer(props: Props) {
  const { images = [], imageIndex = 0, visible, onRequestClose, onImageIndexChange, ...rest } = props;

  return (
    // @ts-ignore - react-native-image-viewing prop types vary by version
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
}