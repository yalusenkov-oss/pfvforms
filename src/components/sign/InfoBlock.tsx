import { Info } from 'lucide-react';

export function InfoBlock() {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-purple-50/50 rounded-2xl border border-purple-100 p-3 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] sm:text-sm font-semibold text-purple-900">ℹ️ Важная информация</p>
          <p className="text-[11px] sm:text-sm text-purple-800/80 leading-relaxed">
            Подписав этот договор, вы подтверждаете, что согласны со всеми условиями лицензионного соглашения. 
            Договор вступает в силу с момента подписания обеими сторонами. Копия подписанного договора будет 
            отправлена на вашу электронную почту и доступна для скачивания в личном кабинете.
          </p>
          <p className="text-[11px] sm:text-sm text-purple-800/80 leading-relaxed">
            В случае возникновения вопросов, пожалуйста, свяжитесь с нами по адресу{' '}
            <a href="mailto:booking@pfvmusic.ru" className="font-semibold text-purple-700 hover:text-purple-900 underline underline-offset-2">
              booking@pfvmusic.ru
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
