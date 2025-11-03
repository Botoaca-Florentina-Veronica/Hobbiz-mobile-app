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
  },
  radius: { sm: 6, md: 8, lg: 12, pill: 999 },
  spacing: { xs:4, sm:8, md:12, lg:16, xl:24 },
  shadow: {
    // Native shadow props for iOS/Android
    elev1: { shadowColor:'#000', shadowOpacity:0.06, shadowRadius:4, shadowOffset:{width:0,height:2}, elevation:2, boxShadow: '0px 2px 4px rgba(0,0,0,0.06)' },
    elev2: { shadowColor:'#000', shadowOpacity:0.12, shadowRadius:8, shadowOffset:{width:0,height:4}, elevation:4, boxShadow: '0px 4px 8px rgba(0,0,0,0.12)' },
  }
};

export const darkTokens = {
  colors: {
    bg: '#121212',        // Surface - a10 (darkest)
    surface: '#282828',   // Surface - a20
    elev: '#3f3f3f',      // Surface - a30
    border: '#575757',    // Surface - a40
    text: '#eceeef',      // Light text on dark bg
    muted: '#8b8b8b',     // Surface - a60 (lightest from image)
    placeholder: '#717171', // Surface - a50
    // Primary pink from web dark mode
    primary: '#f51866',
    primaryHover: '#fa4875',
    primaryContrast: '#ffffff',
  },
  radius: { sm: 6, md: 8, lg: 12, pill: 999 },
  spacing: { xs:4, sm:8, md:12, lg:16, xl:24 },
  shadow: {
    elev1: { shadowColor:'#000', shadowOpacity:0.4, shadowRadius:4, shadowOffset:{width:0,height:2}, elevation:2 },
    elev2: { shadowColor:'#000', shadowOpacity:0.5, shadowRadius:8, shadowOffset:{width:0,height:4}, elevation:4 },
  }
};

export type Tokens = typeof lightTokens;
