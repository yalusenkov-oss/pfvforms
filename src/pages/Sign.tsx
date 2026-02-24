import { useState, useCallback, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Header } from '@/components/sign/Header';
import { ContractInfo } from '@/components/sign/ContractInfo';
import { ContractDocument } from '@/components/sign/ContractDocument';
import { SignatureBlock } from '@/components/sign/SignatureBlock';
import { InfoBlock } from '@/components/sign/InfoBlock';
import { Footer } from '@/components/sign/Footer';

// ════════════════════════════════════════════════════════════════
// Google Apps Script URL resolution (same pattern as main app)
// ════════════════════════════════════════════════════════════════
let _cachedScriptUrl: string | null = null;

async function getScriptUrl(): Promise<string> {
  if (_cachedScriptUrl) return _cachedScriptUrl;

  try {
    const envUrl = ((import.meta as any)?.env?.VITE_GOOGLE_SCRIPT_URL as string) || '';
    if (envUrl) { _cachedScriptUrl = envUrl; return envUrl; }
  } catch { }

  try {
    const w = window as any;
    if (w?.VITE_GOOGLE_SCRIPT_URL) {
      _cachedScriptUrl = String(w.VITE_GOOGLE_SCRIPT_URL);
      return _cachedScriptUrl;
    }
  } catch { }

  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) {
      const obj = await res.json();
      if (obj?.VITE_GOOGLE_SCRIPT_URL) {
        _cachedScriptUrl = String(obj.VITE_GOOGLE_SCRIPT_URL);
        return _cachedScriptUrl;
      }
    }
  } catch { }

  return '';
}

// ════════════════════════════════════════════════════════════════
// Sign Page Component
// ════════════════════════════════════════════════════════════════
export default function SignPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Contract data from GAS
  const [contractNumber, setContractNumber] = useState('');
  const [contractHtml, setContractHtml] = useState('');
  const [licensorName, setLicensorName] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [releaseType, setReleaseType] = useState('');

  // Signing state
  const [isSigned, setIsSigned] = useState(false);
  const [signedDate, setSignedDate] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');

  // Extract token from URL hash (#sign?token=xyz)
  const getToken = () => {
    const hash = window.location.hash;
    const m = hash.match(/token=([^&]*)/);
    return m ? decodeURIComponent(m[1]) : null;
  };

  const token = getToken();

  // ═══ Fetch contract data from Google Apps Script ═══
  const fetchContract = useCallback(async () => {
    if (!token) {
      setError('Токен договора не найден в URL');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const scriptUrl = await getScriptUrl();
      if (!scriptUrl) throw new Error('Google Script URL не настроен. Проверьте config.json');

      const url = `${scriptUrl}?action=sign_get&token=${encodeURIComponent(token)}`;
      const res = await fetch(url, { redirect: 'follow' });
      const text = await res.text();

      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error('Некорректный ответ сервера'); }

      if (!data?.success) throw new Error(data?.error || 'Договор не найден');

      setContractNumber(data.contractNumber || 'N/A');
      setContractHtml(data.contractHtml || '');
      setLicensorName(data.licensorName || 'Автор');
      setWorkTitle(data.workTitle || 'Произведение');
      setReleaseType(data.releaseType || 'Релиз');

      // If already signed on server
      if (data.status === 'signed') {
        setIsSigned(true);
        setSignedDate(data.signedAt || 'ранее');
        let dUrl = data.downloadUrl || data.signedUrl || '';
        if (data.signedPdfId) {
          dUrl = `https://drive.google.com/uc?export=download&id=${data.signedPdfId}`;
        }
        setDownloadUrl(dUrl);
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка при загрузке договора');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchContract(); }, [fetchContract]);

  // ═══ Submit signature to Google Apps Script ═══
  const submitSignatureToServer = useCallback(async () => {
    if (!token) return;
    try {
      const scriptUrl = await getScriptUrl();
      if (!scriptUrl) return;

      const res = await fetch(scriptUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sign_submit',
          token,
          signature: signatureData || `Подписано электронно: ${new Date().toLocaleString('ru-RU')}`,
        }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = {}; }
      if (data?.downloadUrl || data?.signedUrl) {
        setDownloadUrl(data.downloadUrl || data.signedUrl);
      }
    } catch (e) {
      console.error('submitSignature error:', e);
    }
  }, [token, signatureData]);

  // ═══ Handlers matching the design component interface ═══
  const injectSignatureLocally = (html: string, dataUrl: string) => {
    const imgTag = `<img src="${dataUrl}" style="height:60px;width:auto;" />`;
    let result = String(html);

    // Replace all possible client/licensor signature markers, even with inner tags or entities
    const regex = /\{\{(?:<[^>]*>|&[^;]+;|\s)*(?:signature_client|signature_licensor)(?:_[123])?(?:<[^>]*>|&[^;]+;|\s)*\}\}/g;
    result = result.replace(regex, imgTag);

    // Fallback simple replacement just in case
    result = result.replace(/\{\{\s*signature_client\s*\}\}/g, imgTag);
    result = result.replace(/\{\{\s*signature_licensor\s*\}\}/g, imgTag);

    return result;
  };

  const handleSign = useCallback(() => {
    const now = new Date();
    const formatted = now.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    setIsSigned(true);
    setSignedDate(formatted);
    // Instant visual update of HTML
    if (signatureData) {
      setContractHtml(prev => injectSignatureLocally(prev, signatureData));
    }
    // Submit to server in background
    submitSignatureToServer();
  }, [submitSignatureToServer, signatureData]);

  const handleSigningStart = useCallback(() => {
    setShowOverlay(true);
  }, []);

  const handleOverlayComplete = useCallback(() => {
    setShowOverlay(false);
  }, []);

  const handleSignatureChange = useCallback((data: string | null) => {
    setSignatureData(data);
  }, []);

  // ═══ Download handler ═══
  const handleDownload = useCallback((type: 'pdf' | 'html' = 'pdf') => {
    if (type === 'pdf') {
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      } else {
        alert('Пожалуйста, подождите пару секунд, PDF-документ генерируется...');
      }
      return;
    }

    // HTML fallback
    if (!contractHtml) return;
    const blob = new Blob([contractHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Договор_${contractNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [downloadUrl, contractHtml, contractNumber]);

  // ═══ RENDER ═══
  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col font-sans mobile-zoom-80">
      <Header />

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 xl:px-12">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
            <p className="text-gray-600 font-medium">Загрузка договора...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 p-6">
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

        {/* Contract loaded */}
        {!loading && !error && contractHtml && (
          <>
            {/* Contract Info — full width */}
            <div className="animate-fade-in-up mb-6" style={{ animationDelay: '0.1s' }}>
              <ContractInfo
                contractNumber={contractNumber}
                trackName={workTitle}
                authorName={licensorName}
                releaseType={releaseType}
              />
            </div>

            {/* Two-column layout on desktop */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] gap-6 items-start">
              {/* Left column: Contract Document */}
              <div className="min-w-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <ContractDocument htmlContent={contractHtml} />
              </div>

              {/* Right column: Signature + Info */}
              <div className="min-w-0 space-y-6 animate-fade-in-up xl:sticky xl:top-24" style={{ animationDelay: '0.3s' }}>
                <SignatureBlock
                  isSigned={isSigned}
                  signedDate={signedDate}
                  onSign={handleSign}
                  onSigningStart={handleSigningStart}
                  showOverlay={showOverlay}
                  onOverlayComplete={handleOverlayComplete}
                  signatureData={signatureData}
                  onSignatureChange={handleSignatureChange}
                  onDownload={handleDownload}
                />
                <InfoBlock />
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
