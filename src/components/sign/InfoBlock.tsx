import { Info } from 'lucide-react';

export function InfoBlock() {
  return (
    <div className="bg-[#faf5ff] rounded-[20px] border border-purple-100/60 p-8">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-[12px] bg-purple-100/80 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-purple-600" />
        </div>
        <div className="space-y-3">
          <p className="text-[16px] font-bold text-purple-900 flex items-center gap-2">Важная информация</p>
          <p className="text-[14.5px] text-purple-800/80 leading-relaxed font-medium">
            Подписав этот договор, вы подтверждаете, что согласны со всеми условиями лицензионного соглашения.
            Договор вступает в силу с момента подписания обеими сторонами. Копия подписанного договора будет
            отправлена на вашу электронную почту и доступна для скачивания в личном кабинете.
          </p>
          <p className="text-[14.5px] text-purple-800/80 leading-relaxed font-medium">
            В случае возникновения вопросов, пожалуйста, свяжитесь с нами по адресу{' '}
            <a href="mailto:booking@pfvmusic.ru" className="font-bold text-purple-700 hover:text-purple-900 underline underline-offset-2">
              booking@pfvmusic.ru
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
