import { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Header } from '@/components/sign/Header';
import { ContractInfo } from '@/components/sign/ContractInfo';
import { ContractDocument } from '@/components/sign/ContractDocument';
import { SignatureBlock } from '@/components/sign/SignatureBlock';
import { InfoBlock } from '@/components/sign/InfoBlock';
import { Footer } from '@/components/sign/Footer';
import { SigningOverlay } from '@/components/sign/SigningOverlay';

// ════════════════════════════════════════════════════════════════
// Utility to handle signature markers in HTML
// ════════════════════════════════════════════════════════════════
const MARKERS_REGEX = /\{\{(?:<[^>]*>|&[^;]+;|\s)*(?:signature_client|signature_licensor)(?:_[123])?(?:<[^>]*>|&[^;]+;|\s)*\}\}/g;
const FALLBACK_REGEX1 = /\{\{\s*signature_client\s*\}\}/g;
const FALLBACK_REGEX2 = /\{\{\s*signature_licensor\s*\}\}/g;

const cleanMarkersFromHtml = (html: string, isSigned: boolean): string => {
  let result = String(html);
  const replacement = isSigned
    ? '<span style="color:#16a34a; font-weight:bold; font-size:12px; font-family:sans-serif;">Подписано электронно</span>'
    : '<span style="opacity:0;">$&</span>'; // Hide markers but keep them in DOM just in case

  result = result.replace(MARKERS_REGEX, replacement);
  result = result.replace(FALLBACK_REGEX1, replacement);
  result = result.replace(FALLBACK_REGEX2, replacement);
  return result;
};

const SIGN_API_URL = '/api/sign';

// ════════════════════════════════════════════════════════════════
// Sign Page Component
// ════════════════════════════════════════════════════════════════
export default function SignPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Contract data
  const [contractNumber, setContractNumber] = useState('');
  const [contractHtml, setContractHtml] = useState('');
  const [licensorName, setLicensorName] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [releaseType, setReleaseType] = useState('');

  // Signing state
  const [isSigned, setIsSigned] = useState(false);
  const [signedDate, setSignedDate] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  // Used as key on iframe to force reload when signature is injected
  const [contractVersion, setContractVersion] = useState(0);
  // Ref keeps latest signatureData available inside callbacks without stale closure
  const signatureDataRef = useRef<string | null>(null);
  // Stores server result while overlay is still showing
  const serverResultRef = useRef<{ downloadUrl: string } | null>(null);

  // Extract token from URL hash (#sign?token=xyz)
  const getToken = () => {
    const hash = window.location.hash;
    const m = hash.match(/token=([^&]*)/);
    return m ? decodeURIComponent(m[1]) : null;
  };

  const token = getToken();

  // ═══ Fetch contract data through backend proxy ═══
  const fetchContract = useCallback(async () => {
    if (!token) {
      setError('Токен договора не найден в URL');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const url = `${SIGN_API_URL}?action=get&token=${encodeURIComponent(token)}`;
      const res = await fetch(url, { redirect: 'follow' });
      const text = await res.text();

      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error('Некорректный ответ сервера'); }

      if (!data?.success) throw new Error(data?.error || 'Договор не найден');

      let loadedHtml = data.contractHtml || '';
      setContractNumber(data.contractNumber || 'N/A');

      // If already signed on server
      if (data.status === 'signed') {
        setIsSigned(true);
        setSignedDate(data.signedAt || 'ранее');
        let dUrl = data.downloadUrl || data.signedUrl || '';
        if (data.signedPdfId) {
          dUrl = `https://drive.google.com/uc?export=download&id=${data.signedPdfId}`;
        }
        setDownloadUrl(dUrl);
        // Clean markers or replace with "Подписано электронно" text
        loadedHtml = cleanMarkersFromHtml(loadedHtml, true);
      } else {
        // Clean markers so they are invisible to the user before signing
        loadedHtml = cleanMarkersFromHtml(loadedHtml, false);
      }

      setContractHtml(loadedHtml);
      setLicensorName(data.licensorName || 'Автор');
      setWorkTitle(data.workTitle || 'Произведение');
      setReleaseType(data.releaseType || 'Релиз');
    } catch (err: any) {
      setError(err?.message || 'Ошибка при загрузке договора');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchContract(); }, [fetchContract]);

  // ═══ Submit signature through backend proxy ═══
  const submitSignatureToServer = useCallback(async (): Promise<string> => {
    if (!token) return '';
    try {
      const res = await fetch(SIGN_API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          token,
          signature: signatureDataRef.current || `Подписано электронно: ${new Date().toLocaleString('ru-RU')}`,
        }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = {}; }
      const url = data?.downloadUrl || data?.signedUrl || '';
      return url;
    } catch (e) {
      console.error('submitSignature error:', e);
      return '';
    }
  }, [token]);

  // ═══ Handlers matching the design component interface ═══
  const injectSignatureLocally = (html: string, dataUrl: string) => {
    const imgTag = `<img src="${dataUrl}" style="height:60px;width:auto;mix-blend-mode:multiply;" />`;
    let result = String(html);

    // If markers were pre-cleaned as invisible spans, this regex won't match them anymore
    // But we need to replace either the raw marker OR the invisible span we injected
    const regexAny = /(?:<span style="opacity:0;">)?\{\{(?:<[^>]*>|&[^;]+;|\s)*(?:signature_client|signature_licensor)(?:_[123])?(?:<[^>]*>|&[^;]+;|\s)*\}\}(?:<\/span>)?/g;
    result = result.replace(regexAny, imgTag);

    return result;
  };

  // Applies signature locally, marks as signed, then reloads HTML from server for 2-signature version
  const handleSign = useCallback((resolvedDownloadUrl: string) => {
    const now = new Date();
    const formatted = now.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    setIsSigned(true);
    setSignedDate(formatted);
    if (resolvedDownloadUrl) setDownloadUrl(resolvedDownloadUrl);

    // Immediately show with local injection (1 visible signature) for instant feedback
    const sigData = signatureDataRef.current || signatureData;
    if (sigData) {
      setContractHtml(prev => injectSignatureLocally(prev, sigData));
      setContractVersion(v => v + 1);
    }

    // Then reload from server to get the version with BOTH signatures
    if (token) {
      fetch(`${SIGN_API_URL}?action=get&token=${encodeURIComponent(token)}`, { redirect: 'follow' })
        .then(r => r.text())
        .then(text => {
          let data: any;
          try { data = JSON.parse(text); } catch { return; }
          if (data?.success && data?.contractHtml) {
            const signedHtml = cleanMarkersFromHtml(data.contractHtml, true);
            setContractHtml(signedHtml);
            setContractVersion(v => v + 1);
            // Also update downloadUrl if server returned a fresher one
            const freshUrl = data.downloadUrl || data.signedUrl || '';
            if (freshUrl) setDownloadUrl(freshUrl);
          }
        })
        .catch(() => {});
    }
  }, [signatureData, token]);

  // Called when user clicks "Подписать договор":
  // 1. Show overlay immediately
  // 2. Fire server request in parallel — set serverReady when done
  const handleSigningStart = useCallback(() => {
    setShowOverlay(true);
    setServerReady(false);
    serverResultRef.current = null;

    submitSignatureToServer().then(url => {
      serverResultRef.current = { downloadUrl: url };
      setServerReady(true);
    });
  }, [submitSignatureToServer]);

  // Called by overlay once animation done AND server responded
  const handleOverlayComplete = useCallback(() => {
    setShowOverlay(false);
    setServerReady(false);
    const url = serverResultRef.current?.downloadUrl || '';
    handleSign(url);
  }, [handleSign]);

  const handleSignatureChange = useCallback((data: string | null) => {
    setSignatureData(data);
    signatureDataRef.current = data;
  }, []);

  const resolveLatestDownloadUrl = useCallback(async (): Promise<string> => {
    if (!token) return '';
    try {
      const url = `${SIGN_API_URL}?action=get&token=${encodeURIComponent(token)}`;
      const res = await fetch(url, { redirect: 'follow' });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = {}; }

      let freshUrl = data?.downloadUrl || data?.signedUrl || '';
      if (data?.signedPdfId) {
        freshUrl = `https://drive.google.com/uc?export=download&id=${data.signedPdfId}`;
      }

      if (freshUrl) {
        setDownloadUrl(freshUrl);
      }

      return freshUrl;
    } catch {
      return '';
    }
  }, [token]);

  // ═══ Download handler ═══
  const handleDownload = useCallback(async (type: 'pdf' | 'html' = 'pdf') => {
    if (type === 'pdf') {
      let pdfUrl = downloadUrl;
      if (!pdfUrl) {
        pdfUrl = await resolveLatestDownloadUrl();
      }

      if (pdfUrl) {
        try {
          const win = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
          if (!win) {
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        } catch {
          window.location.href = pdfUrl;
        }
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
  }, [downloadUrl, contractHtml, contractNumber, resolveLatestDownloadUrl]);

  // ═══ RENDER ═══
  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col font-sans">
      {showOverlay && <SigningOverlay onComplete={handleOverlayComplete} serverReady={serverReady} />}
      <Header />

      <main className="flex-1 w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 xl:px-12">
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
            <div className="animate-fade-in-up mb-3 sm:mb-6" style={{ animationDelay: '0.1s' }}>
              <ContractInfo
                contractNumber={contractNumber}
                trackName={workTitle}
                authorName={licensorName}
                releaseType={releaseType}
              />
            </div>

            {/* Two-column layout on desktop */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] gap-3 sm:gap-6 items-start">
              {/* Left column: Contract Document */}
              <div className="min-w-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <ContractDocument htmlContent={contractHtml} version={contractVersion} />
              </div>

              {/* Right column: Signature + Info */}
              <div className="min-w-0 space-y-6 animate-fade-in-up xl:sticky xl:top-24" style={{ animationDelay: '0.3s' }}>
                <SignatureBlock
                  isSigned={isSigned}
                  signedDate={signedDate}
                  onSigningStart={handleSigningStart}
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
