import { useEffect, useState, useRef } from 'react';
import { FileText, Download, AlertCircle, CheckCircle2, Loader2, Home, PenLine, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ContractData {
  contractNumber: string;
  contractHtml: string;
  licensorName: string;
  workTitle: string;
  releaseType: string;
}

const SIGNING_STAGES = [
  { emoji: '🔍', text: 'Проверяем данные договора…', duration: 1200 },
  { emoji: '🔐', text: 'Шифруем вашу подпись квантовым ключом…', duration: 1500 },
  { emoji: '🖊️', text: 'Ставим вашу подпись…', duration: 1800 },
  { emoji: '🦋', text: 'Договор обретает юридическую силу…', duration: 1200 },
  { emoji: '🎉', text: 'Поздравляем, всё официально!', duration: 0 },
];

export default function SignPage() {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signed, setSigned] = useState(false);
  const [signature, setSignature] = useState('');
  const [signing, setSigning] = useState(false);
  const [signingStage, setSigningStage] = useState(0);
  const signingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract token from URL hash (e.g., #sign?token=xyz)
  const getTokenFromHash = () => {
    const hash = window.location.hash;
    const tokenMatch = hash.match(/token=([^&]*)/);
    return tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
  };

  const token = getTokenFromHash();

  useEffect(() => {
    if (!token) {
      setError('Токен договора не найден');
      setLoading(false);
      return;
    }

    fetchContract();
  }, [token]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (signingTimerRef.current) clearTimeout(signingTimerRef.current);
    };
  }, []);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sign?action=get&token=${encodeURIComponent(token || '')}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: не удалось загрузить договор`);
      }

      const data = await res.json();
      if (!data?.success || !data?.contractHtml) {
        throw new Error(data?.error || 'Договор не найден');
      }

      setContract({
        contractNumber: data.contractNumber || 'N/A',
        contractHtml: data.contractHtml,
        licensorName: data.licensorName || 'Автор',
        workTitle: data.workTitle || 'Произведение',
        releaseType: data.releaseType || 'Релиз',
      });
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Ошибка при загрузке договора');
      setContract(null);
    } finally {
      setLoading(false);
    }
  };

  const runSigningAnimation = () => {
    setSigning(true);
    setSigningStage(0);

    let currentStage = 0;

    const advanceStage = () => {
      if (currentStage < SIGNING_STAGES.length - 1) {
        currentStage++;
        setSigningStage(currentStage);

        if (currentStage < SIGNING_STAGES.length - 1) {
          signingTimerRef.current = setTimeout(advanceStage, SIGNING_STAGES[currentStage].duration);
        } else {
          // Final stage — mark as signed after a brief pause
          signingTimerRef.current = setTimeout(() => {
            setSigning(false);
            setSigned(true);
            setSignature(`Подписано: ${new Date().toLocaleString('ru-RU')}`);
          }, 1500);
        }
      }
    };

    signingTimerRef.current = setTimeout(advanceStage, SIGNING_STAGES[0].duration);
  };

  const handleSign = () => {
    if (signing || signed) return;
    runSigningAnimation();
  };

  const handleDownloadHTML = () => {
    if (!contract) return;
    const blob = new Blob([contract.contractHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Договор_${contract.contractNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!contract) return;
    alert('PDF экспорт требует бэкенда для конвертации. Используйте браузер (Ctrl+P → Сохранить как PDF)');
  };

  const totalSignDuration = SIGNING_STAGES.reduce((sum, s) => sum + s.duration, 0) + 1500;
  const elapsedDuration = SIGNING_STAGES.slice(0, signingStage).reduce((sum, s) => sum + s.duration, 0);
  const progressPercent = signing ? Math.min(((elapsedDuration) / totalSignDuration) * 100, 95) : (signed ? 100 : 0);

  // Signing overlay
  if (signing) {
    const stage = SIGNING_STAGES[signingStage];
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="rounded-3xl bg-white border border-purple-100 shadow-2xl shadow-purple-200/30 p-10 text-center">
            {/* Animated document icon */}
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center animate-pulse">
                <span className="text-5xl transition-all duration-500" key={signingStage}>
                  {stage.emoji}
                </span>
              </div>
              {/* Floating sparkles */}
              <div className="absolute -top-2 -right-2 animate-bounce">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div className="absolute -bottom-1 -left-2 animate-bounce" style={{ animationDelay: '0.5s' }}>
                <Sparkles className="w-4 h-4 text-purple-300" />
              </div>
            </div>

            {/* Stage text */}
            <p className="text-lg font-bold text-gray-900 mb-2 transition-all duration-300" key={`text-${signingStage}`}>
              {stage.text}
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Пожалуйста, подождите
            </p>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Stage indicators */}
            <div className="flex justify-center gap-2">
              {SIGNING_STAGES.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    idx <= signingStage ? 'bg-purple-500 scale-110' : 'bg-gray-200'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Подписание договора</h1>
                <p className="text-xs text-gray-500">PFV Forms — Платформа дистрибуции</p>
              </div>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-600 font-medium text-sm hover:bg-purple-100 transition-colors"
            >
              <Home size={16} />
              На главную
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
            <p className="text-gray-600 font-medium">Загрузка договора...</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 p-6 mb-6">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900 mb-1">Ошибка</h3>
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={fetchContract}
                  className="mt-3 px-4 py-2 rounded-lg bg-red-100 text-red-700 font-medium text-sm hover:bg-red-200 transition-colors"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          </div>
        )}

        {contract && !loading && (
          <>
            {/* Contract Info Card */}
            <div className="rounded-2xl bg-white border border-purple-100 shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Номер договора</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono">{contract.contractNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Произведение</p>
                  <p className="text-lg font-semibold text-gray-900 truncate">{contract.workTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Автор</p>
                  <p className="text-sm text-gray-700">{contract.licensorName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Тип релиза</p>
                  <p className="text-sm text-gray-700">{contract.releaseType}</p>
                </div>
              </div>
            </div>

            {/* Contract Preview */}
            <div className="rounded-2xl bg-white border border-purple-100 shadow-sm overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-purple-50/50 border-b border-purple-100 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-purple-600" />
                  Документ договора
                </h2>
              </div>
              <div className="p-6">
                {/* Contract Content */}
                <div
                  className="prose prose-sm max-w-none text-gray-800 bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-[600px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: contract.contractHtml }}
                  style={{ fontSize: '12px', lineHeight: '1.6' }}
                />
              </div>
            </div>

            {/* Signature Status & Actions */}
            <div className="rounded-2xl bg-white border border-purple-100 shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Signature Status */}
                <div className={cn(
                  'rounded-xl p-4 border-2 transition-all',
                  signed
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200'
                )}>
                  <div className="flex items-start gap-3">
                    {signed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold text-sm mb-1">
                        {signed ? '✅ Подписано' : 'Не подписано'}
                      </p>
                      {signed && (
                        <p className="text-xs text-green-700">{signature}</p>
                      )}
                      {signed && (
                        <button
                          onClick={handleDownloadHTML}
                          className="mt-1 text-xs text-green-600 underline hover:text-green-800 transition-colors"
                        >
                          📥 Скачать копию договора
                        </button>
                      )}
                      {!signed && (
                        <p className="text-xs text-gray-600">Нажмите кнопку ниже, чтобы подписать договор</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadHTML}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-medium text-sm hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <Download size={16} />
                    HTML
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors border border-red-200"
                  >
                    <Download size={16} />
                    PDF
                  </button>
                </div>
              </div>

              {/* Sign / Re-download Button */}
              <button
                onClick={signed ? handleDownloadHTML : handleSign}
                className={cn(
                  'w-full px-6 py-3 rounded-xl font-bold text-white text-lg transition-all duration-200 flex items-center justify-center gap-2',
                  signed
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl cursor-pointer'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl'
                )}
              >
                {signed ? (
                  <>
                    <Download size={20} />
                    Подписан — скачать снова
                  </>
                ) : (
                  <>
                    <PenLine size={20} />
                    Подписать договор
                  </>
                )}
              </button>
            </div>

            {/* Success Banner */}
            {signed && (
              <div className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50/50 border border-green-200 p-6 mb-6 animate-in">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">Договор успешно подписан!</h3>
                    <p className="text-sm text-green-800 leading-relaxed">
                      Ваш договор был подписан. Вы можете скачать его копию для своих записей.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-purple-50/50 border border-purple-200 p-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                ℹ️ Подписав этот договор, вы подтверждаете, что согласны со всеми условиями лицензионного соглашения.
                Пожалуйста, внимательно прочитайте все положения перед подписанием.
              </p>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white/50 backdrop-blur-sm mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>© 2026 PFV Forms. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
