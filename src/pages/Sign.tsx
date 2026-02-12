import { useEffect, useState } from 'react';
import { FileText, Download, AlertCircle, CheckCircle2, Loader2, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ContractData {
  contractNumber: string;
  contractHtml: string;
  licensorName: string;
  workTitle: string;
  releaseType: string;
}

export default function SignPage() {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signed, setSigned] = useState(false);
  const [signature, setSignature] = useState('');

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

  const handleSign = () => {
    setSigned(true);
    setSignature(`Подписано: ${new Date().toLocaleString('ru-RU')}`);
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
    // В реальном приложении здесь была бы конвертация HTML→PDF
    // Для примера просто показываем сообщение
    alert('PDF экспорт требует бэкенда для конвертации. Используйте браузер (Ctrl+P → Сохранить как PDF)');
  };

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
                        {signed ? 'Подписано' : 'Не подписано'}
                      </p>
                      {signed && (
                        <p className="text-xs text-green-700">{signature}</p>
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

              {/* Sign Button */}
              <button
                onClick={handleSign}
                disabled={signed}
                className={cn(
                  'w-full px-6 py-3 rounded-xl font-bold text-white text-lg transition-all duration-200 flex items-center justify-center gap-2',
                  signed
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl'
                )}
              >
                {signed ? (
                  <>
                    <CheckCircle2 size={20} />
                    Договор подписан
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    Подписать договор
                  </>
                )}
              </button>
            </div>

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
