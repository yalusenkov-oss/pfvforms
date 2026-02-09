// Google Sheets Integration Service
// Этот сервис отправляет данные форм в Google Таблицы через Google Apps Script

// URL вашего Google Apps Script (замените на свой после создания)
// Рекомендуем задать через переменную окружения VITE_GOOGLE_SCRIPT_URL
// Создайте файл .env в корне проекта с содержимым:
// VITE_GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/ВАШ_ID/exec"
// Vite сделает переменную доступной через import.meta.env
// import.meta.env typing differs between TS setups; cast to any to avoid type errors here
const GOOGLE_SCRIPT_URL = ((import.meta as any)?.env?.VITE_GOOGLE_SCRIPT_URL as string) || '';

interface SubmitResponse {
  success: boolean;
  message: string;
  row?: number;
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

  const tariff = formData.tariff || 'basic';
  const releaseType = formData.releaseType || 'single';
  const trackCount = parseInt(formData.trackCount || '1', 10);
  const addKaraoke = formData.addKaraoke === 'yes';

  const basePrice = prices[tariff]?.[releaseType] || 0;
  const karaokePrice = addKaraoke ? karaokePrices[tariff] * trackCount : 0;
  const totalPrice = basePrice + karaokePrice;

  return {
    formType: 'distribution',
    timestamp: new Date().toISOString(),
    
    // Тариф и тип
    tariff: formData.tariff,
    releaseType: formData.releaseType,
    trackCount: trackCount,
    
    // Информация о релизе
    releaseName: formData.releaseName,
    mainArtist: formData.mainArtist,
    releaseVersion: formData.releaseVersion,
    releaseLink: formData.releaseLink,
    genre: formData.genre,
    language: formData.language,
    releaseDate: formData.releaseDate,
    coverLink: formData.coverLink,
    
    // TikTok
    tiktokExcerpt: formData.tiktokExcerpt,
    tiktokFull: formData.tiktokFull,
    
    // Яндекс
    yandexPreSave: formData.yandexPreSave,
    
    // Караоке
    addKaraoke: formData.addKaraoke,
    
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
  };
}

// Подготовка данных промо для отправки
export function preparePromoData(promoData: Record<string, string>): Record<string, unknown> {
  return {
    formType: 'promo',
    timestamp: new Date().toISOString(),
    
    // Тип промо
    promoType: promoData.promoType,
    
    // Общие поля
    releaseLink: promoData.releaseLink,
    upcOrName: promoData.upcOrName,
    releaseDate: promoData.releaseDate,
    genre: promoData.genre,
    focusTrack: promoData.focusTrack,
    additionalInfo: promoData.additionalInfo,
    
    // Только для детального промо
    artistAndTitle: promoData.artistAndTitle,
    releaseDescription: promoData.releaseDescription,
    artistInfo: promoData.artistInfo,
    artistPhotos: promoData.artistPhotos,
    socialLinks: promoData.socialLinks,
    
    // Контакты
    contactInfo: promoData.contactInfo,
  };
}

// Отправка данных в Google Sheets
export async function submitToGoogleSheets(
  formType: FormType,
  data: Record<string, string>
): Promise<SubmitResponse> {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Google Script URL not configured. Data not sent.');
    return {
      success: true,
      message: 'Форма отправлена (тестовый режим - Google Sheets не настроен)',
    };
  }

  const preparedData = formType === 'distribution' 
    ? prepareDistributionData(data)
    : preparePromoData(data);

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script требует no-cors
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preparedData),
    });

    // При no-cors мы не можем прочитать ответ, но запрос отправлен
    return {
      success: true,
      message: 'Данные успешно отправлены',
    };
  } catch (error) {
    console.error('Error submitting to Google Sheets:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка отправки данных',
    };
  }
}

// Экспорт для использования в компонентах
export default {
  submitToGoogleSheets,
  prepareDistributionData,
  preparePromoData,
};
