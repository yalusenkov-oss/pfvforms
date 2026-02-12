import { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Send, CheckCircle2, FileText, Shield, CreditCard, Disc3, Sparkles, AlertCircle, Megaphone, ArrowLeft, XCircle, Clock, ExternalLink, Home, Loader2 } from 'lucide-react';
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
  if (!data.bankDetails?.trim()) errors.push('Укажите банковские реквизиты');
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
          
          {/* QR Code & Tariffs Link */}
          <div className="mt-12 text-center">
            <a
              href="https://clck.ru/3E6yBX"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-6 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-100 border border-purple-100 transition-all hover:shadow-md"
            >
              Узнать о тарифах дистрибуции
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          
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
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.684 4 8.245c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.847 2.49 2.27 4.673 2.86 4.673.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.168-3.608 2.168-3.608.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
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
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
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
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
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
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.684 4 8.245c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.847 2.49 2.27 4.673 2.86 4.673.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.168-3.608 2.168-3.608.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200/50 overflow-hidden bg-white">
            {/* Use uploaded logo from public/ so it resolves both in dev and production */}
            <img src="/Frame%203.png" alt="PFVMUSIC" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 tracking-tight">PFVMUSIC</h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Издательство</p>
          </div>
        </div>
        <a
          href="https://clck.ru/3E6yBX"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 rounded-lg bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 border border-purple-100 transition-all hover:shadow-sm"
        >
          Тарифы
          <ChevronRight className="w-3 h-3" />
        </a>
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
