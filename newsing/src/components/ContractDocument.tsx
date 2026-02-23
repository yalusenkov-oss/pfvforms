import { FileText } from 'lucide-react';

interface ContractDocumentProps {
  htmlContent: string;
}

export function ContractDocument({ htmlContent }: ContractDocumentProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-purple-100/20 overflow-hidden flex flex-col h-full">
      <div className="px-6 sm:px-8 py-4 bg-gradient-to-r from-purple-50 via-purple-50/60 to-transparent border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-extrabold text-gray-900">📄 Документ договора</h2>
        </div>
      </div>
      <div className="p-4 sm:p-6 flex-1 min-h-0">
        <div
          className="contract-scroll max-h-[70vh] xl:max-h-none xl:h-full overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-4 sm:p-6"
          style={{ fontSize: '12px', lineHeight: '1.6' }}
        >
          <div
            className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </div>
  );
}
