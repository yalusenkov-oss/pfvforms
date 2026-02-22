import { FileText } from 'lucide-react';

interface ContractInfoProps {
  contractNumber: string;
  trackName: string;
  authorName: string;
  releaseType: string;
}

export function ContractInfo({ contractNumber, trackName, authorName, releaseType }: ContractInfoProps) {
  return (
    <div className="relative bg-white rounded-[20px] border border-gray-100 shadow-sm p-8 flex gap-8">
      {/* Icon Area */}
      <div className="w-12 h-12 shrink-0 rounded-[14px] bg-purple-100/80 flex items-center justify-center">
        <FileText className="w-6 h-6 text-purple-600" />
      </div>

      {/* Grid Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 w-full">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Номер договора</p>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{contractNumber}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Произведение</p>
          <p className="text-xl font-bold text-gray-900 tracking-tight">{trackName}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Автор</p>
          <p className="text-xl font-bold text-gray-900 tracking-tight leading-tight max-w-[200px]">{authorName}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Тип релиза</p>
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-purple-100 text-purple-600">
            {releaseType}
          </span>
        </div>
      </div>
    </div>
  );
}
