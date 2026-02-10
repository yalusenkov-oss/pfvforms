import { DistributionData, PromoData, PromoCode } from './types';

// No embedded mock distributions/promos — admin should use real Google Sheets data.

const STORAGE_KEY_DIST = 'pfvmusic_distributions';
const STORAGE_KEY_PROMO = 'pfvmusic_promos';
const STORAGE_KEY_PROMO_CODES = 'pfvmusic_promo_codes';
const STORAGE_KEY_AUTH = 'pfvmusic_auth';
const STORAGE_VERSION_KEY = 'pfvmusic_version';
const CURRENT_VERSION = '7';

// ===== Auth =====
const ADMIN_LOGIN = 'adminlusenkov';
const ADMIN_PASSWORD = 'POMOGIRILLlisayaboshka3434,';

export function authenticate(login: string, password: string): boolean {
  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ loggedIn: true, timestamp: Date.now() }));
    return true;
  }
  return false;
}

export function isAuthenticated(): boolean {
  try {
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEY_AUTH) || '{}');
    return auth.loggedIn === true;
  } catch {
    return false;
  }
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

// No embedded mock data — admin uses real data from Google Sheets

function initStorage() {
  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.removeItem(STORAGE_KEY_DIST);
    localStorage.removeItem(STORAGE_KEY_PROMO);
    localStorage.removeItem(STORAGE_KEY_PROMO_CODES);
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
  }
  // Do not seed storage with mock data — admin should use real Google Sheets as data source.
}

export function getDistributions(): DistributionData[] {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEY_DIST) || '[]');
}

export function getPromos(): PromoData[] {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEY_PROMO) || '[]');
}

export function updateDistributionStatus(id: string, status: DistributionData['status']) {
  const data = getDistributions();
  const idx = data.findIndex(d => d.id === id);
  if (idx !== -1) {
    data[idx].status = status;
    localStorage.setItem(STORAGE_KEY_DIST, JSON.stringify(data));
  }
}

export function updateDistributionContractNumber(id: string, contractNumber: string) {
  const data = getDistributions();
  const idx = data.findIndex(d => d.id === id);
  if (idx !== -1) {
    data[idx].contractNumber = contractNumber;
    localStorage.setItem(STORAGE_KEY_DIST, JSON.stringify(data));
  }
}

export function updatePromoStatus(id: string, status: PromoData['status']) {
  const data = getPromos();
  const idx = data.findIndex(d => d.id === id);
  if (idx !== -1) {
    data[idx].status = status;
    localStorage.setItem(STORAGE_KEY_PROMO, JSON.stringify(data));
  }
}

export function deleteDistribution(id: string) {
  const data = getDistributions().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY_DIST, JSON.stringify(data));
}

export function deletePromo(id: string) {
  const data = getPromos().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY_PROMO, JSON.stringify(data));
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY_DIST);
  localStorage.removeItem(STORAGE_KEY_PROMO);
  localStorage.removeItem(STORAGE_KEY_PROMO_CODES);
  initStorage();
}

// ===== Promo Codes CRUD =====
export function getPromoCodes(): PromoCode[] {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEY_PROMO_CODES) || '[]');
}

export function addPromoCode(code: PromoCode) {
  const data = getPromoCodes();
  data.push(code);
  localStorage.setItem(STORAGE_KEY_PROMO_CODES, JSON.stringify(data));
}

export function updatePromoCode(id: string, updates: Partial<PromoCode>) {
  const data = getPromoCodes();
  const idx = data.findIndex(c => c.id === id);
  if (idx !== -1) {
    data[idx] = { ...data[idx], ...updates };
    localStorage.setItem(STORAGE_KEY_PROMO_CODES, JSON.stringify(data));
  }
}

export function deletePromoCode(id: string) {
  const data = getPromoCodes().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY_PROMO_CODES, JSON.stringify(data));
}

export function togglePromoCodeActive(id: string) {
  const data = getPromoCodes();
  const idx = data.findIndex(c => c.id === id);
  if (idx !== -1) {
    data[idx].isActive = !data[idx].isActive;
    localStorage.setItem(STORAGE_KEY_PROMO_CODES, JSON.stringify(data));
  }
}
