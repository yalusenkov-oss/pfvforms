import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Eye,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DistributionData, TARIFF_LABELS, RELEASE_TYPE_LABELS } from '../types';
import {
  extractContractData,
  generateContractNumber,
  generateContractText,
  generateContractHTML,
  ContractData,
} from '../services/contractGenerator';
import { cn } from '../utils/cn';

interface ContractGeneratorProps {
  data: DistributionData;
  onBack: () => void;
  onUpdateContractNumber: (id: string, contractNumber: string) => void;
}

function DataField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (val: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 border-b border-dark-700/50 last:border-0">
      <span className="text-xs text-dark-400 sm:w-52 shrink-0 font-medium">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {editable && onChange ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 bg-dark-700/50 border border-dark-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
          />
        ) : (
          <span className="text-sm text-white break-words flex-1">{value}</span>
        )}
        <button
          onClick={handleCopy}
          className="p-1 rounded text-dark-500 hover:text-white shrink-0 transition-colors"
          title="Копировать"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
}

export function ContractGenerator({ data, onBack, onUpdateContractNumber }: ContractGeneratorProps) {
  const [contractNumber, setContractNumber] = useState(data.contractNumber || generateContractNumber());
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMarkers, setShowMarkers] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  // Build contract data with current contract number
  const contractData: ContractData = useMemo(() => {
    const extracted = extractContractData(data);
    return { ...extracted, contractNumber };
  }, [data, contractNumber]);

  const contractText = useMemo(() => generateContractText(contractData), [contractData]);
  const contractHTML = useMemo(() => generateContractHTML(contractData), [contractData]);
  const signedContractHTML = useMemo(
    () => generateContractHTML(contractData, { signatureUrl: '/signature.png' }),
    [contractData]
  );

  const handleRegenerateNumber = () => {
    const newNumber = generateContractNumber();
    setContractNumber(newNumber);
    onUpdateContractNumber(data.id, newNumber);
  };

  const handleSaveNumber = () => {
    onUpdateContractNumber(data.id, contractNumber);
    setIsEditing(false);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(contractText);
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Договор_${contractNumber}_${data.mainArtist}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([contractHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Договор_${contractNumber}_${data.mainArtist}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(contractHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handlePrintSigned = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(signedContractHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const markers = [
    { marker: 'contract_number', value: contractData.contractNumber, desc: 'Номер договора' },
    { marker: 'licensor_name', value: contractData.licensorName, desc: 'ФИО Лицензиара' },
    { marker: 'passport_series_number', value: contractData.passportSeriesNumber, desc: 'Серия и номер паспорта' },
    { marker: 'passport_issued_by', value: contractData.passportIssuedBy, desc: 'Кем выдан паспорт' },
    { marker: 'passport_issue_date', value: contractData.passportIssueDate, desc: 'Дата выдачи паспорта' },
    { marker: 'bank_details', value: contractData.bankDetails, desc: 'Банковские реквизиты' },
    { marker: 'email', value: contractData.email, desc: 'Электронная почта' },
    { marker: 'pseudonym', value: contractData.pseudonym, desc: 'Творческий псевдоним' },
    { marker: 'work_title', value: contractData.workTitle, desc: 'Название произведения' },
    { marker: 'music_author', value: contractData.musicAuthor, desc: 'Автор музыки' },
    { marker: 'lyrics_author', value: contractData.lyricsAuthor, desc: 'Автор слов' },
    { marker: 'contact', value: contractData.contact, desc: 'Контактные данные' },
    { marker: 'release_type', value: contractData.releaseType, desc: 'Тип релиза' },
    { marker: 'тариф', value: contractData.tariff, desc: 'Тариф' },
    { marker: 'date', value: contractData.date, desc: 'Текущая дата' },
    { marker: 'future_date', value: contractData.futureDate, desc: 'Дата +4 года' },
    { marker: 'percentage', value: `${contractData.percentage}%`, desc: 'Процент роялти' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-primary-400" />
              Генерация договора
            </h2>
            <p className="text-sm text-dark-400 mt-0.5">
              {data.releaseName} — {data.mainArtist} · {TARIFF_LABELS[data.tariff]} · {RELEASE_TYPE_LABELS[data.releaseType]}
            </p>
          </div>
        </div>
        <a
          href="https://docs.google.com/document/d/1MD0F4Ie0WQMCbZxHuwa0v23p836TFNV36MSEVbhBY7g/edit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <ExternalLink size={14} />
          Шаблон в Google Docs
        </a>
      </div>

      {/* Contract Number */}
      <div className="bg-gradient-to-r from-primary-900/30 to-primary-800/20 border border-primary-700/30 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-primary-300/70 mb-1">Номер договора</p>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  className="bg-dark-800/80 border border-primary-500/50 rounded-lg px-3 py-2 text-lg font-bold text-white font-mono focus:outline-none focus:border-primary-400 w-full max-w-[280px]"
                  autoFocus
                />
                <button
                  onClick={handleSaveNumber}
                  className="px-3 py-2 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-600/30 transition-colors"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white font-mono">{contractNumber}</p>
                <p className="text-xs text-primary-300/80">
                  ЛИЦЕНЗИОННЫЙ ДОГОВОР № {contractNumber}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                'p-2 rounded-lg border text-sm transition-colors',
                isEditing
                  ? 'bg-yellow-600/20 border-yellow-500/30 text-yellow-400'
                  : 'bg-dark-700/50 border-dark-600 text-dark-300 hover:text-white'
              )}
              title="Редактировать номер"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={handleRegenerateNumber}
              className="p-2 rounded-lg bg-dark-700/50 border border-dark-600 text-dark-300 hover:text-white transition-colors"
              title="Сгенерировать новый номер"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-primary-300/60">
          <span>Тариф: <b className="text-primary-300">{contractData.tariff}</b></span>
          <span>Роялти: <b className="text-primary-300">{contractData.percentage}%</b> лицензиару</span>
          <span>Действие: до <b className="text-primary-300">{contractData.futureDate}</b></span>
        </div>
      </div>

      {/* Markers Table */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowMarkers(!showMarkers)}
          className="w-full px-5 py-3 border-b border-dark-700 flex items-center justify-between hover:bg-dark-700/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Маркеры для замены ({markers.length})</h3>
          </div>
          {showMarkers ? <ChevronUp size={16} className="text-dark-400" /> : <ChevronDown size={16} className="text-dark-400" />}
        </button>
        {showMarkers && (
          <div className="px-5 py-2 animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left text-xs text-dark-400 font-medium py-2 pr-4">Маркер</th>
                    <th className="text-left text-xs text-dark-400 font-medium py-2 pr-4">Описание</th>
                    <th className="text-left text-xs text-dark-400 font-medium py-2">Значение</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {markers.map((m) => (
                    <tr key={m.marker} className="hover:bg-dark-700/20">
                      <td className="py-2 pr-4">
                        <code className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-mono">
                          {`{{${m.marker}}}`}
                        </code>
                      </td>
                      <td className="py-2 pr-4 text-dark-400 text-xs">{m.desc}</td>
                      <td className="py-2 text-white text-xs font-medium max-w-[250px] truncate">{m.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-dark-700 flex items-center gap-2">
          <FileText size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Данные для договора</h3>
        </div>
        <div className="px-5 py-2">
          <DataField label="Номер договора" value={contractData.contractNumber} />
          <DataField label="ФИО Лицензиара" value={contractData.licensorName} />
          <DataField label="Паспорт (серия/номер)" value={contractData.passportSeriesNumber} />
          <DataField label="Кем выдан" value={contractData.passportIssuedBy} />
          <DataField label="Дата выдачи" value={contractData.passportIssueDate} />
          <DataField label="Банковские реквизиты" value={contractData.bankDetails} />
          <DataField label="Email" value={contractData.email} />
          <DataField label="Контакт" value={contractData.contact} />
          <DataField label="Псевдоним" value={contractData.pseudonym} />
          <DataField label="Название произведения" value={contractData.workTitle} />
          <DataField label="Автор музыки" value={contractData.musicAuthor} />
          <DataField label="Автор слов" value={contractData.lyricsAuthor} />
          <DataField label="Тип релиза" value={contractData.releaseType} />
          <DataField label="Тариф" value={contractData.tariff} />
          <DataField label="Процент роялти" value={`${contractData.percentage}% лицензиару / ${100 - contractData.percentage}% лицензиату`} />
          <DataField label="Дата договора" value={contractData.date} />
          <DataField label="Действителен до" value={contractData.futureDate} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Download size={16} className="text-green-400" />
          Действия с договором
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-3 rounded-lg bg-primary-600/20 border border-primary-500/30 text-primary-400 text-sm font-medium hover:bg-primary-600/30 transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            {showPreview ? 'Скрыть предпросмотр' : 'Предпросмотр'}
          </button>
          <button
            onClick={handleCopyText}
            className="px-4 py-3 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-2"
          >
            {textCopied ? <Check size={16} /> : <Copy size={16} />}
            {textCopied ? 'Скопировано!' : 'Копировать текст'}
          </button>
          <button
            onClick={handleDownloadTxt}
            className="px-4 py-3 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-600/30 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Скачать TXT
          </button>
          <button
            onClick={handleDownloadHTML}
            className="px-4 py-3 rounded-lg bg-orange-600/20 border border-orange-500/30 text-orange-400 text-sm font-medium hover:bg-orange-600/30 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Скачать HTML
          </button>
          <button
            onClick={handlePrintSigned}
            className="px-4 py-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={16} />
            Подписать документ
          </button>
        </div>
        <div className="mt-3">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-3 rounded-lg bg-dark-700 border border-dark-600 text-dark-300 text-sm font-medium hover:text-white hover:border-dark-500 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={16} />
            Открыть для печати / сохранить PDF
          </button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden animate-fade-in">
          <div className="px-5 py-3 border-b border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-primary-400" />
              <h3 className="text-sm font-semibold text-white">Предпросмотр договора</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="text-xs px-2.5 py-1 rounded bg-dark-700 text-dark-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <Copy size={12} />
                Копировать
              </button>
              <button
                onClick={handlePrint}
                className="text-xs px-2.5 py-1 rounded bg-dark-700 text-dark-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <Printer size={12} />
                Печать
              </button>
            </div>
          </div>
          <div className="p-5 overflow-x-auto">
            <pre className="text-xs text-dark-200 whitespace-pre-wrap font-mono leading-relaxed bg-dark-900/50 rounded-lg p-6 border border-dark-700/50 max-h-[600px] overflow-y-auto">
              {contractText}
            </pre>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <FileText size={16} className="text-blue-400" />
          </div>
          <div className="text-xs text-dark-400 space-y-1">
            <p className="text-blue-400 font-medium">Инструкция по генерации договора</p>
            <p>1. Проверьте все данные в таблице маркеров выше — они будут подставлены в шаблон</p>
            <p>2. При необходимости измените номер договора (редактирование или генерация нового)</p>
            <p>3. Скачайте договор в формате HTML для печати или сохранения в PDF (через «Печать → Сохранить как PDF»)</p>
            <p>4. Или скопируйте текст для вставки в Google Docs / Word</p>
            <p className="text-dark-500 mt-2">
              Проценты роялти: Базовый — 55%, Продвинутый — 70%, Премиум — 90%, Платинум — 95%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
