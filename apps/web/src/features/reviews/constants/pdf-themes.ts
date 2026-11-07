export interface PdfTheme {
  id: string;
  name: string;
  category: string;
  description: string;
  paperBg: string;
  textPrimary: string;
  textMuted: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  headingFont: string;
  bodyFont: string;
  swatchColors: [string, string, string];
}

export const PDF_THEMES: PdfTheme[] = [
  {
    id: 'editorial',
    name: 'Evolyn Editorial',
    category: 'Signature Luxury',
    description: 'Warm ivory background, forest sage accents, and classic editorial typography.',
    paperBg: '#FAF8F3',
    textPrimary: '#25251F',
    textMuted: '#68745D',
    accentColor: '#4E6B54',
    badgeBg: '#E8EBE1',
    badgeText: '#3B5341',
    borderColor: '#E5E1D8',
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Inter', system-ui, -apple-system, sans-serif",
    swatchColors: ['#FAF8F3', '#4E6B54', '#68745D'],
  },
  {
    id: 'corporate',
    name: 'Corporate Executive',
    category: 'Enterprise & Finance',
    description: 'Crisp white paper, deep navy blue headings, and authoritative structure.',
    paperBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textMuted: '#475569',
    accentColor: '#1E3A8A',
    badgeBg: '#EFF6FF',
    badgeText: '#1D4ED8',
    borderColor: '#CBD5E1',
    headingFont: "'Inter', system-ui, -apple-system, sans-serif",
    bodyFont: "'Inter', system-ui, -apple-system, sans-serif",
    swatchColors: ['#FFFFFF', '#1E3A8A', '#3B82F6'],
  },
  {
    id: 'minimal',
    name: 'Modern Charcoal',
    category: 'SaaS & Minimalist',
    description: 'High contrast monochrome styling with clean architectural spacing.',
    paperBg: '#FFFFFF',
    textPrimary: '#18181B',
    textMuted: '#71717A',
    accentColor: '#27272A',
    badgeBg: '#F4F4F5',
    badgeText: '#18181B',
    borderColor: '#E4E4E7',
    headingFont: "'Inter', system-ui, -apple-system, sans-serif",
    bodyFont: "'Inter', system-ui, -apple-system, sans-serif",
    swatchColors: ['#FFFFFF', '#18181B', '#71717A'],
  },
  {
    id: 'terracotta',
    name: 'Warm Terracotta',
    category: 'Creative & Marketing',
    description: 'Soft warm sand background with terracotta accents and friendly voice.',
    paperBg: '#FDFBF7',
    textPrimary: '#262626',
    textMuted: '#78716C',
    accentColor: '#C25E43',
    badgeBg: '#FFEDD5',
    badgeText: '#9A3412',
    borderColor: '#E7E5E4',
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Inter', system-ui, -apple-system, sans-serif",
    swatchColors: ['#FDFBF7', '#C25E43', '#D97706'],
  },
];
