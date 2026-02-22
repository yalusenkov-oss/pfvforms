import { useState, useCallback } from 'react';
import { Download, ShieldCheck, CheckCircle, Circle } from 'lucide-react';
import { SignatureCanvas } from './SignatureCanvas';
import { SigningOverlay } from './SigningOverlay';

interface SignatureBlockProps {
  isSigned: boolean;
  signedDate: string | null;
  onSign: () => void;
  onSigningStart: () => void;
  showOverlay: boolean;
  onOverlayComplete: () => void;
  signatureData: string | null;
  onSignatureChange: (data: string | null) => void;
  onDownload?: () => void;
}

export function SignatureBlock({
  isSigned,
  signedDate,
  onSign,
  onSigningStart,
  showOverlay,
  onOverlayComplete,
  signatureData,
  onSignatureChange,
  onDownload,
}: SignatureBlockProps) {
  const [_activeTab] = useState<'draw'>('draw');

  const handleSign = useCallback(() => {
    if (!signatureData || isSigned) return;
    onSigningStart();
  }, [signatureData, isSigned, onSigningStart]);

  const handleOverlayDone = useCallback(() => {
    onOverlayComplete();
    onSign();
  }, [onOverlayComplete, onSign]);

  return (
    <>
      {showOverlay && <SigningOverlay onComplete={handleOverlayDone} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-purple-100/20 overflow-hidden">
        <div className="px-6 sm:px-8 py-4 bg-gradient-to-r from-purple-50 via-purple-50/60 to-transparent border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-lg">✍️</span>
            <h2 className="text-lg font-extrabold text-gray-900">Подписание договора</h2>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Status & Download row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Signature status */}
            {isSigned ? (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-800">✅ Подписано</p>
                  <p className="text-xs text-green-600 mt-0.5">{signedDate}</p>
                  <button
                    onClick={onDownload}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800 mt-2"
                  >
                    📥 Скачать копию договора
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Circle className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-600">○ Не подписано</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ожидает вашей подписи</p>
                </div>
              </div>
            )}

            {/* Download buttons */}
            <div className="flex items-center gap-3 justify-end">
              <button
                disabled={!isSigned}
                onClick={onDownload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Скачать
              </button>
            </div>
          </div>

          {/* Signature input */}
          {!isSigned && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                  className="px-4 py-2 rounded-md text-sm font-semibold bg-white text-purple-700 shadow-sm"
                >
                  🖊️ Нарисовать подпись
                </button>
              </div>

              {/* Canvas */}
              {_activeTab === 'draw' && (
                <SignatureCanvas onSignatureChange={onSignatureChange} />
              )}
            </div>
          )}

          {/* Sign/Download button */}
          {isSigned ? (
            <button
              onClick={onDownload}
              className="w-full py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-200/50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              ⬇️ Подписан — скачать снова
            </button>
          ) : (
            <button
              onClick={handleSign}
              disabled={!signatureData}
              className="w-full py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-200/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-purple-700 flex items-center justify-center gap-2"
            >
              🖊️ Подписать договор
            </button>
          )}
        </div>
      </div>

      {/* Success banner */}
      {isSigned && (
        <div className="animate-fade-in-up">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-base font-bold text-green-900">🎉 Договор успешно подписан!</p>
              <p className="text-sm text-green-700 mt-0.5">Вы можете скачать его копию в любое время.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
