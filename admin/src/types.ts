// ===== Distribution Types =====
export interface TrackData {
  id: string;
  name: string;
  version: string;
  artists: ArtistEntry[];
  lyricists: string[];
  composers: string[];
  explicit: boolean;
  substances: boolean;
  lyrics: string;
}

export interface ArtistEntry {
  name: string;
  separator: ',' | 'feat.';
}

export interface DistributionData {
  // Step 1
  tariff: 'basic' | 'advanced' | 'premium' | 'platinum';
  releaseType: 'single' | 'ep' | 'album';
  releaseName: string;
  mainArtist: string;
  releaseVersion: string;
  releaseLink: string;
  genre: string;
  language: string;
  releaseDate: string;
  coverLink: string;
  tracks: TrackData[];
  tiktokStart: string;
  tiktokFull: boolean;
  preSaveYandex: boolean;
  karaoke: boolean;
  // Step 2
  fullName: string;
  passportSeries: string;
  passportIssuedBy: string;
  passportIssuedDate: string;
  bankDetails: string;
  email: string;
  // Step 3
  consentAccepted: boolean;
  // Step 4
  contacts: string;
  artistProfileLinks: string;
  // Meta
  submittedAt: string;
  status: 'new' | 'in_progress' | 'paid' | 'released' | 'rejected';
  id: string;
  totalPrice: number;
  contractNumber?: string;
  rowIndex?: number;
  signStatus?: string;
  signLink?: string;
  signExpiresAt?: string;
  signedUrl?: string;
  signedAt?: string;
}

// ===== Promo Types =====
export interface DetailedPromoData {
  type: 'detailed';
  trackLink: string;
  upc: string;
  releaseDate: string;
  genre: string;
  artistAndTitle: string;
  releaseDescription: string;
  artistInfo: string;
  artistPhotos: string;
  socialLinks: string;
  focusTrack: string;
  additionalInfo: string;
  contacts: string;
  submittedAt: string;
  id: string;
  status: 'new' | 'in_progress' | 'done' | 'rejected';
  rowIndex?: number;
}

export interface WeeklyPromoData {
  type: 'weekly';
  trackLink: string;
  upc: string;
  releaseDate: string;
  genre: string;
  focusTrack: string;
  additionalInfo: string;
  contacts: string;
  submittedAt: string;
  id: string;
  status: 'new' | 'in_progress' | 'done' | 'rejected';
  rowIndex?: number;
}

export type PromoData = DetailedPromoData | WeeklyPromoData;

// ===== Promo Code Types =====
export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  applicableTariffs: ('basic' | 'advanced' | 'premium' | 'platinum')[];
  applicableReleaseTypes: ('single' | 'ep' | 'album')[];
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  description: string;
  rowIndex?: number;
}

// ===== Admin Types =====
export type AdminTab = 'dashboard' | 'distributions' | 'promos' | 'promocodes' | 'settings';

export interface DashboardStats {
  totalDistributions: number;
  totalPromos: number;
  newOrders: number;
  totalRevenue: number;
  recentDistributions: DistributionData[];
  recentPromos: PromoData[];
}

export const TARIFF_LABELS: Record<string, string> = {
  basic: 'Базовый',
  advanced: 'Продвинутый',
  premium: 'Премиум',
  platinum: 'Платинум',
};

export const RELEASE_TYPE_LABELS: Record<string, string> = {
  single: 'Сингл',
  ep: 'EP',
  album: 'Альбом',
};

export const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  paid: 'Оплачен',
  released: 'Выпущен',
  rejected: 'Отклонён',
  done: 'Готово',
};

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  released: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export const PRICES: Record<string, Record<string, number>> = {
  basic: { single: 500, ep: 700, album: 900 },
  advanced: { single: 690, ep: 890, album: 1200 },
  premium: { single: 1200, ep: 1690, album: 2290 },
  platinum: { single: 4990, ep: 6490, album: 7990 },
};

export const KARAOKE_PRICES: Record<string, number> = {
  basic: 350,
  advanced: 195,
  premium: 140,
  platinum: 0,
};

export const TARIFF_PERCENTAGES: Record<string, number> = {
  basic: 55,
  advanced: 70,
  premium: 90,
  platinum: 95,
};
