import { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Send, CheckCircle2, FileText, Shield, CreditCard, Disc3, Sparkles, AlertCircle, Megaphone, ArrowLeft, XCircle, Clock, ExternalLink, Home, Loader2, Wallet, Clipboard, FileCheck, Phone } from 'lucide-react';
import { cn } from '@/utils/cn';
import { StepOne, getTrackCount } from './components/StepOne';
import { StepTwo } from './components/StepTwo';
import { StepThree } from './components/StepThree';
import { StepFour } from './components/StepFour';
import { StepPromo } from './components/StepPromo';
import { submitToGoogleSheets } from './services/googleSheets';
import SignPage from './pages/Sign';

type AppMode = 'home' | 'distribution' | 'promo' | 'success' | 'fail' | 'result' | 'sign';

const DISTRIBUTION_STEPS = [
  { id: 1, label: 'Релиз', icon: Disc3 },
  { id: 2, label: 'Договор', icon: FileText },
  { id: 3, label: 'Оферта', icon: Shield },
  { id: 4, label: 'Оплата', icon: CreditCard },
];

type TariffInfo = {
  name: string;
  subtitle: string;
  turnaround: string;
  recommended?: boolean;
  cardClass: string;
  titleClass: string;
  prices: string[];
  features: string[];
  monetization: string[];
  icon: 'music' | 'trending' | 'star' | 'crown';
  emoji: string;
  badge?: string;
  accentColor: string;
};

const TARIFFS: TariffInfo[] = [
  {
    name: 'Базовый',
    subtitle: 'Старт для начинающих',
    turnaround: '7 рабочих дней',
    cardClass: 'border-purple-200 bg-white hover:border-purple-300',
    titleClass: 'text-purple-900',
    icon: 'music',
    emoji: '🎵',
    badge: 'Для начинающих',
    accentColor: 'from-purple-500 to-blue-500',
    prices: [
      'Сингл: 500 ₽',
      'EP (3-5 треков): 700 ₽',
      'Альбом (6-20 треков): 900 ₽ (+50 ₽ за каждый доп. трек)',
      'Клип/сниппет/концерт: 250 ₽',
    ],
    features: [
      'Без промо-поддержки',
      'Тексты и караоке в VK Музыке и Apple Music',
      'Оперативная техподдержка',
      'Платное изменение/удаление релиза: 250 ₽',
      'Мульти-линк: 250 ₽',
    ],
    monetization: ['Доля артиста: 55%', 'Минимальная выплата: от 1500 ₽'],
  },
  {
    name: 'Продвинутый',
    subtitle: 'Баланс цены и возможностей',
    turnaround: '4 рабочих дня',
    cardClass: 'border-sky-200 bg-white hover:border-sky-300',
    titleClass: 'text-sky-900',
    icon: 'trending',
    emoji: '📈',
    badge: 'Популярный выбор',
    accentColor: 'from-sky-500 to-cyan-500',
    prices: [
      'Сингл: 690 ₽',
      'EP (3-5 треков): 890 ₽',
      'Альбом (6-20 треков): 1200 ₽ (+50 ₽ за каждый доп. трек)',
      'Клип/сниппет/концерт: 350 ₽',
    ],
    features: [
      'Возможность подачи на промо-поддержку',
      'Тексты и караоке в VK Музыке и Яндекс Музыке (не караоке)',
      'Быстрая техподдержка',
      'Одно изменение релиза бесплатно',
      'Скидка 30% на тексты для Genius (140 ₽)',
      'Скидка 40% на караоке (195 ₽)',
      'Бесплатный мульти-линк',
      'Бесплатные консультации на всех этапах',
    ],
    monetization: ['Доля артиста: 70%', 'Минимальная выплата: от 1000 ₽'],
  },
  {
    name: 'Премиум',
    subtitle: 'Оптимальный выбор для развития',
    turnaround: '2 рабочих дня',
    recommended: true,
    cardClass: 'border-emerald-300 bg-white hover:border-emerald-400 ring-2 ring-emerald-200 ring-offset-2',
    titleClass: 'text-emerald-900',
    icon: 'star',
    emoji: '⭐',
    badge: 'Рекомендуемый',
    accentColor: 'from-emerald-500 to-teal-500',
    prices: [
      'Сингл: 1200 ₽',
      'EP (3-5 треков): 1690 ₽',
      'Альбом (6-20 треков): 2290 ₽ (+50 ₽ за каждый доп. трек)',
      'Клип/сниппет/концерт: 380 ₽',
    ],
    features: [
      'Возможность подачи в редакции площадок (промо-поддержка)',
      'Pre-Save в Яндекс Музыке',
      'Улучшенная доступность в TikTok',
      'Бесплатный ранний выпуск треков до официального релиза',
      'Тексты на Genius бесплатно',
      'Караоке со скидкой 60% (140 ₽)',
      'Бесплатное удаление и любые изменения релиза',
      'Бесплатный мульти-линк',
      'Оперативная техподдержка',
    ],
    monetization: ['Доля артиста: 90%', 'Минимальная выплата: от 500 ₽'],
  },
  {
    name: 'Платинум',
    subtitle: 'Максимум без компромиссов',
    turnaround: '1 рабочий день (до 24 часов в рабочие дни)',
    cardClass: 'border-amber-300 bg-white hover:border-amber-400',
    titleClass: 'text-amber-900',
    icon: 'crown',
    emoji: '👑',
    badge: 'Премиум',
    accentColor: 'from-amber-500 to-orange-600',
    prices: [
      'Сингл: 4990 ₽',
      'EP (3-5 треков): 6490 ₽',
      'Альбом (6-20 треков): 7990 ₽ (+50 ₽ за каждый доп. трек)',
      'Клип/сниппет/концерт: 1490 ₽',
    ],
    features: [
      'Премиальная промо-поддержка с максимальным охватом',
      'Личный менеджер: персональное сопровождение на всех этапах',
      'Возможность получения ноты YouTube (официальный артист)',
      'Бесплатно: тексты на Genius, караоке, мульти-линк',
      'Pre-Save в Яндекс Музыке + ранний выпуск треков',
      'Премиальная техподдержка',
    ],
    monetization: ['Доля артиста: 100%', 'Выплаты: с любой суммы'],
  },
];

/* ═══ Validation ═══ */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateStep1(data: Record<string, string>): ValidationResult {
  const errors: string[] = [];

  if (!data.tariff) errors.push('Выберите тариф');
  if (!data.releaseType) errors.push('Выберите тип релиза');
  if (!data.releaseName?.trim()) errors.push('Укажите название релиза');
  if (!data.mainArtist?.trim()) errors.push('Укажите основного артиста');
  if (!data.releaseLink?.trim()) errors.push('Укажите ссылку на релиз');
  if (!data.genre?.trim()) errors.push('Укажите жанр');
  if (!data.language && !data.languageOther) errors.push('Укажите язык релиза');
  if (!data.releaseDate) errors.push('Укажите дату релиза');
  if (!data.coverLink?.trim()) errors.push('Укажите ссылку на обложку');
  if (!data.tiktokExcerpt?.trim()) errors.push('Укажите отрывок в TikTok');
  const tiktokFullValue = data.tiktokFull || data.fullTiktok;
  if (!tiktokFullValue && (data.tariff === 'Премиум' || data.tariff === 'Платинум')) {
    errors.push('Укажите полную версию в TikTok');
  }
  const yandexPreSaveValue = data.yandexPreSave || data.preSaveYandex;
  if (!yandexPreSaveValue && (data.tariff === 'Премиум' || data.tariff === 'Платинум')) {
    errors.push('Укажите Pre-Save в Яндекс Музыке');
  }
  if (!data.karaokeAddition) errors.push('Выберите добавление караоке');

  // Validate tracks
  const trackCount = getTrackCount(data);
  try {
    const tracks = JSON.parse(data._tracks || '[]');
    for (let i = 0; i < trackCount; i++) {
      const track = tracks[i];
      if (!track?.name?.trim()) errors.push(`Трек ${i + 1}: укажите название`);
      if (!track?.lyricists?.some((l: string) => l?.trim())) errors.push(`Трек ${i + 1}: укажите автора текста`);
      if (!track?.composers?.some((c: string) => c?.trim())) errors.push(`Трек ${i + 1}: укажите композитора`);
      if (!track?.explicitContent) errors.push(`Трек ${i + 1}: укажите наличие ненормативной лексики`);
      if (!track?.substanceMention) errors.push(`Трек ${i + 1}: укажите упоминание запрещённых веществ`);
    }
  } catch {
    errors.push('Заполните информацию о треках');
  }

  return { valid: errors.length === 0, errors };
}

function normalizeDistributionData(data: Record<string, string>): Record<string, string> {
  return {
    ...data,
    tiktokFull: data.tiktokFull || data.fullTiktok || '',
    yandexPreSave: data.yandexPreSave || data.preSaveYandex || '',
  };
}

function validateStep2(data: Record<string, string>): ValidationResult {
  const errors: string[] = [];

  if (!data.fullName?.trim()) errors.push('Укажите ФИО');
  if (!data.passportNumber?.trim()) errors.push('Укажите серию и номер паспорта');
  if (!data.issuedBy?.trim()) errors.push('Укажите кем выдан паспорт');
  if (!data.issueDate) errors.push('Укажите дату выдачи паспорта');
  if (!data.email?.trim()) errors.push('Укажите электронную почту');

  return { valid: errors.length === 0, errors };
}

function validateStep3(agreed: boolean): ValidationResult {
  if (!agreed) {
    return { valid: false, errors: ['Необходимо согласие на обработку персональных данных'] };
  }
  return { valid: true, errors: [] };
}

function validateStep4(data: Record<string, string>): ValidationResult {
  const errors: string[] = [];

  if (!data.contactInfo?.trim()) errors.push('Укажите контакты для связи');
  if (!data.paymentProof?.trim()) errors.push('Загрузите фото оплаты');

  return { valid: errors.length === 0, errors };
}

function validatePromo(data: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const promoType = data.promoType;

  if (!promoType) {
    errors.push('Выберите тип промо');
    return { valid: false, errors };
  }

  if (promoType === 'detailed') {
    if (!data.promoReleaseLink?.trim()) errors.push('Укажите ссылку на релиз');
    if (!data.promoUPC?.trim()) errors.push('Укажите UPC или название релиза');
    if (!data.promoReleaseDate) errors.push('Укажите дату релиза');
    if (!data.promoGenre?.trim()) errors.push('Укажите жанр релиза');
    if (!data.promoArtistTitle?.trim()) errors.push('Укажите исполнителя и название');
    if (!data.promoDescription?.trim()) errors.push('Укажите описание релиза');
    if (!data.promoArtistInfo?.trim()) errors.push('Укажите информацию об артисте');
    if (!data.promoPhotos?.trim()) errors.push('Укажите ссылку на фотографии');
    if (!data.promoSocials?.trim()) errors.push('Укажите ссылки на соцсети');
    if (!data.promoExtra?.trim()) errors.push('Укажите дополнительную информацию');
  } else if (promoType === 'weekly') {
    if (!data.promoWeeklyReleaseLink?.trim()) errors.push('Укажите ссылку на релиз');
    if (!data.promoWeeklyUPC?.trim()) errors.push('Укажите UPC или название релиза');
    if (!data.promoWeeklyReleaseDate) errors.push('Укажите дату релиза');
    if (!data.promoWeeklyGenre?.trim()) errors.push('Укажите жанр релиза');
  }

  if (!data.promoContact?.trim()) errors.push('Укажите контакт для связи');

  return { valid: errors.length === 0, errors };
}

// URL route detection
function getRouteFromHash(): AppMode {
  const hash = window.location.hash.slice(1); // Remove #
  if (hash === 'success') return 'success';
  if (hash === 'fail') return 'fail';
  if (hash === 'result') return 'result';
  if (hash === 'distribution') return 'distribution';
  if (hash === 'promo') return 'promo';
  if (hash.startsWith('sign')) return 'sign';
  return 'home';
}

export function App() {
  const [mode, setMode] = useState<AppMode>(getRouteFromHash());
  const scrollToTopInstant = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setMode(getRouteFromHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when mode changes
  const navigateTo = useCallback((newMode: AppMode) => {
    setShowOfferModal(false);
    if (newMode === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = newMode;
    }
    setMode(newMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Distribution form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Promo form state
  const [promoData, setPromoData] = useState<Record<string, string>>({});
  const [promoSubmitted, setPromoSubmitted] = useState(false);
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoErrors, setPromoErrors] = useState<string[]>([]);

  // Tariff expandable state: only one tariff can be expanded at a time
  const [expandedTariffIndex, setExpandedTariffIndex] = useState<number | null>(null);

  // Offer modal state
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Hard reset scroll after mode/form state switches to prevent blank viewport on mobile browsers.
  useEffect(() => {
    if (submitted || promoSubmitted || mode === 'success' || mode === 'fail' || mode === 'result') {
      requestAnimationFrame(() => {
        scrollToTopInstant();
      });
    }
  }, [mode, submitted, promoSubmitted, scrollToTopInstant]);

  const handleChange = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePromoChange = useCallback((key: string, value: string) => {
    setPromoData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goNext = () => {
    const normalized = normalizeDistributionData(formData);
    let validation: ValidationResult = { valid: true, errors: [] };

    if (currentStep === 1) {
      validation = validateStep1(normalized);
    } else if (currentStep === 2) {
      validation = validateStep2(normalized);
    } else if (currentStep === 3) {
      validation = validateStep3(agreed);
    }

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    setCurrentStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setValidationErrors([]);
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDistributionSubmit = async () => {
    const normalized = normalizeDistributionData(formData);
    const step1 = validateStep1(normalized);
    const step2 = validateStep2(normalized);
    const step3 = validateStep3(agreed);
    const step4 = validateStep4(normalized);

    const allErrors = [...step1.errors, ...step2.errors, ...step3.errors, ...step4.errors];

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    setSubmitting(true);

    try {
      const result = await submitToGoogleSheets('distribution', normalized);
      if (result.success) {
        scrollToTopInstant();
        setSubmitted(true);
      } else {
        setValidationErrors([result.message]);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setValidationErrors(['Ошибка при отправке формы. Попробуйте ещё раз.']);
    } finally {
      setSubmitting(false);
      scrollToTopInstant();
    }
  };

  const handlePromoSubmit = async () => {
    const validation = validatePromo(promoData);

    if (!validation.valid) {
      setPromoErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPromoErrors([]);
    setPromoSubmitting(true);

    try {
      const result = await submitToGoogleSheets('promo', promoData);
      if (result.success) {
        scrollToTopInstant();
        setPromoSubmitted(true);
      } else {
        setPromoErrors([result.message]);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setPromoErrors(['Ошибка при отправке формы. Попробуйте ещё раз.']);
    } finally {
      setPromoSubmitting(false);
      scrollToTopInstant();
    }
  };

  const goHome = () => {
    navigateTo('home');
    setValidationErrors([]);
    setPromoErrors([]);
  };

  const resetDistribution = () => {
    setSubmitted(false);
    setCurrentStep(1);
    setFormData({});
    setAgreed(false);
    setValidationErrors([]);
  };

  const resetPromo = () => {
    setPromoSubmitted(false);
    setPromoData({});
    setPromoErrors([]);
  };

  const canSubmitDistribution = !!formData.paymentProof;

  const renderOfferModal = () => {
    if (!showOfferModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Публичная оферта</h2>
            <button
              type="button"
              onClick={() => setShowOfferModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-8 py-6 text-sm text-gray-700 leading-relaxed space-y-4">
            <p><strong className="text-lg">ПУБЛИЧНАЯ ОФЕРТА</strong></p>
            <p><strong className="text-base">о заключении договора об оказании услуг</strong></p>

            <div className="space-y-3">
              <p><strong>1. Общие положения</strong></p>
              <p>В настоящей Публичной оферте содержатся условия заключения Договора об оказании услуг (далее по тексту - «Договор об оказании услуг» и/или «Договор»).</p>
              <p>Настоящей офертой признается предложение, адресованное одному или нескольким конкретным лицам, которое достаточно определенно и выражает намерение лица, сделавшего предложение, считать себя заключившим Договор с адресатом, которым будет принято предложение.</p>
              <p>Совершение указанных в настоящей Оферте действий является подтверждением согласия обеих Сторон заключить Договор об оказании услуг на условиях, в порядке и объеме, изложенных в настоящей Оферте.</p>
              <p>Нижеизложенный текст Публичной оферты является официальным публичным предложением Исполнителя, адресованный заинтересованному кругу лиц заключить Договор об оказании услуг в соответствии с положениями пункта 2 статьи 437 Гражданского кодекса РФ.</p>
            </div>

            <div className="space-y-3">
              <p><strong>Термины и определения:</strong></p>
              <p>Договор – текст настоящей Оферты с Приложениями, являющимися неотъемлемой частью настоящей Оферты, акцептованный Заказчиком путем совершения конклюдентных действий, предусмотренных настоящей Офертой.</p>
              <p>Конклюдентные действия — это поведение, которое выражает согласие с предложением контрагента заключить, изменить или расторгнуть договор.</p>
              <p>Сайт Исполнителя в сети «Интернет» – совокупность программ для электронных вычислительных машин и иной информации, доступ к которой обеспечивается посредством сети «Интернет» по адресу: http://pfvmusic.digital</p>
              <p>Услуга – услуга, оказываемая Исполнителем Заказчику в порядке и на условиях, установленных настоящей Офертой.</p>
            </div>

            <div className="space-y-3">
              <p><strong>2. Предмет Договора</strong></p>
              <p>2.1. Исполнитель обязуется оказать Заказчику Услуги, а Заказчик обязуется оплатить их в размере, порядке и сроки, установленные настоящим Договором.</p>
              <p>2.2. Наименование, количество, порядок и иные условия оказания Услуг определяются на основании сведений Исполнителя при оформлении заявки Заказчиком, либо устанавливаются на сайте Исполнителя.</p>
              <p>2.3. Исполнитель оказывает Услуги по настоящему Договору лично, либо с привлечением третьих лиц, при этом за действия третьих лиц Исполнитель отвечает перед Заказчиком как за свои собственные.</p>
              <p>2.4. Договор заключается путем акцепта настоящей Оферты через совершение конклюдентных действий, выраженных в: действиях, связанных с регистрацией учетной записи; оформлении и направлении Заказчиком заявки; действиях, связанных с оплатой Услуг; действиях, связанных с оказанием Услуг Исполнителем.</p>
            </div>

            <div className="space-y-3">
              <p><strong>3. Права и обязанности Сторон</strong></p>
              <p><strong>3.1. Права и обязанности Исполнителя:</strong></p>
              <p>3.1.1. Исполнитель обязуется оказать Услуги в соответствии с положениями настоящего Договора, в сроки и объеме, указанные в настоящем Договоре и в порядке, указанном на Сайте Исполнителя.</p>
              <p>3.1.2. Исполнитель обязуется предоставлять Заказчику доступ к разделам Сайта, необходимым для получения информации согласно пункту 2.1. Договора.</p>
              <p>3.1.3. Исполнитель несет ответственность за хранение и обработку персональных данных Заказчика, обеспечивает сохранение конфиденциальности этих данных и использует их исключительно для качественного оказания Услуг Заказчику.</p>
              <p>3.1.4. Исполнитель оставляет за собой право изменять сроки оказания Услуг и условия настоящей Оферты в одностороннем порядке без предварительного уведомления Заказчика, публикуя указанные изменения на Сайте Исполнителя.</p>
              <p><strong>3.2. Права и обязанности Заказчика:</strong></p>
              <p>3.2.1. Заказчик обязан предоставлять достоверную информацию о себе при получении соответствующих Услуг.</p>
              <p>3.2.2. Заказчик обязуется не воспроизводить, не копировать, не продавать, а также не использовать информацию и материалы, ставшие ему доступными в связи с оказанием Услуг, за исключением личного использования непосредственно самим Заказчиком.</p>
              <p>3.2.3. Заказчик обязуется принять Услуги, оказанные Исполнителем.</p>
              <p>3.2.4. Заказчик гарантирует, что все условия Договора ему понятны и принимает их без оговорок в полном объеме.</p>
            </div>

            <div className="space-y-3">
              <p><strong>4. Цена и порядок расчетов</strong></p>
              <p>4.1. Стоимость услуг Исполнителя, оказываемых Заказчиком и порядок их оплаты, определяются на основании сведений Исполнителя при оформлении заявки Заказчиком либо устанавливаются на Сайте Исполнителя в сети «Интернет»: http://pfvmusic.digital</p>
              <p>Все расчеты по Договору производятся в безналичном порядке.</p>
            </div>

            <div className="space-y-3">
              <p><strong>5. Конфиденциальность и безопасность</strong></p>
              <p>5.1. При реализации настоящего Договора Стороны обеспечивают конфиденциальность и безопасность персональных данных в соответствии с ФЗ от 27.07.2006 г. № 152-ФЗ «О персональных данных» и ФЗ от 27.07.2006 г. № 149-ФЗ «Об информации, информационных технологиях и о защите информации».</p>
              <p>5.2. Стороны обязуются сохранять конфиденциальность информации, полученной в ходе исполнения настоящего Договора, и принять все возможные меры, чтобы предохранить полученную информацию от разглашения.</p>
              <p>5.3. Под конфиденциальной информацией понимается любая информация, передаваемая Исполнителем и Заказчиком в процессе реализации Договора и подлежащая защите.</p>
              <p>5.4. Такая информация может содержаться в предоставляемых локальных нормативных актах, договорах, письмах, отчетах, аналитических материалах, результатах исследований, схемах, графиках, спецификациях и других документах, оформленных как на бумажных, так и на электронных носителях.</p>
            </div>

            <div className="space-y-3">
              <p><strong>6. Форс-мажор</strong></p>
              <p>6.1. Стороны освобождаются от ответственности за неисполнение или ненадлежащее исполнение обязательств по Договору, если надлежащее исполнение оказалось невозможным вследствие непреодолимой силы, то есть чрезвычайных и непредотвратимых при данных условиях обстоятельств.</p>
              <p>6.2. В случае наступления этих обстоятельств Сторона обязана в течение 30 (Тридцати) рабочих дней уведомить об этом другую Сторону.</p>
              <p>6.3. Документ, выданный уполномоченным государственным органом, является достаточным подтверждением наличия и продолжительности действия непреодолимой силы.</p>
              <p>6.4. Если обстоятельства непреодолимой силы продолжают действовать более 60 (Шестидесяти) рабочих дней, то каждая Сторона вправе отказаться от настоящего Договора в одностороннем порядке.</p>
            </div>

            <div className="space-y-3">
              <p><strong>7. Ответственность Сторон</strong></p>
              <p>7.1. В случае неисполнения и/или ненадлежащего исполнения своих обязательств по Договору, Стороны несут ответственность в соответствии с условиями настоящей Оферты.</p>
              <p>7.2. Исполнитель не несет ответственности за неисполнение и/или ненадлежащее исполнение обязательств по Договору, если такое неисполнение произошло по вине Заказчика.</p>
              <p>7.3. Сторона, не исполнившая или ненадлежащим образом исполнившая обязательства по Договору, обязана возместить другой Стороне причиненные такими нарушениями убытки.</p>
            </div>

            <div className="space-y-3">
              <p><strong>8. Срок действия настоящей Оферты</strong></p>
              <p>8.1. Оферта вступает в силу с момента размещения на Сайте Исполнителя и действует до момента её отзыва Исполнителем.</p>
              <p>8.2. Исполнитель оставляет за собой право внести изменения в условия Оферты и/или отозвать Оферту в любой момент по своему усмотрению. Сведения об изменении или отзыве Оферты доводятся до Заказчика посредством размещения на сайте, в Личном кабинете Заказчика, либо путем направления соответствующего уведомления на электронный или почтовый адрес.</p>
              <p>8.3. Договор вступает в силу с момента Акцепта условий Оферты Заказчиком и действует до полного исполнения Сторонами обязательств по Договору.</p>
              <p>8.4. Изменения, внесенные Исполнителем в Договор и опубликованные на сайте в форме актуализированной Оферты, считаются принятыми Заказчиком в полном объеме.</p>
            </div>

            <div className="space-y-3">
              <p><strong>9. Дополнительные условия</strong></p>
              <p>9.1. Договор, его заключение и исполнение регулируется действующим законодательством Российской Федерации. Все вопросы, не урегулированные настоящей Офертой, регулируются в соответствии с материальным правом Российской Федерации.</p>
              <p>9.2. В случае возникновения спора между Сторонами в ходе исполнения ими своих обязательств по Договору, Стороны обязаны урегулировать спор мирным путем до начала судебного разбирательства. Досудебный порядок урегулирования спора является обязательным.</p>
              <p>9.3. В качестве языка Договора Стороны определили русский язык.</p>
              <p>9.4. Все документы, подлежащие предоставлению в соответствии с условиями настоящей Оферты, должны быть составлены на русском языке либо иметь перевод на русский язык, удостоверенный в установленном порядке.</p>
              <p>9.5. Бездействие одной из Сторон в случае нарушения условий настоящей Оферты не лишает права заинтересованной Стороны осуществлять защиту своих интересов позднее.</p>
              <p>9.6. Если на Сайте Исполнителя есть ссылки на другие веб-сайты и материалы третьих лиц, такие ссылки размещены исключительно в целях информирования. Исполнитель не несет ответственность за любые убытки или ущерб, которые могут возникнуть в результате использования таких ссылок.</p>
            </div>

            <div className="space-y-3">
              <p><strong>10. Реквизиты Исполнителя</strong></p>
              <p><strong>Полное наименование:</strong> Орехов Данила Александрович</p>
              <p><strong>ИНН:</strong> 711613056345</p>
              <p><strong>ОГРНИП:</strong> 324710000080681</p>
              <p><strong>Контактный e-mail:</strong> booking@pfvmusic.ru</p>
            </div>
          </div>

          <div className="px-8 py-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-3xl">
            <button
              type="button"
              onClick={() => setShowOfferModal(false)}
              className="px-6 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══ HOME PAGE ═══
  if (mode === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/30">
        <Header />

        <div className="mx-auto max-w-4xl px-4 py-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100/80 px-4 py-1.5 text-xs font-semibold text-purple-700 mb-5 backdrop-blur-sm border border-purple-200/50">
              <Sparkles className="w-3.5 h-3.5" />
              Музыкальное издательство PFVMUSIC
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Добро пожаловать в{' '}
              <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                PFVMUSIC
              </span>
            </h1>
            <p className="text-base md:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Выберите нужный раздел для работы с вашим релизом
            </p>
          </div>

          {/* Service Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Distribution Card */}
            <button
              type="button"
              onClick={() => navigateTo('distribution')}
              className="group relative overflow-hidden rounded-3xl border-2 border-purple-100 bg-white p-8 text-left shadow-xl shadow-purple-100/20 hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-200/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-100 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-6 shadow-lg shadow-purple-200/50 group-hover:scale-110 transition-transform">
                  <Disc3 className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Дистрибуция
                </h2>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Отправьте ваш трек на дистрибуцию на все популярные музыкальные площадки мира
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">Spotify</span>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">Apple Music</span>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">VK Music</span>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">Яндекс Музыка</span>
                </div>

                <div className="flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
                  Начать
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>

            {/* Promo Card */}
            <button
              type="button"
              onClick={() => navigateTo('promo')}
              className="group relative overflow-hidden rounded-3xl border-2 border-amber-100 bg-white p-8 text-left shadow-xl shadow-amber-100/20 hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-200/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform">
                  <Megaphone className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Промо
                </h2>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Отправьте информацию о релизе для продвижения на цифровых площадках
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">Детальное промо</span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">Еженедельное промо</span>
                </div>

                <div className="flex items-center gap-2 text-amber-600 font-semibold group-hover:gap-3 transition-all">
                  Начать
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>
          </div>

          {/* Tariffs Section */}
          <section id="tariffs-section" className="mt-10 rounded-3xl border border-purple-200/50 bg-gradient-to-br from-purple-50/80 via-white to-blue-50/50 p-6 md:p-8 shadow-lg shadow-purple-100/40">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Раздел тарифов</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Выберите оптимальный пакет для вашего релиза. Полная информация о сроках, ценах и выплатах.
                </p>
              </div>
              <a
                href="https://clck.ru/3E6yBX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-purple-500 bg-white px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-colors whitespace-nowrap"
              >
                Полные тарифы
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Info Pills */}
            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <div className="h-11 rounded-full border border-purple-200 bg-purple-100/40 px-5 py-3 text-sm font-semibold text-purple-700 text-center inline-flex items-center justify-center gap-2">
                <span>⚡</span>
                <span>Отгрузка: 7 / 4 / 2 / 1 дня</span>
              </div>
              <div className="h-11 rounded-full border border-emerald-300 bg-emerald-500 px-5 py-3 text-sm font-semibold text-white text-center inline-flex items-center justify-center gap-2 shadow-md shadow-emerald-200">
                <span>⭐</span>
                <span>Рекомендуем: Премиум</span>
              </div>
              <div className="h-11 rounded-full border border-blue-200 bg-blue-100/40 px-5 py-3 text-sm font-semibold text-blue-700 text-center inline-flex items-center justify-center gap-2">
                <span>🎵</span>
                <span>Площадки: 40+ сервисов</span>
              </div>
            </div>

            {/* General Conditions */}
            <div className="rounded-2xl border border-purple-300 bg-purple-50/80 p-8 mb-8">
              <p className="text-base font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-400 text-white font-bold text-sm">✓</span>
                Общие условия для всех тарифов
              </p>
              <div className="grid gap-4 text-sm text-gray-700 md:grid-cols-2">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 text-purple-600 font-bold mt-0.5 text-lg">→</span>
                  <p>
                    Гайд по подготовке:{' '}
                    <a
                      href="https://vk.com/@pfvmusic-kak-podgotovit-reliz-k-distr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-purple-600 hover:text-purple-700 underline underline-offset-2"
                    >
                      ссылка
                    </a>
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 text-purple-600 font-bold mt-0.5 text-lg">→</span>
                  <p>Площадки: Apple Music, VK, Spotify, TikTok, Яндекс и др.</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 text-purple-600 font-bold mt-0.5 text-lg">→</span>
                  <p>Юридическая защита авторских прав</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 text-purple-600 font-bold mt-0.5 text-lg">→</span>
                  <p>Еженедельные + ежеквартальные отчёты</p>
                </div>
              </div>
            </div>

            {/* Tariff Cards Grid - 2 основных сверху, 2 дополнительных снизу */}
            <div className="grid items-stretch gap-5 md:grid-cols-2">
              {TARIFFS.map((tariff, tariffIndex) => (
                <div
                  key={tariff.name}
                  className={cn(
                    'rounded-2xl border-2 p-6 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col',
                    tariff.cardClass
                  )}
                >
                  {/* Icon - smaller */}
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg text-3xl font-bold',
                    `bg-gradient-to-br ${tariff.accentColor}`
                  )}>
                    {tariff.emoji}
                  </div>

                  {/* Badge */}
                  {tariff.badge && (
                    <div className={cn(
                      'mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold capitalize',
                      tariff.recommended
                        ? 'bg-emerald-100 text-emerald-700'
                        : tariff.name === 'Платинум'
                          ? 'bg-amber-100 text-amber-700'
                          : tariff.name === 'Продвинутый'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-gray-100 text-gray-700'
                    )}>
                      {tariff.badge}
                    </div>
                  )}

                  {/* Title & Subtitle */}
                  <div className="mb-4">
                    <h4 className={cn('text-xl font-bold', tariff.titleClass)}>
                      {tariff.name}
                    </h4>
                    <p className={cn('text-xs mt-1.5', tariff.titleClass, 'opacity-75')}>
                      {tariff.subtitle}
                    </p>
                  </div>

                  {/* Key Metrics - Highlighted */}
                  <div className="rounded-xl bg-gradient-to-r from-gray-50 to-white p-4 mb-5 border border-gray-100 shadow-sm">
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Доля артиста</p>
                        <p className={cn('text-xl font-bold', tariff.titleClass)}>
                          {tariff.monetization[0].match(/\d+%/)}
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Срок обработки</p>
                        <p className="text-sm font-semibold text-gray-900">{tariff.turnaround}</p>
                      </div>
                    </div>
                  </div>

                  {/* Main Pricing - Single, EP, Album */}
                  <div className="mb-5 pb-5 border-b-2 border-gray-100">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-3">Основные цены</p>
                    <div className="space-y-2">
                      {tariff.prices.slice(0, 3).map((price, idx) => {
                        const [rawLabel, ...rawValueParts] = price.split(':');
                        const label = (rawLabel || '').trim();
                        const fullValue = rawValueParts.join(':').trim();
                        const shortValue = idx === 2 ? fullValue.split('(')[0].trim() : fullValue;
                        return (
                          <div key={price} className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <span className={cn(
                              'font-medium',
                              idx === 0 ? 'text-sm text-gray-800' : 'text-xs text-gray-700'
                            )}>
                              {label}
                            </span>
                            <span className={cn(
                              'font-bold text-right',
                              idx === 0
                                ? cn('text-lg', tariff.titleClass)
                                : 'text-sm text-gray-900'
                            )}>
                              {shortValue}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mb-4 mt-auto">
                    <button
                      onClick={() => navigateTo('distribution')}
                      className={cn(
                        'w-full h-12 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2',
                        tariff.name === 'Базовый'
                          ? 'border-2 border-purple-500 text-purple-600 bg-white hover:bg-purple-50'
                          : tariff.name === 'Продвинутый'
                            ? 'border-2 border-sky-400 text-sky-600 bg-white hover:bg-sky-50'
                            : tariff.name === 'Премиум'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-300'
                              : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-300'
                      )}>
                      Начать
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Expandable Details - Custom implementation */}
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedTariffIndex((prev) => (prev === tariffIndex ? null : tariffIndex));
                    }}
                    aria-expanded={expandedTariffIndex === tariffIndex}
                    className={cn(
                      'w-full cursor-pointer text-xs font-bold flex items-center justify-between py-2 transition-colors list-none uppercase tracking-wide',
                      tariff.name === 'Базовый'
                        ? 'text-purple-600 hover:text-purple-700'
                        : tariff.name === 'Продвинутый'
                          ? 'text-sky-600 hover:text-sky-700'
                          : tariff.name === 'Премиум'
                            ? 'text-emerald-600 hover:text-emerald-700'
                            : 'text-amber-600 hover:text-amber-700',
                      'background-none border-none p-0 h-auto'
                    )}>
                    <span>Все цены и возможности →</span>
                    <span className={cn(
                      'transition-transform duration-300 text-lg',
                      expandedTariffIndex === tariffIndex && 'rotate-180'
                    )}>▼</span>
                  </button>

                  {/* Expandable Content */}
                  {expandedTariffIndex === tariffIndex && (
                    <div className="mt-4 space-y-4 text-sm border-t border-gray-200 pt-4 overflow-hidden">
                      <div>
                        <p className="font-bold text-gray-900 mb-2.5 uppercase tracking-wide text-xs">Все цены</p>
                        <div className="space-y-1.5">
                          {tariff.prices.map((price) => (
                            <p key={price} className="text-gray-700 flex gap-2 items-start text-xs break-words">
                              <span className="text-purple-400 mt-0.5 flex-shrink-0 font-bold">•</span>
                              <span>{price}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-2.5 uppercase tracking-wide text-xs">Возможности</p>
                        <div className="grid grid-cols-1 gap-2">
                          {tariff.features.map((feature) => (
                            <p key={feature} className="text-gray-700 flex gap-2 items-start text-xs break-words">
                              <span className="text-emerald-500 mt-0.5 flex-shrink-0 font-bold">✓</span>
                              <span>{feature}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-700 font-semibold mb-1.5 uppercase tracking-wide">Минимальная выплата</p>
                        <p className="font-bold text-gray-900 text-xs">{tariff.monetization[1]}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Payment Compliance Info */}
          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Информация для приёма платежей
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Раздел размещён для соответствия требованиям платёжного провайдера.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Wallet className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-semibold text-purple-900">Услуги и цены</p>
                </div>
                <p className="text-xs text-purple-900/80 leading-relaxed">
                  Дистрибуция музыки на цифровые площадки (Spotify, Apple Music, VK Музыка, Яндекс Музыка и другие).
                  Тарифы с фиксированной стоимостью: «Базовый», «Продвинутый», «Премиум», «Платинум».
                  Стоимость зависит от типа релиза (сингл / EP / альбом) и отображается в форме оформления.
                </p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Clipboard className="w-5 h-5 text-sky-600" />
                  <p className="text-sm font-semibold text-sky-900">Получение услуги</p>
                </div>
                <p className="text-xs text-sky-900/80 leading-relaxed">
                  Услуги оказываются в цифровом формате, физическая доставка не требуется.
                  После оплаты и отправки формы менеджер связывается с клиентом, подтверждает данные и запускает процесс публикации/промо.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <FileCheck className="w-5 h-5 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-900">Оферта и документы</p>
                </div>
                <p className="text-xs text-amber-900/80 leading-relaxed mb-3">
                  Использование сервиса и оказание услуг регулируются публичной офертой.
                </p>
                <button
                  type="button"
                  onClick={() => setShowOfferModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 border-2 border-amber-600 text-amber-600 font-semibold text-xs rounded-lg hover:bg-amber-600 hover:text-white transition-all bg-white"
                >
                  Открыть оферту
                  <FileCheck className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="rounded-2xl border border-gray-300 bg-gray-50/80 p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Phone className="w-5 h-5 text-gray-700" />
                  <p className="text-sm font-semibold text-gray-900">Контакты и реквизиты</p>
                </div>
                <div className="space-y-1.5 text-xs text-gray-700">
                  <p><span className="font-semibold">Email:</span> booking@pfvmusic.ru</p>
                  <p><span className="font-semibold">Telegram:</span> @pfvmusic_support</p>
                  <p><span className="font-semibold">ВКонтакте:</span> vk.ru/pfvmusic</p>
                  <p className="pt-2 border-t border-gray-200 mt-2">
                    <span className="font-semibold">ИП:</span> Орехов Данила Александрович
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <div className="mt-10 pt-10 border-t border-gray-100">
            <h3 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
              Мы в социальных сетях
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {/* VK Group */}
              <a
                href="https://vk.ru/pfvmusic"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-5 py-3 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.684 4 8.245c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.847 2.49 2.27 4.673 2.86 4.673.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.168-3.608 2.168-3.608.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">ВКонтакте</p>
                  <p className="text-xs text-gray-500">Группа</p>
                </div>
              </a>

              {/* Telegram Channel */}
              <a
                href="https://t.me/pfvmusic"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-5 py-3 shadow-sm hover:shadow-lg hover:border-sky-200 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Telegram</p>
                  <p className="text-xs text-gray-500">Канал</p>
                </div>
              </a>

              {/* Support */}
              <a
                href="https://t.me/pfvmusic_support"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-5 py-3 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Поддержка</p>
                  <p className="text-xs text-gray-500">Telegram</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <Footer />
        {renderOfferModal()}
      </div>
    );
  }

  // ═══ SUCCESS PAGE ═══
  if (mode === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30">
        <Header onBack={goHome} />
        <div className="mx-auto max-w-2xl px-4 py-20">
          <div className="rounded-3xl border-2 border-emerald-200 bg-white p-10 text-center shadow-2xl shadow-emerald-100/30">
            {/* Success Animation */}
            <div className="relative mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-emerald-200 animate-ping opacity-20" style={{ animationDuration: '2s' }} />
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-200/50">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Оплата прошла{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                успешно!
              </span>
            </h2>

            <p className="text-gray-600 mb-2 leading-relaxed text-lg">
              Благодарим за оплату!
            </p>
            <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
              Ваш платёж успешно обработан. Мы начнём работу над вашим релизом в ближайшее время.
            </p>

            <div className="bg-emerald-50 rounded-2xl p-6 mb-8 border border-emerald-100">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-semibold text-emerald-800">Что дальше?</span>
              </div>
              <p className="text-sm text-emerald-700">
                Свяжитесь с нами для подтверждения данных и уточнения деталей релиза.
              </p>
            </div>

            {/* Contact Links */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <a
                href="https://t.me/pfvmusic_support"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-100 px-5 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-100 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Telegram Support
              </a>
              <a
                href="https://vk.ru/pfvmusic"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.684 4 8.245c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.847 2.49 2.27 4.673 2.86 4.673.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.168-3.608 2.168-3.608.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" />
                </svg>
                ВКонтакте
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigateTo('distribution')}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-[0.98]"
              >
                Отправить ещё релиз
              </button>
              <button
                type="button"
                onClick={goHome}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                <Home className="w-4 h-4" />
                На главную
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ═══ FAIL PAGE ═══
  if (mode === 'fail') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/30">
        <Header onBack={goHome} />
        <div className="mx-auto max-w-2xl px-4 py-20">
          <div className="rounded-3xl border-2 border-red-200 bg-white p-10 text-center shadow-2xl shadow-red-100/30">
            {/* Fail Animation */}
            <div className="relative mx-auto mb-8">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-xl shadow-red-200/50">
                <XCircle className="h-12 w-12 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Ошибка{' '}
              <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                оплаты
              </span>
            </h2>

            <p className="text-gray-600 mb-2 leading-relaxed text-lg">
              К сожалению, платёж не был завершён
            </p>
            <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
              Пожалуйста, проверьте данные карты и попробуйте снова. Если проблема повторяется, свяжитесь с нашей поддержкой.
            </p>

            <div className="bg-red-50 rounded-2xl p-6 mb-8 border border-red-100">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <span className="font-semibold text-red-800">Возможные причины</span>
              </div>
              <ul className="text-sm text-red-700 space-y-2 text-left max-w-sm mx-auto">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  Недостаточно средств на карте
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  Неверные данные карты
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  Банк отклонил транзакцию
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  Превышен лимит операций
                </li>
              </ul>
            </div>

            {/* Contact Support */}
            <div className="bg-purple-50 rounded-2xl p-6 mb-8 border border-purple-100">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-semibold text-purple-800">Нужна помощь?</span>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Свяжитесь с нашей поддержкой для решения проблемы с оплатой
              </p>
              <a
                href="https://t.me/pfvmusic_support"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                @pfvmusic_support
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigateTo('distribution')}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 hover:from-purple-700 hover:to-purple-800 transition-all active:scale-[0.98]"
              >
                Попробовать снова
              </button>
              <button
                type="button"
                onClick={goHome}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                <Home className="w-4 h-4" />
                На главную
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ═══ RESULT PAGE (Payment Processing) ═══
  if (mode === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/30">
        <Header onBack={goHome} />
        <div className="mx-auto max-w-2xl px-4 py-20">
          <div className="rounded-3xl border-2 border-amber-200 bg-white p-10 text-center shadow-2xl shadow-amber-100/30">
            {/* Processing Animation */}
            <div className="relative mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-amber-200 animate-spin" style={{ animationDuration: '3s', borderTopColor: 'transparent', borderRightColor: 'transparent' }} />
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-200/50">
                <Clock className="h-12 w-12 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Обработка{' '}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                платежа
              </span>
            </h2>

            <p className="text-gray-600 mb-2 leading-relaxed text-lg">
              Ваш платёж находится в обработке
            </p>
            <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
              Пожалуйста, подождите. Это может занять несколько минут. Не закрывайте страницу.
            </p>

            <div className="bg-amber-50 rounded-2xl p-6 mb-8 border border-amber-100">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center animate-pulse">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-semibold text-amber-800">Статус: В обработке</span>
              </div>
              <p className="text-sm text-amber-700">
                Мы проверяем ваш платёж. После завершения вы получите уведомление.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Что происходит?</h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left max-w-sm mx-auto">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold flex-shrink-0">1</span>
                  Проверка платежных данных
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold flex-shrink-0">2</span>
                  Подтверждение транзакции банком
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold flex-shrink-0">3</span>
                  Зачисление средств
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="bg-purple-50 rounded-2xl p-6 mb-8 border border-purple-100">
              <p className="text-sm text-purple-700 mb-3">
                Если обработка занимает слишком много времени, свяжитесь с поддержкой
              </p>
              <a
                href="https://t.me/pfvmusic_support"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                @pfvmusic_support
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-orange-600 transition-all active:scale-[0.98]"
              >
                Проверить статус
              </button>
              <button
                type="button"
                onClick={goHome}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                <Home className="w-4 h-4" />
                На главную
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ═══ PROMO PAGE ═══
  if (mode === 'promo') {
    if (promoSubmitted) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/30">
          <Header onBack={goHome} />
          <div className="mx-auto max-w-2xl px-4 py-20">
            <div className="rounded-2xl border border-emerald-200 bg-white p-10 text-center shadow-xl shadow-emerald-100/20">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Заявка на промо отправлена!</h2>
              <p className="text-gray-600 mb-2 leading-relaxed">
                Спасибо за отправку информации для промо!
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Мы рассмотрим вашу заявку и свяжемся с вами.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={resetPromo}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-orange-700 transition-all active:scale-[0.98]"
                >
                  Отправить ещё одну заявку
                </button>
                <button
                  type="button"
                  onClick={goHome}
                  className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
                >
                  На главную
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40">
        <Header onBack={goHome} />

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-100/50 to-transparent pointer-events-none" />
          <div className="mx-auto max-w-3xl px-4 pt-10 pb-8 text-center relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-4 py-1.5 text-xs font-semibold text-amber-700 mb-5 backdrop-blur-sm border border-amber-200/50">
              <Megaphone className="w-3.5 h-3.5" />
              Отправка информации для промо
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
              Промо вашего{' '}
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                релиза
              </span>
            </h1>
            <p className="text-sm md:text-base text-gray-500 max-w-lg mx-auto leading-relaxed">
              Заполните форму для продвижения вашего релиза на цифровых площадках
            </p>
          </div>
        </div>

        {/* Validation Errors */}
        {promoErrors.length > 0 && (
          <div className="mx-auto max-w-3xl px-4 mb-6">
            <div className="rounded-2xl border-2 border-red-200 bg-red-50/80 p-5 shadow-lg shadow-red-100/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-800 mb-2">Заполните обязательные поля</h3>
                  <ul className="space-y-1">
                    {promoErrors.slice(0, 5).map((error, i) => (
                      <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                    {promoErrors.length > 5 && (
                      <li className="text-sm text-red-600 font-medium mt-2">
                        ... и ещё {promoErrors.length - 5} ошибок
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promo Form */}
        <div className="mx-auto max-w-3xl px-4 pb-8">
          <StepPromo data={promoData} onChange={handlePromoChange} />

          {/* Submit Button */}
          <div className="flex justify-end mt-8">
            <button
              type="button"
              onClick={handlePromoSubmit}
              disabled={promoSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200/50 hover:shadow-amber-300/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {promoSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Отправить
                </>
              )}
            </button>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ═══ SIGN PAGE ═══
  if (mode === 'sign') {
    return <SignPage />;
  }

  // ═══ DISTRIBUTION PAGE ═══
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/30">
        <Header onBack={goHome} />
        <div className="mx-auto max-w-2xl px-4 py-20">
          <div className="rounded-2xl border border-emerald-200 bg-white p-10 text-center shadow-xl shadow-emerald-100/20">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Форма успешно отправлена!</h2>
            <p className="text-gray-600 mb-2 leading-relaxed">
              Спасибо за отправку релиза на дистрибуцию!
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Мы свяжемся с вами в ближайшее время для подтверждения данных.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 text-sm text-purple-700 font-medium mb-6">
              <Send className="w-4 h-4" />
              Не забудьте связаться с нами в Telegram или VK
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={resetDistribution}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 hover:from-purple-700 hover:to-purple-800 transition-all active:scale-[0.98]"
              >
                Отправить ещё один релиз
              </button>
              <button
                type="button"
                onClick={goHome}
                className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentStep - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40">
      <Header onBack={goHome} />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-100/50 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-8 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100/80 px-4 py-1.5 text-xs font-semibold text-purple-700 mb-5 backdrop-blur-sm border border-purple-200/50">
            <Sparkles className="w-3.5 h-3.5" />
            Музыкальное издательство PFVMUSIC
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Отправка трека на{' '}
            <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              дистрибуцию
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-lg mx-auto leading-relaxed">
            Заполните форму, чтобы ваш релиз смог достучаться до слушателей по всему миру
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mx-auto max-w-3xl px-4 mb-2">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stepper */}
      <div className="mx-auto max-w-3xl px-4 mb-8">
        <div className="flex items-center justify-between rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100/80 p-1.5 shadow-sm">
          {DISTRIBUTION_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setCurrentStep(step.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 md:px-5 py-2.5 text-xs md:text-sm font-semibold transition-all duration-300 flex-1 justify-center',
                  isActive && 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-200/50',
                  isCompleted && !isActive && 'bg-purple-50 text-purple-600',
                  !isActive && !isCompleted && 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                )}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {isCompleted && !isActive && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mx-auto max-w-3xl px-4 mb-6">
          <div className="rounded-2xl border-2 border-red-200 bg-red-50/80 p-5 shadow-lg shadow-red-100/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 mb-2">Заполните обязательные поля</h3>
                <ul className="space-y-1">
                  {validationErrors.slice(0, 5).map((error, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li className="text-sm text-red-600 font-medium mt-2">
                      ... и ещё {validationErrors.length - 5} ошибок
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="mx-auto max-w-3xl px-4 pb-8">
        <div key={currentStep} className="animate-in">
          {currentStep === 1 && <StepOne data={formData} onChange={handleChange} />}
          {currentStep === 2 && <StepTwo data={formData} onChange={handleChange} />}
          {currentStep === 3 && <StepThree agreed={agreed} onAgree={setAgreed} />}
          {currentStep === 4 && <StepFour data={formData} onChange={handleChange} onGoToPromo={() => navigateTo('promo')} />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 gap-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={goPrev}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200/50 hover:from-purple-700 hover:to-purple-800 hover:shadow-purple-300/50 transition-all duration-200 active:scale-[0.98]"
            >
              Далее
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDistributionSubmit}
              disabled={submitting || !canSubmitDistribution}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200/50 hover:shadow-purple-300/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Отправить
                </>
              )}
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2">
            {DISTRIBUTION_STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  currentStep === step.id ? 'w-8 bg-purple-500' : currentStep > step.id ? 'w-4 bg-purple-300' : 'w-4 bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Header({ onBack }: { onBack?: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mr-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="На главную"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200/50 overflow-hidden bg-white">
            <img src="/Frame%203.png" alt="PFVMUSIC" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-base font-extrabold text-gray-900 tracking-tight">PFVMUSIC</span>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Издательство</p>
          </div>
        </div>
        <div />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white/60 backdrop-blur-sm mt-8">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-purple-200/50 overflow-hidden bg-white">
              <img src="/Frame%203.png" alt="PFVMUSIC" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900">PFVMUSIC</span>
              <p className="text-[10px] text-gray-400 font-medium">Музыкальное издательство</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} PFVMUSIC. Все права защищены.
            </p>
            <a href="mailto:booking@pfvmusic.ru" className="text-xs text-purple-500 hover:text-purple-700 transition-colors">
              booking@pfvmusic.ru
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
