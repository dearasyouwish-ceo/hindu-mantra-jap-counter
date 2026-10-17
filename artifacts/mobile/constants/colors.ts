export type ThemeName = 'saffron' | 'temple' | 'nature' | 'light' | 'dark';

export type Palette = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  gold: string;
  heroStart: string;
  heroMiddle: string;
  heroEnd: string;
  bead: string;
  success: string;
};

export const palettes: Record<ThemeName, Palette> = {
  saffron: {
    background: '#fff8eb', foreground: '#502c19', card: '#fffdf7', cardForeground: '#502c19',
    primary: '#a54019', primaryForeground: '#ffffff', secondary: '#fff0d9', secondaryForeground: '#8c3718',
    muted: '#f4e9d9', mutedForeground: '#987b61', accent: '#f8e4bf', accentForeground: '#803414',
    destructive: '#a12e1c', destructiveForeground: '#ffffff', border: '#efdfca', input: '#e7d5bf',
    gold: '#e8b65d', heroStart: '#792910', heroMiddle: '#bd451a', heroEnd: '#e8a63e',
    bead: '#ead5b7', success: '#496a3c',
  },
  temple: {
    background: '#fff4e5', foreground: '#512d1c', card: '#fffaf1', cardForeground: '#512d1c',
    primary: '#a84725', primaryForeground: '#ffffff', secondary: '#fbe8cd', secondaryForeground: '#84391f',
    muted: '#f4e6d2', mutedForeground: '#96795e', accent: '#f6dfb8', accentForeground: '#84391f',
    destructive: '#a12e1c', destructiveForeground: '#ffffff', border: '#ead7bd', input: '#e6d2b7',
    gold: '#ddb04e', heroStart: '#6c2816', heroMiddle: '#a84725', heroEnd: '#d69c3b',
    bead: '#e6d0ae', success: '#496a3c',
  },
  nature: {
    background: '#eff5e9', foreground: '#254a36', card: '#fbfff6', cardForeground: '#254a36',
    primary: '#286b49', primaryForeground: '#ffffff', secondary: '#e4efdf', secondaryForeground: '#286b49',
    muted: '#e7efe2', mutedForeground: '#66806c', accent: '#d8e9d0', accentForeground: '#23543c',
    destructive: '#a12e1c', destructiveForeground: '#ffffff', border: '#d7e5cf', input: '#cbdcc3',
    gold: '#c6a453', heroStart: '#1e4935', heroMiddle: '#286b49', heroEnd: '#78a05d',
    bead: '#c7d8bd', success: '#286b49',
  },
  light: {
    background: '#f7f5ef', foreground: '#60361d', card: '#ffffff', cardForeground: '#60361d',
    primary: '#9a532d', primaryForeground: '#ffffff', secondary: '#f0e8dc', secondaryForeground: '#784329',
    muted: '#f0ede6', mutedForeground: '#8c7a68', accent: '#f0e1ca', accentForeground: '#784329',
    destructive: '#a12e1c', destructiveForeground: '#ffffff', border: '#e6dfd3', input: '#ded5c8',
    gold: '#c9a45b', heroStart: '#70402b', heroMiddle: '#9a532d', heroEnd: '#c18a4a',
    bead: '#e1d4c3', success: '#496a3c',
  },
  dark: {
    background: '#211a19', foreground: '#f8e9d4', card: '#302522', cardForeground: '#f8e9d4',
    primary: '#ffcb7c', primaryForeground: '#382116', secondary: '#433027', secondaryForeground: '#f8e9d4',
    muted: '#43372f', mutedForeground: '#c3a68a', accent: '#59402d', accentForeground: '#ffcb7c',
    destructive: '#e67a63', destructiveForeground: '#211a19', border: '#514037', input: '#655043',
    gold: '#ffcb7c', heroStart: '#241817', heroMiddle: '#63331e', heroEnd: '#a35b29',
    bead: '#59483a', success: '#9ac58a',
  },
};

const colors = {
  light: palettes.saffron,
  dark: palettes.dark,
  radius: 18,
};

export default colors;
