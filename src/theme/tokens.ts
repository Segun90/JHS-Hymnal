export const brand = {
  red: '#C62828', redDeep: '#B71C1C', navy: '#1E3A8A', green: '#2E7D32',
  gold: '#D4A017', silver: '#9CA3AF', white: '#FFFFFF',
} as const;

export const gradients = {
  hero: ['#1E3A8A', '#2747A8'] as const,
  secondary: ['#C62828', '#B71C1C'] as const,
} as const;

export interface Palette {
  primary: string; primaryPressed: string; onPrimary: string;
  background: string; surface: string; surfaceAlt: string;
  text: string; textSecondary: string;
  accent: string; onAccent: string; highlight: string;
  border: string; scrim: string; error: string; success: string;
}

export const light: Palette = {
  primary: '#1E3A8A', primaryPressed: '#172E6B', onPrimary: '#FFFFFF',
  background: '#FAF8F5', surface: '#FFFFFF', surfaceAlt: '#F1EDE6',
  text: '#1F2937', textSecondary: '#6B7280',
  accent: '#C62828', onAccent: '#FFFFFF', highlight: '#D4A017',
  border: '#E5E7EB', scrim: 'rgba(31,41,55,0.5)', error: '#D32F2F', success: '#2E7D32',
};

export const dark: Palette = {
  primary: '#5C7FD4', primaryPressed: '#4A68B5', onPrimary: '#FFFFFF',
  background: '#0B1020', surface: '#121A2E', surfaceAlt: '#1B2440',
  text: '#F1F5FB', textSecondary: '#A7B0C4',
  accent: '#CE4545', onAccent: '#FFFFFF', highlight: '#E4BE54',
  border: '#2A3352', scrim: 'rgba(5,8,18,0.72)', error: '#F2B8B5', success: '#81C784',
};

export const fonts = {
  serifRegular: 'NotoSerif_400Regular', serifSemiBold: 'NotoSerif_600SemiBold',
  serifBold: 'NotoSerif_700Bold', serifItalic: 'NotoSerif_400Regular_Italic',
  sansRegular: 'Poppins_400Regular', sansMedium: 'Poppins_500Medium',
  sansSemiBold: 'Poppins_600SemiBold', sansBold: 'Poppins_700Bold',
} as const;

export const type = {
  display:       { fontFamily: fonts.sansSemiBold, fontSize: 28, lineHeight: 34 },
  titleLarge:    { fontFamily: fonts.sansSemiBold, fontSize: 24, lineHeight: 30 },
  titleMedium:   { fontFamily: fonts.sansSemiBold, fontSize: 20, lineHeight: 26 },
  sectionHeader: { fontFamily: fonts.sansMedium,   fontSize: 18, lineHeight: 24 },
  readerBody:    { fontFamily: fonts.sansMedium,   fontSize: 16, lineHeight: 30 },
  body:          { fontFamily: fonts.sansMedium,   fontSize: 16, lineHeight: 24 },
  bodyStrong:    { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 24 },
  caption:       { fontFamily: fonts.sansMedium,   fontSize: 13, lineHeight: 18 },
  verseNumber:   { fontFamily: fonts.sansSemiBold, fontSize: 11, lineHeight: 14 },
  hymnNumber:    { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 18 },
} as const;

export const READER_FONT_MIN = 14;
export const READER_FONT_MAX = 28;

export const space = {
  space1: 4, space2: 8, space3: 12, space4: 16, space5: 20, space6: 24, space7: 32, space8: 40,
  screenPadding: 24, readerPadding: 24, readerBottomPadding: 40, readerParagraphGap: 12,
  maxContentWidth: 560,
  listItemMinHeight: 72, touchTarget: 48,
} as const;

export const tabBar = {
  contentHeight: 60,
  padding: 6,
  bottomGap: 4,
  minBottomInset: 8,
} as const;

export const radius = { r1: 8, r2: 12, r3: 20, r4: 28, rFull: 999 } as const;

export const elevation = {
  card:  { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,  elevation: 2 },
  bar:   { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8,  elevation: 4 },
  modal: { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 8 },
} as const;

export const motion = { fast: 150, normal: 250 } as const;
