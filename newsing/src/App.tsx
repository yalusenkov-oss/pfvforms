import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ContractInfo } from './components/ContractInfo';
import { ContractDocument } from './components/ContractDocument';
import { SignatureBlock } from './components/SignatureBlock';
import { InfoBlock } from './components/InfoBlock';
import { Footer } from './components/Footer';

const sampleContractHTML = `
<h2 style="text-align:center; font-size:16px; font-weight:bold; margin-bottom:4px;">ЛИЦЕНЗИОННЫЙ ДОГОВОР</h2>
<p style="text-align:center; font-size:13px; margin-bottom:20px;"><strong>№ PFV-202602-8683</strong></p>

<p style="text-align:center; font-size:11px; color:#666; margin-bottom:24px;">г. Москва &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; «15» февраля 2026 г.</p>

<p><strong>Общество с ограниченной ответственностью «ПФВМЬЮЗИК»</strong> (ООО «ПФВМЬЮЗИК»), именуемое в дальнейшем «<strong>Лицензиат</strong>» (Издательство), в лице Генерального директора Иванова Петра Сергеевича, действующего на основании Устава, с одной стороны, и</p>

<p><strong>Смирнов Алексей Дмитриевич</strong>, именуемый(ая) в дальнейшем «<strong>Лицензиар</strong>» (Автор), с другой стороны,</p>

<p>совместно именуемые «Стороны», а по отдельности «Сторона», заключили настоящий Договор о нижеследующем:</p>

<h3 style="margin-top:20px;">1. ПРЕДМЕТ ДОГОВОРА</h3>

<p>1.1. Лицензиар предоставляет Лицензиату неисключительную лицензию на использование музыкального произведения (далее — «Произведение»):</p>

<table style="width:100%; border-collapse:collapse; margin:12px 0;">
  <tr style="background:#f8f7ff;">
    <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold; width:40%;">Название произведения:</td>
    <td style="padding:8px; border:1px solid #e5e7eb;">«Северное сияние»</td>
  </tr>
  <tr>
    <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold;">Автор(ы):</td>
    <td style="padding:8px; border:1px solid #e5e7eb;">Смирнов А.Д.</td>
  </tr>
  <tr style="background:#f8f7ff;">
    <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold;">Тип релиза:</td>
    <td style="padding:8px; border:1px solid #e5e7eb;">Сингл</td>
  </tr>
  <tr>
    <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold;">ISRC:</td>
    <td style="padding:8px; border:1px solid #e5e7eb;">RU-PFV-26-00834</td>
  </tr>
</table>

<p>1.2. Лицензия предоставляется на территории всего мира без ограничения территории использования.</p>

<p>1.3. Срок действия лицензии составляет 3 (три) года с момента подписания настоящего Договора.</p>

<h3 style="margin-top:20px;">2. ПРАВА И ОБЯЗАННОСТИ СТОРОН</h3>

<p>2.1. Лицензиат имеет право:</p>
<ul>
  <li>Осуществлять цифровую дистрибуцию Произведения на всех основных музыкальных платформах (Spotify, Apple Music, Яндекс.Музыка, VK Music, YouTube Music и др.);</li>
  <li>Использовать Произведение в целях промоушена и маркетинга;</li>
  <li>Осуществлять сублицензирование прав в рамках дистрибуции;</li>
  <li>Собирать и распределять роялти от использования Произведения.</li>
</ul>

<p>2.2. Лицензиар обязуется:</p>
<ul>
  <li>Гарантировать, что является правообладателем Произведения;</li>
  <li>Предоставить качественные аудиоматериалы в формате WAV (44.1kHz / 16bit или выше);</li>
  <li>Предоставить обложку в формате JPEG/PNG (минимум 3000×3000px);</li>
  <li>Не предоставлять аналогичные права третьим лицам на срок действия настоящего Договора.</li>
</ul>

<h3 style="margin-top:20px;">3. ФИНАНСОВЫЕ УСЛОВИЯ</h3>

<p>3.1. Распределение доходов от использования Произведения осуществляется в следующем соотношении:</p>

<table style="width:100%; border-collapse:collapse; margin:12px 0;">
  <tr style="background:#f0fdf4;">
    <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold;">Лицензиар (Автор):</td>
    <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold; color:#16a34a;">80%</td>
  </tr>
  <tr style="background:#f8f7ff;">
    <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold;">Лицензиат (Издательство):</td>
    <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold; color:#7c3aed;">20%</td>
  </tr>
</table>

<p>3.2. Выплаты осуществляются ежемесячно, не позднее 15-го числа месяца, следующего за отчётным.</p>

<p>3.3. Минимальный порог выплаты составляет 1 000 (одна тысяча) рублей. В случае если сумма накопленных роялти не достигает минимального порога, выплата переносится на следующий отчётный период.</p>

<h3 style="margin-top:20px;">4. СРОК ДЕЙСТВИЯ И РАСТОРЖЕНИЕ</h3>

<p>4.1. Настоящий Договор вступает в силу с момента его подписания обеими Сторонами.</p>

<p>4.2. Любая из Сторон вправе расторгнуть настоящий Договор, уведомив другую Сторону в письменной форме не менее чем за 30 (тридцать) календарных дней.</p>

<p>4.3. В случае расторжения Договора все ранее размещённые релизы остаются на платформах до истечения естественного срока действия лицензий субплатформ.</p>

<h3 style="margin-top:20px;">5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</h3>

<p>5.1. Все споры и разногласия, возникающие между Сторонами по настоящему Договору, решаются путём переговоров.</p>

<p>5.2. В случае невозможности разрешения споров путём переговоров, они подлежат рассмотрению в суде по месту нахождения Лицензиата.</p>

<p>5.3. Настоящий Договор составлен в электронной форме и имеет юридическую силу с момента его электронного подписания обеими Сторонами.</p>

<div style="margin-top:32px; padding-top:20px; border-top:1px solid #e5e7eb;">
  <h3>РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</h3>
  
  <div style="display:flex; gap:24px; margin-top:16px;">
    <div style="flex:1;">
      <p style="font-weight:bold; margin-bottom:8px;">Лицензиат:</p>
      <p>ООО «ПФВМЬЮЗИК»</p>
      <p>ИНН: 7707123456</p>
      <p>ОГРН: 1167746123456</p>
      <p style="margin-top:12px;">Генеральный директор</p>
      <p>_____________ / Иванов П.С. /</p>
    </div>
    <div style="flex:1;">
      <p style="font-weight:bold; margin-bottom:8px;">Лицензиар:</p>
      <p>Смирнов Алексей Дмитриевич</p>
      <p>Паспорт: **** ******</p>
      <p style="margin-top:12px;">Автор</p>
      <p>_____________ / Смирнов А.Д. /</p>
    </div>
  </div>
</div>
`;

export function App() {
  const [isSigned, setIsSigned] = useState(false);
  const [signedDate, setSignedDate] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const handleSign = useCallback(() => {
    const now = new Date();
    const formatted = now.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setIsSigned(true);
    setSignedDate(formatted);
  }, []);

  const handleSigningStart = useCallback(() => {
    setShowOverlay(true);
  }, []);

  const handleOverlayComplete = useCallback(() => {
    setShowOverlay(false);
  }, []);

  const handleSignatureChange = useCallback((data: string | null) => {
    setSignatureData(data);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contract Info — full width */}
        <div className="animate-fade-in-up mb-6" style={{ animationDelay: '0.1s' }}>
          <ContractInfo
            contractNumber="PFV-202602-8683"
            trackName="Северное сияние"
            authorName="Смирнов Алексей Дмитриевич"
            releaseType="Сингл"
          />
        </div>

        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left column: Contract Document (takes 3/5 on xl) */}
          <div className="xl:col-span-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <ContractDocument htmlContent={sampleContractHTML} />
          </div>

          {/* Right column: Signature + Info (takes 2/5 on xl) */}
          <div className="xl:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <SignatureBlock
              isSigned={isSigned}
              signedDate={signedDate}
              onSign={handleSign}
              onSigningStart={handleSigningStart}
              showOverlay={showOverlay}
              onOverlayComplete={handleOverlayComplete}
              signatureData={signatureData}
              onSignatureChange={handleSignatureChange}
            />

            <InfoBlock />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
