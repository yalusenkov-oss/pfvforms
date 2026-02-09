import { Input, StepCard, InfoBox, Divider } from './UI';
import { CreditCard, MessageCircle, Send, ExternalLink, Building2, Smartphone, Heart, Calculator, ReceiptText, MessageSquare, UserCheck, Megaphone } from 'lucide-react';
import { calcTotal, getTrackCount } from './StepOne';

interface StepFourProps {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onGoToPromo?: () => void;
}

const KARAOKE_PRICES: Record<string, number> = {
  'Базовый': 350,
  'Продвинутый': 195,
  'Премиум': 140,
  'Платинум': 0,
};

export function StepFour({ data, onChange, onGoToPromo }: StepFourProps) {
  const tariff = data.tariff || '';
  const releaseType = data.releaseType || '';
  const trackCount = getTrackCount(data);
  const { base, karaoke, total } = calcTotal(data);
  const hasSelection = tariff && releaseType;

  return (
    <div className="space-y-6">
      {/* ═══ Payment Details ═══ */}
      <StepCard
        title="Реквизиты для оплаты"
        subtitle="Произведите оплату удобным способом"
        icon={<CreditCard className="w-5 h-5" />}
      >
        {/* Pricing info */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-700 mb-3">💰 Стоимость тарифов:</p>
          <div className="space-y-3 text-xs">
            <TariffPriceRow name="Базовый" emoji="📦" single="500" ep="700" album="900" active={tariff === 'Базовый'} />
            <TariffPriceRow name="Продвинутый" emoji="🚀" single="690" ep="890" album="1 200" active={tariff === 'Продвинутый'} />
            <TariffPriceRow name="Премиум" emoji="⭐" single="1 200" ep="1 690" album="2 290" active={tariff === 'Премиум'} />
            <TariffPriceRow name="Платинум" emoji="👑" single="4 990" ep="6 490" album="7 990" active={tariff === 'Платинум'} />
          </div>
        </div>

        {/* Physical Persons */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-sm">Для физических лиц</h3>
          </div>
          <div className="space-y-2">
            <BankCard name="СберБанк" number="4276 6600 2869 0832" color="bg-green-600" emoji="💚" />
            <BankCard name="Тинькофф" number="2200 7013 8560 0850" color="bg-yellow-500" emoji="💛" />
            <BankCard name="Альфа-Банк" number="2200 1523 7944 2612" color="bg-red-500" emoji="❤️" />
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200/60 px-4 py-3">
            <Smartphone className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="text-blue-700">Оплата через СБП:</span>{' '}
              <span className="font-bold text-blue-900 font-mono">+7 (995) 488-50-53</span>
            </div>
          </div>
        </div>

        <Divider label="Юридические лица" />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-sm">Для юридических лиц</h3>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2 text-xs">
            <DetailRow label="ИНН" value="711613056345" />
            <DetailRow label="Получатель" value="ИП Орехов Данила Александрович" />
            <DetailRow label="Расчётный счёт" value="40802810020000509587" mono />
            <DetailRow label="Банк" value='ООО «Банк Точка»' />
            <DetailRow label="БИК" value="044525104" mono />
            <div className="pt-2 border-t border-gray-200">
              <a href="https://i.tochka.com/bank/myprofile/pfvmusic" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-purple-700 underline hover:text-purple-900 text-xs font-medium transition-colors">
                <ExternalLink className="w-3 h-3" /> Профиль в Точка Банке
              </a>
            </div>
          </div>
        </div>
      </StepCard>

      {/* ═══ Contacts & Extras (moved from StepOne) ═══ */}
      <StepCard
        title="Контакты и дополнительно"
        subtitle="Информация для обратной связи"
        icon={<MessageSquare className="w-5 h-5" />}
      >
        <Input label="Контакты для связи" required icon={<MessageSquare className="w-4 h-4" />}
          hint="Оставьте свой Telegram или VK для обратной связи."
          value={data.contactInfo || ''} onChange={(e) => onChange('contactInfo', e.target.value)}
          placeholder="@username или ссылка" />

        <Input label="Ссылки на профиль артиста на площадках" icon={<UserCheck className="w-4 h-4" />}
          hint="Чтобы релиз попал в нужную картотеку, оставьте ссылки на профиль."
          value={data.artistProfileLinks || ''} onChange={(e) => onChange('artistProfileLinks', e.target.value)}
          placeholder="Ссылки на профили" />
      </StepCard>

      {/* ═══ After Submission ═══ */}
      <StepCard
        title="После отправки"
        subtitle="Важная информация и контакты"
        icon={<Send className="w-5 h-5" />}
      >
        <InfoBox variant="purple">
          <div>
            <p className="font-semibold mb-1">📌 Что делать после отправки?</p>
            <p className="text-xs mb-2">Свяжитесь с нами для подтверждения данных.</p>
            {onGoToPromo && (
              <button
                type="button"
                onClick={onGoToPromo}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
              >
                <Megaphone className="w-3.5 h-3.5" />
                Перейти к форме промо
              </button>
            )}
          </div>
        </InfoBox>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="https://t.me/pfvmusic_support" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/30 px-5 py-4 text-sm font-semibold text-blue-700 hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs text-blue-500">Telegram</p>
              <p className="text-sm font-bold">PFVMUSIC Support</p>
            </div>
          </a>
          <a href="https://vk.com/pfvmusic" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/30 px-5 py-4 text-sm font-semibold text-blue-700 hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs text-blue-500">ВКонтакте</p>
              <p className="text-sm font-bold">PFVMUSIC</p>
            </div>
          </a>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/30 border border-purple-200/60 p-5 text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="font-bold text-purple-800 text-sm">
            ⚠️ Не забудьте отправить форму!
          </p>
          <p className="text-xs text-purple-600/80">
            В противном случае мы не сможем получить информацию о вашем релизе.
          </p>
          <p className="text-sm font-semibold text-purple-700 pt-1">
            Спасибо, что выбрали нас! Мы ценим ваше доверие 💜
          </p>
        </div>
      </StepCard>

      {/* ═══ TOTAL PRICE — at the very end ═══ */}
      {hasSelection ? (
        <div className="rounded-2xl border-2 border-purple-400 bg-gradient-to-br from-purple-50 via-white to-purple-50/30 p-6 md:p-8 shadow-xl shadow-purple-200/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/20 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-200/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="flex items-center gap-3 mb-5 relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-200">
              <ReceiptText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Итого к оплате</h2>
              <p className="text-sm text-gray-500">Расчёт на основе выбранных параметров</p>
            </div>
          </div>

          <div className="space-y-3 relative">
            <div className="flex items-center justify-between text-sm bg-white/60 rounded-xl px-4 py-3 border border-purple-100">
              <div>
                <p className="text-gray-700 font-semibold">Тариф «{tariff}»</p>
                <p className="text-xs text-gray-400">
                  {releaseType} · {trackCount} {trackCount === 1 ? 'трек' : trackCount < 5 ? 'трека' : 'треков'}
                </p>
              </div>
              <p className="font-bold text-gray-900 text-base">{base.toLocaleString('ru-RU')} ₽</p>
            </div>

            {data.karaokeAddition === 'Да' && (
              <div className="flex items-center justify-between text-sm bg-white/60 rounded-xl px-4 py-3 border border-purple-100">
                <div>
                  <p className="text-gray-700 font-semibold">Караоке</p>
                  <p className="text-xs text-gray-400">
                    {KARAOKE_PRICES[tariff] || 0} ₽ × {trackCount} {trackCount === 1 ? 'трек' : trackCount < 5 ? 'трека' : 'треков'}
                  </p>
                </div>
                <p className="font-bold text-gray-900 text-base">
                  {karaoke === 0 ? 'Бесплатно' : `${karaoke.toLocaleString('ru-RU')} ₽`}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t-2 border-purple-300/50">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                <p className="text-lg font-extrabold text-purple-800">Итого</p>
              </div>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                {total.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        </div>
      ) : (
        <InfoBox variant="warning">
          <p className="text-sm font-medium">
            Для расчёта итоговой стоимости вернитесь на шаг «Релиз» и выберите тариф и тип релиза.
          </p>
        </InfoBox>
      )}
    </div>
  );
}

/* ─── Tariff Price Row ─── */
function TariffPriceRow({ name, emoji, single, ep, album, active }: {
  name: string; emoji: string; single: string; ep: string; album: string; active: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg px-3 py-2 transition-all ${active ? 'bg-purple-100 border border-purple-300' : 'bg-white border border-gray-100'}`}>
      <span className="text-sm">{emoji}</span>
      <span className={`font-semibold flex-shrink-0 w-20 sm:w-24 ${active ? 'text-purple-800' : 'text-gray-700'}`}>{name}</span>
      <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        <span className="text-gray-500">Сингл: <strong className="text-gray-800">{single} ₽</strong></span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span className="text-gray-500">EP: <strong className="text-gray-800">{ep} ₽</strong></span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span className="text-gray-500">Альбом: <strong className="text-gray-800">{album} ₽</strong></span>
      </div>
      {active && <span className="text-[9px] font-bold text-purple-700 bg-purple-200 px-2 py-0.5 rounded-full flex-shrink-0">Выбран</span>}
    </div>
  );
}

function BankCard({ name, number, color, emoji }: { name: string; number: string; color: string; emoji: string }) {
  const handleCopy = () => {
    navigator.clipboard?.writeText(number.replace(/\s/g, ''));
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 px-4 py-3 hover:shadow-sm transition-shadow">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <span className="text-sm">{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 font-medium">{name}</p>
        <p className="font-mono font-bold text-gray-900 text-sm tracking-wide">{number}</p>
      </div>
      <button type="button" onClick={handleCopy}
        className="text-[10px] text-purple-600 hover:text-purple-800 font-medium px-2 py-1 rounded-md hover:bg-purple-50 transition-colors flex-shrink-0 active:scale-95">
        Копировать
      </button>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 flex-shrink-0">{label}:</span>
      <span className={`font-semibold text-gray-900 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
