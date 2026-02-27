import { useEffect, useState } from 'react';
import { Input, StepCard, InfoBox } from './UI';
import { CreditCard, Calculator, ReceiptText, MessageSquare, UserCheck, TicketPercent, CheckCircle2, XCircle, Send, MessageCircle, Loader2, Wallet, ShieldCheck } from 'lucide-react';
import { calcTotal, getTrackCount } from './StepOne';
import { fetchPromoCodes, PromoCodeRecord } from '@/services/googleSheets';
import { createPayment, checkPaymentStatus } from '@/services/payment';

interface StepFourProps {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
  preloadedPromoCodes?: PromoCodeRecord[];
  promoCodesReady?: boolean;
}

const KARAOKE_PRICES: Record<string, number> = {
  'Базовый': 350,
  'Продвинутый': 195,
  'Премиум': 140,
  'Платинум': 0,
};

export function StepFour({ data, onChange, preloadedPromoCodes, promoCodesReady }: StepFourProps) {
  const tariff = data.tariff || '';
  const releaseType = data.releaseType || '';
  const trackCount = getTrackCount(data);
  const { base, karaoke } = calcTotal(data);
  const hasSelection = tariff && releaseType;
  const [promoCodes, setPromoCodes] = useState<PromoCodeRecord[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<string>('');
  const [promoError, setPromoError] = useState<string>('');
  const [paymentCreating, setPaymentCreating] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentPolling, setPaymentPolling] = useState(false);
  const tariffMap: Record<string, string> = {
    'Базовый': 'basic',
    'Продвинутый': 'advanced',
    'Премиум': 'premium',
    'Платинум': 'platinum',
  };
  const releaseTypeMap: Record<string, string> = {
    'Single': 'single',
    'EP': 'ep',
    'Album': 'album',
  };

  const totalBeforeDiscount = base + karaoke;
  const appliedDiscount = parseFloat(data.promoDiscountAmount || '0') || 0;
  const totalAfterDiscount = Math.max(0, totalBeforeDiscount - (data.promoApplied === 'yes' ? appliedDiscount : 0));

  useEffect(() => {
    // If promo codes were preloaded in the parent, use them directly
    if (preloadedPromoCodes && preloadedPromoCodes.length > 0) {
      setPromoCodes(preloadedPromoCodes);
      setPromoLoading(false);
      return;
    }
    // If parent says codes are ready (even if empty array), don't fetch
    if (promoCodesReady) {
      setPromoLoading(false);
      return;
    }
    // Fallback: fetch ourselves
    let mounted = true;
    setPromoLoading(true);
    fetchPromoCodes()
      .then((rows) => {
        if (!mounted) return;
        setPromoCodes(rows || []);
      })
      .catch(() => {
        if (!mounted) return;
        setPromoCodes([]);
      })
      .finally(() => {
        if (!mounted) return;
        setPromoLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [preloadedPromoCodes, promoCodesReady]);

  // Restore promo success message when remounting with already-applied promo
  useEffect(() => {
    if (data.promoApplied === 'yes' && data.promoDiscountAmount) {
      setPromoMessage(`Промокод применён: -${parseFloat(data.promoDiscountAmount).toLocaleString('ru-RU')} ₽`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validatePromo = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return { ok: false, error: 'Введите промокод' };

    const promo = promoCodes.find((p) => p.code.toUpperCase() === normalized);
    if (!promo) return { ok: false, error: 'Промокод не найден' };
    if (!promo.isActive) return { ok: false, error: 'Промокод неактивен' };
    if (promo.currentUses >= promo.maxUses) return { ok: false, error: 'Лимит использований исчерпан' };

    const now = new Date();
    if (promo.validFrom && new Date(promo.validFrom) > now) return { ok: false, error: 'Промокод ещё не активен' };
    if (promo.validUntil && new Date(promo.validUntil) < now) return { ok: false, error: 'Срок действия истёк' };

    const tariffEn = tariffMap[tariff] || '';
    const releaseTypeEn = releaseTypeMap[releaseType] || '';
    if (tariffEn && promo.applicableTariffs.length > 0 && !promo.applicableTariffs.includes(tariffEn)) {
      return { ok: false, error: 'Промокод не подходит для выбранного тарифа' };
    }
    if (releaseTypeEn && promo.applicableReleaseTypes.length > 0 && !promo.applicableReleaseTypes.includes(releaseTypeEn)) {
      return { ok: false, error: 'Промокод не подходит для выбранного типа релиза' };
    }

    const discountRaw = promo.discountType === 'percent'
      ? Math.round(totalBeforeDiscount * (promo.discountValue / 100))
      : Math.round(promo.discountValue);
    const discountAmount = Math.min(totalBeforeDiscount, Math.max(0, discountRaw));

    return { ok: true, promo, discountAmount };
  };

  const applyPromo = () => {
    setPromoError('');
    setPromoMessage('');

    if (!hasSelection) {
      setPromoError('Сначала выберите тариф и тип релиза');
      return;
    }

    const code = data.promoCode || '';
    const result = validatePromo(code);
    if (!result.ok) {
      onChange('promoApplied', 'no');
      onChange('promoDiscountType', '');
      onChange('promoDiscountValue', '');
      onChange('promoDiscountAmount', '');
      setPromoError(result.error || 'Промокод не применён');
      return;
    }

    onChange('promoApplied', 'yes');
    onChange('promoCode', result.promo!.code);
    onChange('promoDiscountType', result.promo!.discountType);
    onChange('promoDiscountValue', String(result.promo!.discountValue));
    onChange('promoDiscountAmount', String(result.discountAmount!));
    setPromoMessage(`Промокод применён: -${result.discountAmount!.toLocaleString('ru-RU')} ₽`);
  };

  useEffect(() => {
    if (data.promoApplied !== 'yes') return;
    if (!data.promoCode) return;
    // Don't re-validate while promo codes are still loading — prevents
    // resetting a previously-applied code when StepFour remounts.
    if (promoLoading || promoCodes.length === 0) return;
    const result = validatePromo(data.promoCode);
    if (!result.ok) {
      onChange('promoApplied', 'no');
      onChange('promoDiscountType', '');
      onChange('promoDiscountValue', '');
      onChange('promoDiscountAmount', '');
      setPromoMessage('');
      setPromoError(result.error || 'Промокод неактуален');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tariff, releaseType, base, karaoke, promoCodes, promoLoading]);

  const handlePayment = async () => {
    if (!hasSelection) return;
    setPaymentError('');
    setPaymentCreating(true);

    try {
      const result = await createPayment({
        amount: totalAfterDiscount,
        description: `Дистрибуция PFVMUSIC — ${tariff}, ${releaseType}`,
        metadata: {
          tariff,
          releaseType,
          trackCount: String(trackCount),
          promoCode: data.promoCode || '',
        },
      });

      if (!result.success || !result.confirmationUrl || !result.paymentId) {
        setPaymentError(result.error || 'Не удалось создать платёж');
        setPaymentCreating(false);
        return;
      }

      // Store the payment ID in formData so we can track it
      onChange('paymentId', result.paymentId);
      onChange('paymentStatus', 'pending');

      // Persist paymentId to localStorage before redirect
      // (React state will be lost when navigating away)
      localStorage.setItem('pfv_paymentId', result.paymentId);

      // Redirect user to YooKassa payment page
      window.location.href = result.confirmationUrl;
    } catch (err) {
      console.error('[StepFour] payment error:', err);
      setPaymentError('Произошла ошибка при создании платежа. Попробуйте ещё раз.');
      setPaymentCreating(false);
    }
  };

  // When the component mounts, check if we're returning from YooKassa
  useEffect(() => {
    // Check URL for paymentComplete flag first
    const params = new URLSearchParams(window.location.search);
    if (!params.has('paymentComplete')) return;

    // Restore paymentId from localStorage if not in formData
    let paymentId = data.paymentId;
    if (!paymentId) {
      paymentId = localStorage.getItem('pfv_paymentId') || '';
      if (paymentId) {
        onChange('paymentId', paymentId);
      }
    }
    if (!paymentId) return;

    // Already confirmed? Skip polling
    if (data.paymentStatus === 'succeeded') {
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('paymentComplete');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      return;
    }

    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('paymentComplete');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);

    // Poll for payment status
    let cancelled = false;
    setPaymentPolling(true);

    const poll = async () => {
      for (let i = 0; i < 20; i++) {
        if (cancelled) return;
        const status = await checkPaymentStatus(paymentId);
        if (status.success) {
          if (status.status === 'succeeded') {
            onChange('paymentStatus', 'succeeded');
            onChange('paymentProof', `yookassa:${paymentId}`);
            localStorage.removeItem('pfv_paymentId');
            setPaymentPolling(false);
            return;
          }
          if (status.status === 'canceled') {
            onChange('paymentStatus', 'canceled');
            localStorage.removeItem('pfv_paymentId');
            setPaymentError('Платёж был отменён. Попробуйте оплатить ещё раз.');
            setPaymentPolling(false);
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      // Timeout
      setPaymentPolling(false);
      setPaymentError('Не удалось подтвердить статус платежа. Если вы оплатили, свяжитесь с нами.');
    };

    poll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* ═══ Contacts & Extras — FIRST ═══ */}
      <StepCard
        title="Дополнительно"
        subtitle="Дополнительная информация"
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

      {/* ═══ Payment Info ═══ */}
      <StepCard
        title="Оплата"
        subtitle="Безопасная оплата через ЮKassa"
        icon={<CreditCard className="w-5 h-5" />}
      >
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-gray-700">
              Приём платежей осуществляет ЮKassa — сертифицированный платёжный сервис
            </p>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Банковские карты (Visa, MasterCard, МИР)</p>
            <p>• СБП (Система быстрых платежей)</p>
            <p>• ЮMoney и другие способы</p>
          </div>
        </div>

        {data.paymentStatus === 'succeeded' && (
          <div className="mt-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">Оплата прошла успешно!</p>
              <p className="text-xs text-green-600 mt-0.5">ID платежа: {data.paymentId}</p>
            </div>
          </div>
        )}

        {data.paymentStatus === 'canceled' && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold">Платёж отменён</p>
              <p className="text-xs text-red-600 mt-0.5">Вы можете попробовать оплатить ещё раз</p>
            </div>
          </div>
        )}

        {paymentPolling && (
          <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
            <div>
              <p className="font-semibold">Проверяем статус платежа...</p>
              <p className="text-xs text-blue-600 mt-0.5">Пожалуйста, подождите</p>
            </div>
          </div>
        )}

        {paymentError && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>{paymentError}</span>
          </div>
        )}
      </StepCard>

      {/* ═══ Promo Code ═══ */}
      <StepCard
        title="Промокод"
        subtitle="Введите промокод перед оплатой"
        icon={<TicketPercent className="w-5 h-5" />}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              label="Промокод"
              icon={<TicketPercent className="w-4 h-4" />}
              placeholder="PFV10, WELCOME20..."
              value={data.promoCode || ''}
              onChange={(e) => onChange('promoCode', e.target.value.toUpperCase())}
            />
          </div>
          <div className="sm:pt-7">
            <button
              type="button"
              onClick={applyPromo}
              disabled={promoLoading}
              className="w-full sm:w-auto inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 text-sm font-semibold shadow-sm disabled:opacity-60"
            >
              <TicketPercent className="w-4 h-4" />
              {promoLoading ? 'Загрузка...' : 'Применить'}
            </button>
          </div>
        </div>

        {(promoMessage || promoError) && (
          <div className={`mt-3 rounded-xl px-4 py-3 text-sm ${promoError ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
            <div className="flex items-center gap-2">
              {promoError ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{promoError || promoMessage}</span>
            </div>
          </div>
        )}
      </StepCard>

      {/* ═══ TOTAL PRICE + After Submission ═══ */}
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

            {data.promoApplied === 'yes' && (
              <div className="flex items-center justify-between text-sm bg-white/60 rounded-xl px-4 py-3 border border-purple-100">
                <div>
                  <p className="text-gray-700 font-semibold">Промокод {data.promoCode}</p>
                  <p className="text-xs text-gray-400">
                    Скидка {data.promoDiscountType === 'percent' ? `${data.promoDiscountValue}%` : `${Number(data.promoDiscountValue || 0).toLocaleString('ru-RU')} ₽`}
                  </p>
                </div>
                <p className="font-bold text-gray-900 text-base">
                  -{(parseFloat(data.promoDiscountAmount || '0') || 0).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t-2 border-purple-300/50">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                <p className="text-lg font-extrabold text-purple-800">Итого</p>
              </div>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                {totalAfterDiscount.toLocaleString('ru-RU')} ₽
              </p>
            </div>

            <div className="pt-4 mt-2 border-t border-purple-200/60">
              {data.paymentStatus === 'succeeded' ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Оплата подтверждена ✓</p>
                    <p className="text-xs text-green-600">Нажмите «Отправить» для завершения</p>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={paymentCreating || paymentPolling || totalAfterDiscount <= 0}
                    className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 px-6 py-4 text-base font-bold text-white shadow-lg shadow-purple-300/50 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {paymentCreating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Переход к оплате...
                      </>
                    ) : paymentPolling ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Проверка платежа...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        Оплатить {totalAfterDiscount.toLocaleString('ru-RU')} ₽
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    Вы будете перенаправлены на страницу оплаты ЮKassa
                  </p>
                </>
              )}
            </div>

            {/* After submission — compact */}
            <div className="pt-4 mt-2 border-t border-purple-200/60 space-y-3">
              <p className="text-xs font-semibold text-gray-700">📌 После отправки — подпишите договор и свяжитесь с нами:</p>
              <div className="grid grid-cols-2 gap-2">
                <a href="https://t.me/pfvmusic_support" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-700 hover:border-blue-300">
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </a>
                <a href="https://vk.com/pfvmusic" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-700 hover:border-blue-300">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>ВКонтакте</span>
                </a>
              </div>
              <p className="text-[11px] text-purple-600/80 text-center">
                ⚠️ Не забудьте отправить форму! Спасибо, что выбрали нас 💜
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


