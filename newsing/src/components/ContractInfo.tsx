import { FileText } from 'lucide-react';

interface ContractInfoProps {
  contractNumber: string;
  trackName: string;
  authorName: string;
  releaseType: string;
}

export function ContractInfo({ contractNumber, trackName, authorName, releaseType }: ContractInfoProps) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-xl shadow-purple-100/20 p-6 sm:p-8 overflow-hidden">
      <div className="absolute top-5 left-5 sm:top-6 sm:left-6 w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
        <FileText className="w-5 h-5 text-purple-600" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 pt-14 sm:pt-0 sm:pl-16">
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
  );
}
