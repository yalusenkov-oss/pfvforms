// Google Sheets Integration Service
// Этот сервис отправляет данные форм в Google Таблицы через Google Apps Script

// URL вашего Google Apps Script (замените на свой после создания)
// Рекомендуем задать через переменную окружения VITE_GOOGLE_SCRIPT_URL
// Создайте файл .env в корне проекта с содержимым:
// VITE_GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/ВАШ_ID/exec"
// Vite сделает переменную доступной через import.meta.env
// import.meta.env typing differs between TS setups; cast to any to avoid type errors here

// Вспомогательная функция для вычисления количества треков (совпадает с логикой из StepOne)
function getTrackCount(data: Record<string, string>): number {
  const type = data.releaseType;
  if (type === 'Single') return data.singleTrackCount === '2' ? 2 : 1;
  if (type === 'EP') return parseInt(data.epTrackCount || '3', 10);
  if (type === 'Album') return parseInt(data.albumTrackCount || '6', 10);
  return 1;
}

// Функция для получения URL (читает переменную при вызове).
// Попытки (в порядке): import.meta.env -> window global -> /config.json
let _cachedGoogleScriptUrl: string | null = null;
async function getGoogleScriptUrl(): Promise<string> {
  if (_cachedGoogleScriptUrl) return _cachedGoogleScriptUrl;

  // 1) try Vite-provided import.meta.env (replaced at build time)
  try {
    const envUrl = ((import.meta as any)?.env?.VITE_GOOGLE_SCRIPT_URL as string) || '';
    if (envUrl) {
      _cachedGoogleScriptUrl = envUrl;
      console.log('DEBUG getGoogleScriptUrl(): from import.meta.env', envUrl);
      return envUrl;
    }
  } catch (e) {
    // ignore
  }

  // 2) try global window variable (injected via public/config.js or similar)
  try {
    // @ts-ignore
    const w = (window as any);
    if (w && w.VITE_GOOGLE_SCRIPT_URL) {
      _cachedGoogleScriptUrl = String(w.VITE_GOOGLE_SCRIPT_URL);
      console.log('DEBUG getGoogleScriptUrl(): from window.VITE_GOOGLE_SCRIPT_URL', _cachedGoogleScriptUrl);
      return _cachedGoogleScriptUrl;
    }
  } catch (e) {
    // ignore
  }

  // 3) try to fetch /config.json (served from public/)
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) {
      const obj = await res.json();
      if (obj && obj.VITE_GOOGLE_SCRIPT_URL) {
        _cachedGoogleScriptUrl = String(obj.VITE_GOOGLE_SCRIPT_URL);
        console.log('DEBUG getGoogleScriptUrl(): from /config.json', _cachedGoogleScriptUrl);
        return _cachedGoogleScriptUrl;
      }
    }
  } catch (e) {
    // ignore
  }

  console.log('DEBUG getGoogleScriptUrl(): no URL found');
  return '';
}

interface SubmitResponse {
  success: boolean;
  message: string;
  row?: number;
}

export interface PromoCodeRecord {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  applicableTariffs: string[];
  applicableReleaseTypes: string[];
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  description: string;
}

// Типы форм
type FormType = 'distribution' | 'promo';

// Подготовка данных дистрибуции для отправки
export function prepareDistributionData(formData: Record<string, string>): Record<string, unknown> {
  // Парсим треки из JSON
  let tracks: Array<Record<string, unknown>> = [];
  try {
    if (formData._tracks) {
      tracks = JSON.parse(formData._tracks);
    }
  } catch (e) {
    console.error('Error parsing tracks:', e);
  }

  // Форматируем треки для таблицы
  const tracksFormatted = tracks.map((track, index) => {
    const artists = (track.artists as Array<{ name: string; type: string }>)
      ?.map((a, i) => {
        if (i === 0) return a.name;
        return a.type === 'feat' ? `feat. ${a.name}` : `, ${a.name}`;
      })
      .join('') || '';

    return {
      number: index + 1,
      name: track.name || '',
      version: track.version || '',
      artists: artists,
      lyricists: (track.lyricists as string[])?.join(', ') || '',
      composers: (track.composers as string[])?.join(', ') || '',
      explicitContent: track.explicitContent || '',
      substanceMention: track.substanceMention || '',
      lyrics: track.lyrics || '',
    };
  });

  // Рассчитываем итоговую сумму
  // Маппинг русских названий тарифов на английские ключи для Apps Script
  const tariffMap: Record<string, string> = {
    'Базовый': 'basic',
    'Продвинутый': 'advanced',
    'Премиум': 'premium',
    'Платинум': 'platinum',
  };
  
  // Маппинг русских названий типов релизов на английские ключи
  const releaseTypeMap: Record<string, string> = {
    'Single': 'single',
    'EP': 'ep',
    'Album': 'album',
  };

  const prices: Record<string, Record<string, number>> = {
    basic: { single: 500, ep: 700, album: 900 },
    advanced: { single: 690, ep: 890, album: 1200 },
    premium: { single: 1200, ep: 1690, album: 2290 },
    platinum: { single: 4990, ep: 6490, album: 7990 },
  };

  const karaokePrices: Record<string, number> = {
    basic: 350,
    advanced: 195,
    premium: 140,
    platinum: 0,
  };

  const tariffRu = formData.tariff || '';
  const tariff = tariffMap[tariffRu] || 'basic';
  const releaseTypeRu = formData.releaseType || '';
  const releaseType = releaseTypeMap[releaseTypeRu] || 'single';
  // Используем функцию getTrackCount для правильного вычисления количества треков
  const trackCount = getTrackCount(formData);
  // В форме используется karaokeAddition со значениями "Да"/"Нет"
  const addKaraoke = formData.karaokeAddition === 'Да';

  const basePrice = prices[tariff]?.[releaseType] || 0;
  const karaokePrice = addKaraoke ? karaokePrices[tariff] * trackCount : 0;
  let totalPrice = basePrice + karaokePrice;

  const promoApplied = formData.promoApplied === 'yes';
  const promoDiscountType = formData.promoDiscountType || '';
  const promoDiscountValue = parseFloat(formData.promoDiscountValue || '0');
  if (promoApplied && promoDiscountValue > 0) {
    const rawDiscount = promoDiscountType === 'percent'
      ? Math.round(totalPrice * (promoDiscountValue / 100))
      : Math.round(promoDiscountValue);
    const discountAmount = Math.min(totalPrice, Math.max(0, rawDiscount));
    totalPrice = totalPrice - discountAmount;
  }

  return {
    formType: 'distribution',
    timestamp: new Date().toISOString(),
    
    // Тариф и тип (используем английские ключи для Apps Script)
    tariff: tariff,
    releaseType: releaseType,
    trackCount: trackCount,
    
    // Информация о релизе
    releaseName: formData.releaseName,
    mainArtist: formData.mainArtist,
    releaseVersion: formData.releaseVersion,
    releaseLink: formData.releaseLink,
    genre: formData.genre,
    // Если указан languageOther, используем его, иначе language
    language: formData.languageOther?.trim() || formData.language || '',
    releaseDate: formData.releaseDate,
    coverLink: formData.coverLink,
    
    // TikTok
    tiktokExcerpt: formData.tiktokExcerpt,
    tiktokFull: formData.tiktokFull,
    
    // Яндекс
    yandexPreSave: formData.yandexPreSave,
    
    // Караоке (конвертируем "Да"/"Нет" в "yes"/"no" для Apps Script)
    addKaraoke: formData.karaokeAddition === 'Да' ? 'yes' : 'no',
    
    // Треки (JSON для сложных данных)
    tracks: JSON.stringify(tracksFormatted, null, 2),
    
    // Договор
    fullName: formData.fullName,
    passportNumber: formData.passportNumber,
    issuedBy: formData.issuedBy,
    issueDate: formData.issueDate,
    bankDetails: formData.bankDetails,
    email: formData.email,
    
    // Контакты
    contactInfo: formData.contactInfo,
    artistProfileLinks: formData.artistProfileLinks,
    
    // Цены
    basePrice: basePrice,
    karaokePrice: karaokePrice,
    totalPrice: totalPrice,
    promoCode: formData.promoCode || '',
    promoDiscountType: formData.promoDiscountType || '',
    promoDiscountValue: formData.promoDiscountValue || '',
    promoDiscountAmount: formData.promoDiscountAmount || '',
  };
}

export async function fetchPromoCodes(): Promise<PromoCodeRecord[] | null> {
  const url = await getGoogleScriptUrl();
  if (!url) return null;

  let final = url;
  try {
    const u = new URL(url);
    u.searchParams.set('action', 'list');
    u.searchParams.set('sheet', 'promocodes');
    final = u.toString();
  } catch {
    final = `${url}${url.includes('?') ? '&' : '?'}action=list&sheet=promocodes`;
  }

  const res = await fetch(final, { method: 'GET', redirect: 'follow' });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} when fetching promo codes: ${text.slice(0, 300)}`);

  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Response was not valid JSON: ${text.slice(0, 300)}`);
  }

  const rows = Array.isArray(json) ? json : Array.isArray(json?.rows) ? json.rows : null;
  if (!rows) return null;

  const toArray = (v: any) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map((s: any) => String(s).trim()).filter(Boolean);
    return String(v).split(',').map(s => s.trim()).filter(Boolean);
  };
  const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 'Да' || v === 'yes';
  const toNum = (v: any) => typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.-]/g, '')) || 0;

  return rows.map((r: any) => ({
    id: String(r.id || r.ID || ''),
    code: String(r.code || r.promo_code || '').toUpperCase(),
    discountType: (r.discountType || r.discount_type || 'percent') as 'percent' | 'fixed',
    discountValue: toNum(r.discountValue ?? r.discount_value),
    applicableTariffs: toArray(r.applicableTariffs || r.applicable_tariffs),
    applicableReleaseTypes: toArray(r.applicableReleaseTypes || r.applicable_release_types),
    maxUses: toNum(r.maxUses ?? r.max_uses),
    currentUses: toNum(r.currentUses ?? r.current_uses),
    isActive: toBool(r.isActive ?? r.is_active),
    validFrom: String(r.validFrom || r.valid_from || ''),
    validUntil: String(r.validUntil || r.valid_until || ''),
    createdAt: String(r.createdAt || r.created_at || ''),
    description: String(r.description || ''),
  }));
}

// Подготовка данных промо для отправки
export function preparePromoData(promoData: Record<string, string>): Record<string, unknown> {
  const promoType = promoData.promoType;
  
  // Для детального промо используем поля с префиксом "promo"
  // Для еженедельного промо используем поля с префиксом "promoWeekly"
  if (promoType === 'detailed') {
    return {
      formType: 'promo',
      timestamp: new Date().toISOString(),
      
      // Тип промо
      promoType: promoData.promoType,
      
      // Общие поля для детального промо
      releaseLink: promoData.promoReleaseLink || '',
      upcOrName: promoData.promoUPC || '',
      releaseDate: promoData.promoReleaseDate || '',
      genre: promoData.promoGenre || '',
      focusTrack: promoData.promoFocusTrack || '',
      additionalInfo: promoData.promoExtra || '',
      
      // Только для детального промо
      artistAndTitle: promoData.promoArtistTitle || '',
      releaseDescription: promoData.promoDescription || '',
      artistInfo: promoData.promoArtistInfo || '',
      artistPhotos: promoData.promoPhotos || '',
      socialLinks: promoData.promoSocials || '',
      
      // Контакты
      contactInfo: promoData.promoContact || '',
    };
  } else if (promoType === 'weekly') {
    return {
      formType: 'promo',
      timestamp: new Date().toISOString(),
      
      // Тип промо
      promoType: promoData.promoType,
      
      // Общие поля для еженедельного промо
      releaseLink: promoData.promoWeeklyReleaseLink || '',
      upcOrName: promoData.promoWeeklyUPC || '',
      releaseDate: promoData.promoWeeklyReleaseDate || '',
      genre: promoData.promoWeeklyGenre || '',
      focusTrack: promoData.promoWeeklyFocusTrack || '',
      additionalInfo: promoData.promoWeeklyExtra || '',
      
      // Пустые поля для еженедельного промо
      artistAndTitle: '',
      releaseDescription: '',
      artistInfo: '',
      artistPhotos: '',
      socialLinks: '',
      
      // Контакты
      contactInfo: promoData.promoContact || '',
    };
  }
  
  // Fallback
  return {
    formType: 'promo',
    timestamp: new Date().toISOString(),
    promoType: promoData.promoType || '',
    releaseLink: '',
    upcOrName: '',
    releaseDate: '',
    genre: '',
    focusTrack: '',
    additionalInfo: '',
    artistAndTitle: '',
    releaseDescription: '',
    artistInfo: '',
    artistPhotos: '',
    socialLinks: '',
    contactInfo: promoData.promoContact || '',
  };
}

// Отправка данных в Google Sheets
export async function submitToGoogleSheets(
  formType: FormType,
  data: Record<string, string>
): Promise<SubmitResponse> {
  const GOOGLE_SCRIPT_URL = await getGoogleScriptUrl();
  
  if (!GOOGLE_SCRIPT_URL) {
    console.error('Google Script URL not configured. Data not sent.');
    return {
      success: false,
      message:
        'Google Script URL not configured. Set VITE_GOOGLE_SCRIPT_URL in .env (or configure env) and restart dev server.',
    };
  }

  const preparedData = formType === 'distribution' 
    ? prepareDistributionData(data)
    : preparePromoData(data);

  // Функция-обёртка для fetch с обработкой времени ожидания
  const fetchWithTimeout = (url: string, opts: RequestInit = {}, timeout = 10000) => {
    return new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Request timed out')), timeout);
      fetch(url, opts)
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  // Попробуем отправить с небольшим числом ретраев (экспоненциальный бэкофф)
  const maxRetries = 2;
  let attempt = 0;
  let lastErr: any = null;

  while (attempt <= maxRetries) {
    try {
      // Пробуем сначала POST запрос с JSON
      // Если не работает, используем GET с данными в URL (более надежно для Google Apps Script)
      let res: Response;
      
      try {
        // Попытка POST запроса
        res = await fetchWithTimeout(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preparedData),
          redirect: 'follow',
        }, 12000);
      } catch (postError) {
        // Если POST не работает, используем GET с данными в URL
        const url = new URL(GOOGLE_SCRIPT_URL);
        url.searchParams.set('data', JSON.stringify(preparedData));
        res = await fetchWithTimeout(url.toString(), {
          method: 'GET',
          redirect: 'follow',
        }, 12000);
      }

      // Ожидаем JSON-ответ от Apps Script
      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        // если не JSON — вернём текст
        json = { success: res.ok, message: text || res.statusText };
      }

      if (!res.ok) {
        // Небольшая полезная информация для отладки
        const msg = json && json.error ? json.error : json && json.message ? json.message : `HTTP ${res.status}`;
        return { success: false, message: `Server error: ${msg}` };
      }

      // Если сервер вернул JSON { success: true } — используем его
      if (json && typeof json === 'object') {
        return {
          success: !!json.success,
          message: json.message || 'Данные успешно отправлены',
          row: json.row,
        };
      }

      // По умолчанию считаем успехом, если HTTP 2xx
      return { success: true, message: 'Данные успешно отправлены' };

    } catch (err) {
      lastErr = err;
      attempt += 1;
      // Ждём перед ретраем (экспоненциальный бэкофф)
      const waitMs = 500 * Math.pow(2, attempt);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  console.error('Error submitting to Google Sheets (all retries):', lastErr);
  return {
    success: false,
    message: lastErr instanceof Error ? lastErr.message : 'Ошибка отправки данных (retries exhausted)',
  };
}

// Экспорт для использования в компонентах
export default {
  submitToGoogleSheets,
  prepareDistributionData,
  preparePromoData,
};
