import { RefreshCw, CreditCard, FileText, ExternalLink, Info, Download } from 'lucide-react';
import { DistributionData, PromoData, TARIFF_LABELS, RELEASE_TYPE_LABELS } from '../types';

interface SettingsPageProps {
  distributions: DistributionData[];
  promos: PromoData[];
  onResetData: () => void;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-dark-700 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function formatPrice(p: number) {
  return p.toLocaleString('ru-RU') + ' ₽';
}

export function SettingsPage({ distributions, promos, onResetData }: SettingsPageProps) {
  const handleExportDistributions = () => {
    const headers = ['ID', 'Дата', 'Артист', 'Название', 'Тариф', 'Тип', 'Статус', 'Сумма', 'ФИО', 'Email', 'Контакты'];
    const rows = distributions.map(d => [
      d.id,
      new Date(d.submittedAt).toLocaleString('ru-RU'),
      d.mainArtist,
      d.releaseName,
      TARIFF_LABELS[d.tariff],
      RELEASE_TYPE_LABELS[d.releaseType],
      d.status,
      d.totalPrice.toString(),
      d.fullName,
      d.email,
      d.contacts,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pfvmusic_distributions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPromos = () => {
    const headers = ['ID', 'Дата', 'Тип', 'UPC', 'Жанр', 'Дата релиза', 'Статус', 'Контакты'];
    const rows = promos.map(p => [
      p.id,
      new Date(p.submittedAt).toLocaleString('ru-RU'),
      p.type === 'detailed' ? 'Детальное' : 'Еженедельное',
      p.upc,
      p.genre,
      p.releaseDate,
      p.status,
      p.contacts,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pfvmusic_promos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Настройки</h2>
        <p className="text-dark-400 mt-1">Управление данными и справочная информация</p>
      </div>

      {/* Export */}
      <Section title="Экспорт данных" icon={<Download size={16} className="text-green-400" />}>
        <p className="text-sm text-dark-400 mb-4">Экспорт заявок в CSV формат для работы в Excel или Google Sheets</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportDistributions}
            className="px-4 py-2.5 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-600/30 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Экспорт дистрибуции ({distributions.length})
          </button>
          <button
            onClick={handleExportPromos}
            className="px-4 py-2.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Экспорт промо ({promos.length})
          </button>
        </div>
      </Section>

      {/* Payment Details */}
      <Section title="Реквизиты для оплаты" icon={<CreditCard size={16} className="text-primary-400" />}>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Для физических лиц</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { bank: 'СберБанк', card: '4276 6600 2869 0832' },
                { bank: 'Тинькофф', card: '2200 7013 8560 0850' },
                { bank: 'Альфа-Банк', card: '2200 1523 7944 2612' },
                { bank: 'СБП', card: '+7 (995) 488-50-53' },
              ].map(({ bank, card }) => (
                <div key={bank} className="bg-dark-700/50 rounded-lg p-3 border border-dark-600/50">
                  <p className="text-xs text-dark-400 mb-1">{bank}</p>
                  <p className="text-sm text-white font-mono">{card}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Для юридических лиц</h4>
            <div className="bg-dark-700/50 rounded-lg p-4 border border-dark-600/50 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-dark-400">ИНН</span><span className="text-white font-mono">711613056345</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Получатель</span><span className="text-white">ИП Орехов Данила Александрович</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Расчётный счёт</span><span className="text-white font-mono">40802810020000509587</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Банк</span><span className="text-white">ООО "Банк Точка"</span></div>
              <div className="flex justify-between"><span className="text-dark-400">БИК</span><span className="text-white font-mono">044525104</span></div>
            </div>
          </div>
        </div>
      </Section>

      {/* Tariff Prices */}
      <Section title="Тарифы и цены" icon={<Info size={16} className="text-yellow-400" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left text-xs text-dark-400 font-medium py-2 pr-4">Тариф</th>
                <th className="text-right text-xs text-dark-400 font-medium py-2 px-4">Сингл</th>
                <th className="text-right text-xs text-dark-400 font-medium py-2 px-4">EP</th>
                <th className="text-right text-xs text-dark-400 font-medium py-2 px-4">Альбом</th>
                <th className="text-right text-xs text-dark-400 font-medium py-2 pl-4">Караоке/трек</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {(['basic', 'advanced', 'premium', 'platinum'] as const).map(t => (
                <tr key={t}>
                  <td className="py-2 pr-4 text-white font-medium">{TARIFF_LABELS[t]}</td>
                  <td className="py-2 px-4 text-right text-dark-300">{formatPrice({ basic: 500, advanced: 690, premium: 1200, platinum: 4990 }[t])}</td>
                  <td className="py-2 px-4 text-right text-dark-300">{formatPrice({ basic: 700, advanced: 890, premium: 1690, platinum: 6490 }[t])}</td>
                  <td className="py-2 px-4 text-right text-dark-300">{formatPrice({ basic: 900, advanced: 1200, premium: 2290, platinum: 7990 }[t])}</td>
                  <td className="py-2 pl-4 text-right text-dark-300">{t === 'platinum' ? 'Бесплатно' : formatPrice({ basic: 350, advanced: 195, premium: 140, platinum: 0 }[t])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Useful Links */}
      <Section title="Полезные ссылки" icon={<ExternalLink size={16} className="text-blue-400" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: '💰 Тарифы', url: 'https://clck.ru/3E6yBX' },
            { label: '📄 Шаблон договора', url: 'https://disk.yandex.ru/i/pvZXPt4B7t5FIA' },
            { label: '📋 Оферта', url: 'https://disk.yandex.ru/i/PaBzY2OUMJ2ncQ' },
            { label: '🏦 Оплата (Точка)', url: 'https://i.tochka.com/bank/myprofile/pfvmusic' },
            { label: '📱 VK Группа', url: 'https://vk.ru/pfvmusic' },
            { label: '✈️ Telegram канал', url: 'https://t.me/pfvmusic' },
            { label: '🆘 Telegram поддержка', url: 'https://t.me/pfvmusic_support' },
          ].map(({ label, url }) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-dark-700/50 border border-dark-600/50 text-sm text-dark-300 hover:text-white hover:border-primary-500/30 transition-colors group"
            >
              {label}
              <ExternalLink size={14} className="text-dark-500 group-hover:text-primary-400 transition-colors" />
            </a>
          ))}
        </div>
      </Section>

      {/* Documents */}
      <Section title="Документы" icon={<FileText size={16} className="text-orange-400" />}>
        <div className="space-y-3">
          <div className="bg-dark-700/50 rounded-lg p-4 border border-dark-600/50">
            <h4 className="text-sm text-white font-medium mb-2">Согласие на обработку персональных данных</h4>
            <p className="text-xs text-dark-400 leading-relaxed">
              Оператор: ИП Орехов Данила Александрович (ОГРНИП 324710000080681). 
              Обрабатываемые данные: имя, фамилия, псевдоним, название трека, ФИО авторов, жанр, паспортные данные, 
              банковские реквизиты, контакты (Telegram/VK). 
              Цель обработки: предоставление услуг дистрибуции, направление уведомлений, ответы на запросы.
            </p>
          </div>
        </div>
      </Section>

      {/* Data Management */}
      <Section title="Управление данными" icon={<RefreshCw size={16} className="text-red-400" />}>
        <p className="text-sm text-dark-400 mb-4">
          Данные хранятся в localStorage браузера. Вы можете сбросить все данные к демонстрационным значениям.
        </p>
        <button
          onClick={() => {
            if (confirm('Вы уверены? Все изменения будут потеряны, данные будут сброшены к демо-версии.')) {
              onResetData();
            }
          }}
          className="px-4 py-2.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-600/30 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Сбросить данные
        </button>
      </Section>
    </div>
  );
}
