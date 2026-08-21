// Hazmon Types - Collectible Hazard Creature System

export type GHSCategory = 
  | 'flammable'
  | 'oxidizing'
  | 'explosive'
  | 'corrosive'
  | 'acute-toxic'
  | 'health-hazard'
  | 'irritant'
  | 'environment'
  | 'compressed-gas';

export type HazmonRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type HazmonElement = 
  | 'fire'
  | 'plasma'
  | 'blast'
  | 'acid'
  | 'toxin'
  | 'bio'
  | 'sting'
  | 'nature-corrupt'
  | 'pressure';

export interface HazmonData {
  id: string;
  name: string;
  subtitle: string;
  element: HazmonElement;
  rarity: HazmonRarity;
  ghsCategory: GHSCategory;
  powerLevel: number; // 1-5, from AI safety score
  primaryColor: string;
  secondaryColor: string;
  iconEmoji: string; // temporary until we have custom artwork
  dexNumber: number; // 1-9, fixed position in the Hazdex
  typeLabel: string; // human-readable element name for the card's type chip
  artworkPath?: string; // Path to custom artwork: /hazmon/{id}.jpeg
}

export interface HazmonCard extends HazmonData {
  // Real data from scan
  discoveredFrom: string; // Product name from OCR
  ghsFact: string; // Real GHS hazard statement
  safetyRecommendation: string; // PPE recommendation
  discoveredAt: string; // ISO timestamp
  location?: {
    lat: number;
    lng: number;
    label?: string;
  };
  // Gamification data
  isMastered: boolean; // User completed safety quiz
  timesEncountered: number;
  // Custom image
  customImageUrl?: string; // Optional custom image uploaded by user
}

export interface HazdexEntry {
  userId: string;
  hazmonId: string;
  firstDiscoveredAt: string;
  lastEncounteredAt: string;
  timesEncountered: number;
  isMastered: boolean;
  masteredAt?: string;
  scans: HazmonScanRecord[];
}

export interface HazmonScanRecord {
  scanId: string;
  productName: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    label?: string;
  };
  safetyScore: number;
}

export interface CombinationAlert {
  id: string;
  hazmon1: HazmonData;
  hazmon2: HazmonData;
  warningMessage: string;
  severity: 'warning' | 'danger' | 'critical';
  safeProcedure: string;
}

// Hazmon master data
export const HAZMON_DATABASE: Record<GHSCategory, HazmonData> = {
  'flammable': {
    id: 'ignivore',
    name: 'Ignivore',
    subtitle: 'The Wild Firestarter',
    element: 'fire',
    rarity: 'common',
    ghsCategory: 'flammable',
    powerLevel: 3,
    primaryColor: '#FF4500',
    secondaryColor: '#FFA500',
    iconEmoji: '🔥',
    dexNumber: 1,
    typeLabel: 'Fire',
    artworkPath: '/hazmon/ignivore.jpeg',
  },
  'oxidizing': {
    id: 'oxidrax',
    name: 'Oxidrax',
    subtitle: 'The Flame Accelerator',
    element: 'plasma',
    rarity: 'uncommon',
    ghsCategory: 'oxidizing',
    powerLevel: 4,
    primaryColor: '#FFEB3B',
    secondaryColor: '#FFFFFF',
    iconEmoji: '⚡',
    dexNumber: 2,
    typeLabel: 'Plasma',
    artworkPath: '/hazmon/oxidrax.jpeg',
  },
  'explosive': {
    id: 'detonyx',
    name: 'Detonyx',
    subtitle: 'The Unpredictable Blast',
    element: 'blast',
    rarity: 'rare',
    ghsCategory: 'explosive',
    powerLevel: 5,
    primaryColor: '#FF6B00',
    secondaryColor: '#1A1A1A',
    iconEmoji: '💥',
    dexNumber: 3,
    typeLabel: 'Blast',
    artworkPath: '/hazmon/detonyx.jpeg',
  },
  'corrosive': {
    id: 'corrolith',
    name: 'Corrolith',
    subtitle: 'The Surface Eater',
    element: 'acid',
    rarity: 'uncommon',
    ghsCategory: 'corrosive',
    powerLevel: 4,
    primaryColor: '#7CB342',
    secondaryColor: '#558B2F',
    iconEmoji: '🧪',
    dexNumber: 4,
    typeLabel: 'Acid',
    artworkPath: '/hazmon/corrolith.jpeg',
  },
  'acute-toxic': {
    id: 'venomask',
    name: 'Venomask',
    subtitle: 'The Lethal Poison',
    element: 'toxin',
    rarity: 'rare',
    ghsCategory: 'acute-toxic',
    powerLevel: 5,
    primaryColor: '#6A1B9A',
    secondaryColor: '#4A148C',
    iconEmoji: '☠️',
    dexNumber: 5,
    typeLabel: 'Toxin',
    artworkPath: '/hazmon/venomask.jpeg',
  },
  'health-hazard': {
    id: 'pulmonar',
    name: 'Pulmonar',
    subtitle: 'The Hidden Threat',
    element: 'bio',
    rarity: 'epic',
    ghsCategory: 'health-hazard',
    powerLevel: 4,
    primaryColor: '#546E7A',
    secondaryColor: '#37474F',
    iconEmoji: '🫁',
    dexNumber: 6,
    typeLabel: 'Bio',
    artworkPath: '/hazmon/pulmonar.jpeg',
  },
  'irritant': {
    id: 'itchling',
    name: 'Itchling',
    subtitle: 'The Skin Provoker',
    element: 'sting',
    rarity: 'common',
    ghsCategory: 'irritant',
    powerLevel: 2,
    primaryColor: '#FFF59D',
    secondaryColor: '#FFEE58',
    iconEmoji: '⚠️',
    dexNumber: 7,
    typeLabel: 'Sting',
    artworkPath: '/hazmon/itchling.jpeg',
  },
  'environment': {
    id: 'aquabane',
    name: 'Aquabane',
    subtitle: 'The Ecosystem Breaker',
    element: 'nature-corrupt',
    rarity: 'rare',
    ghsCategory: 'environment',
    powerLevel: 3,
    primaryColor: '#00897B',
    secondaryColor: '#004D40',
    iconEmoji: '🐟',
    dexNumber: 8,
    typeLabel: 'Nature',
    artworkPath: '/hazmon/aquabane.jpeg',
  },
  'compressed-gas': {
    id: 'pressuron',
    name: 'Pressuron',
    subtitle: 'The Pent-Up Force',
    element: 'pressure',
    rarity: 'uncommon',
    ghsCategory: 'compressed-gas',
    powerLevel: 3,
    primaryColor: '#00BCD4',
    secondaryColor: '#0097A7',
    iconEmoji: '💨',
    dexNumber: 9,
    typeLabel: 'Pressure',
    artworkPath: '/hazmon/pressuron.jpeg',
  },
};

// Total number of discoverable Hazmons — used for Hazdex numbering (e.g. "04/09")
export const HAZMON_TOTAL = Object.keys(HAZMON_DATABASE).length;

// Rarity descriptions
export const RARITY_DESCRIPTIONS: Record<HazmonRarity, string> = {
  common: 'Frequently encountered — but never safe to ignore.',
  uncommon: 'Fairly rare in most everyday work areas.',
  rare: 'A rare find. Double-check this label before handling.',
  epic: 'A long-term health hazard — never underestimate it.',
};

// Dangerous chemical combinations
export const HAZARDOUS_COMBINATIONS: CombinationAlert[] = [
  {
    id: 'corrosive-oxidizing',
    hazmon1: HAZMON_DATABASE.corrosive,
    hazmon2: HAZMON_DATABASE.oxidizing,
    warningMessage: 'Corrosive + oxidizing combinations can trigger a dangerous exothermic reaction!',
    severity: 'critical',
    safeProcedure: 'Store in separate areas with independent ventilation. Never mix or store these near each other.',
  },
  {
    id: 'flammable-oxidizing',
    hazmon1: HAZMON_DATABASE.flammable,
    hazmon2: HAZMON_DATABASE.oxidizing,
    warningMessage: 'Oxidizers accelerate the combustion of flammable materials!',
    severity: 'critical',
    safeProcedure: 'Keep a minimum distance of 6 meters. Use separate storage cabinets with independent ventilation.',
  },
  {
    id: 'toxic-corrosive',
    hazmon1: HAZMON_DATABASE['acute-toxic'],
    hazmon2: HAZMON_DATABASE.corrosive,
    warningMessage: 'Toxic + corrosive combinations can release poisonous gas!',
    severity: 'danger',
    safeProcedure: 'Avoid contact entirely. Use a fume hood when handling. Full PPE is mandatory.',
  },
];

// Look up any hazardous combination a given category is part of — used
// to populate the "Weakness" column on the Hazmon card.
export function getWeaknessFor(category: GHSCategory): HazmonData | null {
  const match = HAZARDOUS_COMBINATIONS.find(
    (combo) => combo.hazmon1.ghsCategory === category || combo.hazmon2.ghsCategory === category
  );
  if (!match) return null;
  return match.hazmon1.ghsCategory === category ? match.hazmon2 : match.hazmon1;
}
