import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 390; // iPhone 14 base

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const scaleFactor = Math.min(width / BASE_WIDTH, 1.25);
  const scale = (size: number) => Math.round(size * scaleFactor);
  const moderateScale = (size: number, factor = 0.25) =>
    Math.round(size + (scaleFactor - 1) * size * factor);

  return {
    width,
    height,
    isPhone: width < 600,
    isTablet: width >= 600 && width < 900,
    isLargeTablet: width >= 900,
    columnsForCategories: width < 400 ? 3 : width < 600 ? 4 : width < 900 ? 6 : 8,
    scale,
    moderateScale,
  };
}
