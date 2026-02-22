
interface ContractDocumentProps {
  htmlContent: string;
}

export function ContractDocument({ htmlContent }: ContractDocumentProps) {
  return (
    <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-8 py-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-[22px]">📄</span> Документ договора
        </h2>
      </div>
      <div className="p-8">
        <div
          className="contract-scroll max-h-[600px] overflow-y-auto"
          style={{ fontSize: '13px', lineHeight: '1.6' }}
        >
          <div
            className="prose prose-sm font-sans max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </div>
  );
}
