import { FileText } from 'lucide-react';

interface ContractDocumentProps {
  htmlContent: string;
}

export function ContractDocument({ htmlContent }: ContractDocumentProps) {
  const mobileCompactCss = `
@media (max-width: 640px) {
  body { font-size: 11px !important; line-height: 1.45 !important; padding: 12mm !important; }
  h1 { font-size: 14px !important; margin-bottom: 14px !important; }
  h2, .section-title { font-size: 12px !important; margin: 16px 0 10px !important; }
  .header-row { font-size: 11px !important; margin-bottom: 12px !important; }
  p { margin: 4px 0 !important; }
  table.objects { font-size: 10px !important; }
  .sig-line { width: 150px !important; margin-top: 24px !important; }
}`;
  const compactHtml = htmlContent.includes('</style>')
    ? htmlContent.replace('</style>', `${mobileCompactCss}\n</style>`)
    : `${htmlContent}<style>${mobileCompactCss}</style>`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-purple-100/20 overflow-hidden flex flex-col h-full">
      <div className="px-3 sm:px-8 py-2.5 sm:py-4 bg-gradient-to-r from-purple-50 via-purple-50/60 to-transparent border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-purple-600" />
          <h2 className="text-sm sm:text-lg font-extrabold text-gray-900">📄 Документ договора</h2>
        </div>
      </div>
      <div className="p-2.5 sm:p-6 flex-1 min-h-0">
        <div className="contract-scroll max-h-[58vh] sm:max-h-[70vh] xl:max-h-[800px] overflow-hidden border border-gray-200 rounded-lg bg-gray-50">
          <iframe
            title="contract-preview"
            srcDoc={compactHtml}
            sandbox=""
            className="w-full h-[58vh] sm:h-[70vh] xl:h-[800px] bg-white border-0"
          />
        </div>
      </div>
    </div>
  );
}
