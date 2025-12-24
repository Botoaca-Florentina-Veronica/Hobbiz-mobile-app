// Design tokens extrase din web pentru paritate vizuală
export const lightTokens = {
  colors: {
    bg: '#f3f5f6',
    surface: '#ffffff',
    elev: '#ffffff',
    border: '#e0e0e0',
    text: '#1f2937',
    muted: '#666666',
    placeholder: '#aaa',
    primary: '#355070',
    primaryHover: '#2a4059',
    primaryContrast: '#ffffff',
    darkModeContainer: '#121212',
    // Semantic additions
    success: '#2196F3',       // active like / positive actions
    danger: '#F44336',        // active unlike / destructive
    rating: '#FFC107',        // stars & rating badge in light mode
    overlayDark: 'rgba(0,0,0,0.65)', // used when forcing dark overlay regardless of scheme
    overlayLight: 'rgba(0,0,0,0.4)', // lighter overlay variant
    placeholderBg: '#eeeeee', // generic light placeholder for images
    borderNeutral: '#8b8b8bff', // unified border color for both themes
    turquoise: '#1abc9c', // accent turquoise used for reactivate button
  },
  radius: { sm: 6, md: 8, lg: 12, pill: 999 },
  spacing: { xs:4, sm:8, md:12, lg:16, xl:24 },
  shadow: {
    // Native shadow props for iOS/Android
    elev1: { shadowColor:'#000', shadowOpacity:0.06, shadowRadius:4, shadowOffset:{width:0,height:2}, elevation:2 },
    elev2: { shadowColor:'#000', shadowOpacity:0.12, shadowRadius:8, shadowOffset:{width:0,height:4}, elevation:4 },
  }
};

export const darkTokens = {
  colors: {
    bg: '#121212',        // Surface - a10 (darkest)
    surface: '#282828',   // Surface - a20
    elev: '#3f3f3f',      // Surface - a30
    border: '#8b8b8bff',    // Surface - a40
    text: '#eceeef',      // Light text on dark bg
    muted: '#8b8b8b',     // Surface - a60 (lightest from image)
    placeholder: '#717171', // Surface - a50
    // Primary pink from web dark mode
    primary: '#f51866',
    primaryHover: '#fa4875',
    primaryContrast: '#ffffff',
    darkModeContainer: '#121212',
    // Semantic additions mirroring light but tuned for dark
    success: '#2196F3',        // active like
    danger: '#F44336',         // active unlike / destructive
    rating: '#f51866',         // stars & rating badge (align with brand pink in dark)
    overlayDark: 'rgba(0,0,0,0.65)',
    overlayLight: 'rgba(0,0,0,0.4)',
    placeholderBg: '#3a3a3a',  // dark placeholder surface
    borderNeutral: '#8b8b8bff', // unified border color for both themes
    turquoise: '#5fd3e2ff', // accent turquoise used for reactivate button
  },
  radius: { sm: 6, md: 8, lg: 12, pill: 999 },
  spacing: { xs:4, sm:8, md:12, lg:16, xl:24 },
  shadow: {
    elev1: { shadowColor:'#000', shadowOpacity:0.4, shadowRadius:4, shadowOffset:{width:0,height:2}, elevation:2 },
    elev2: { shadowColor:'#000', shadowOpacity:0.5, shadowRadius:8, shadowOffset:{width:0,height:4}, elevation:4 },
  }
};

export type Tokens = typeof lightTokens;