import { ImageSourcePropType } from 'react-native';

export type CategoryDef = {
  key: string;
  label: string;
  icon: string;
  color: string;
  image?: ImageSourcePropType;
};

export const CATEGORY_DEFS: CategoryDef[] = [
  { key: 'fotografie', label: 'Fotografie', icon: 'camera-outline', color: '#FF6B6B', image: require('../../assets/images/camera.png') },
  { key: 'prajituri', label: 'Prăjituri', icon: 'ice-cream-outline', color: '#4ECDC4', image: require('../../assets/images/bake.png') },
  { key: 'muzica', label: 'Muzică', icon: 'musical-notes-outline', color: '#45B7D1', image: require('../../assets/images/guitar.png') },
  { key: 'reparatii', label: 'Reparații', icon: 'construct-outline', color: '#96CEB4', image: require('../../assets/images/pipe.png') },
  { key: 'dans', label: 'Dans', icon: 'woman-outline', color: '#FFEAA7', image: require('../../assets/images/salsa.png') },
  { key: 'curatenie', label: 'Curățenie', icon: 'sparkles-outline', color: '#DDA0DD', image: require('../../assets/images/cleaning.png') },
  { key: 'gradinarit', label: 'Grădinărit', icon: 'leaf-outline', color: '#98D8C8', image: require('../../assets/images/gardening-logo.jpg') },
  { key: 'sport', label: 'Sport', icon: 'barbell-outline', color: '#F7DC6F', image: require('../../assets/images/tennis.png') },
  { key: 'arta', label: 'Artă', icon: 'color-palette-outline', color: '#BB8FCE', image: require('../../assets/images/arta.png') },
  { key: 'tehnologie', label: 'Tehnologie', icon: 'laptop-outline', color: '#85C1E9', image: require('../../assets/images/laptop.png') },
  { key: 'auto', label: 'Auto', icon: 'car-sport-outline', color: '#F8C471', image: require('../../assets/images/car.png') },
  { key: 'meditatii', label: 'Meditații', icon: 'school-outline', color: '#82E0AA', image: require('../../assets/images/carte.png') },
];

export function findCategoryByLabel(label?: string): CategoryDef | undefined {
  if (!label) return undefined;
  const normalized = label.trim().toLowerCase();
  return CATEGORY_DEFS.find(c => c.label.toLowerCase() === normalized || c.key.toLowerCase() === normalized);
}

export default CATEGORY_DEFS;
