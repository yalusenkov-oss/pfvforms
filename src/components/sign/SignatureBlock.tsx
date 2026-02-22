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
  onDownload?: (type: 'pdf' | 'html') => void;
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

      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden mt-6">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-[22px]">✍️</span> Подписание договора
          </h2>
        </div>

        <div className="p-8 space-y-8">
          {/* Status & Download row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Signature status */}
            {isSigned ? (
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border border-green-100 shadow-sm min-w-[300px]">
                <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                <div>
                  <p className="text-[15px] font-bold text-gray-800">Подписано</p>
                  <p className="text-[13px] text-gray-400 mt-0.5">{signedDate}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm min-w-[300px]">
                <Circle className="w-6 h-6 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[15px] font-bold text-gray-700">Не подписано</p>
                  <p className="text-[13px] text-gray-400 mt-0.5">Ожидает вашей подписи</p>
                </div>
              </div>
            )}

            {/* Download buttons */}
            <div className="flex items-center gap-3">
              <button
                disabled={!isSigned}
                onClick={() => onDownload?.('html')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold bg-white border border-gray-100 text-gray-400 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-700 hover:border-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                HTML
              </button>
              <button
                disabled={!isSigned}
                onClick={() => onDownload?.('pdf')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold bg-white border border-gray-100 text-gray-400 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-700 hover:border-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          {/* Signature input */}
          {!isSigned && (
            <div className="space-y-6 pt-2">
              {/* Tabs */}
              <div className="inline-flex p-1.5 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <button
                  className="px-5 py-2.5 rounded-[12px] text-[14px] font-bold bg-white text-purple-700 shadow-sm border border-gray-100"
                >
                  🖋️ Нарисовать подпись
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
              onClick={() => onDownload?.('pdf')}
              className="w-full py-5 rounded-[16px] text-[16px] font-bold text-white bg-[#00b06b] hover:bg-[#009b5d] transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-5 h-5" />
              Подписан — скачать снова
            </button>
          ) : (
            <button
              onClick={handleSign}
              disabled={!signatureData}
              className="w-full py-5 rounded-[16px] text-[16px] font-bold text-white bg-[#c084fc] hover:bg-[#a855f7] disabled:bg-[#d8b4fe] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              🖋️ Подписать договор
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
