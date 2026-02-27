import { FileText } from 'lucide-react';

interface ContractInfoProps {
  contractNumber: string;
  trackName: string;
  authorName: string;
  releaseType: string;
}

export function ContractInfo({ contractNumber, trackName, authorName, releaseType }: ContractInfoProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-purple-100/20 overflow-hidden">
      {/* Desktop: icon + 4-col row */}
      <div className="hidden sm:flex items-start gap-4 p-6 md:p-8">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-purple-600" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Номер договора</p>
            <p className="text-2xl font-bold font-mono text-gray-900">{contractNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Произведение</p>
            <p className="text-lg font-semibold text-gray-900">{trackName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Автор</p>
            <p className="text-lg font-semibold text-gray-900">{authorName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Тип релиза</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
              {releaseType}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile: compact 2-col grid, no icon */}
      <div className="sm:hidden grid grid-cols-2 gap-x-4 gap-y-3 p-4">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Номер договора</p>
          <p className="text-xs font-bold font-mono text-gray-900 break-all">{contractNumber}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Произведение</p>
          <p className="text-xs font-semibold text-gray-900">{trackName}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Автор</p>
          <p className="text-xs font-semibold text-gray-900">{authorName}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Тип релиза</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
            {releaseType}
          </span>
        </div>
      </div>
    </div>
  );
}
