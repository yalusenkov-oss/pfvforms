import { ArrowLeft, Music } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-md shadow-purple-200">
            <Music className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-lg font-extrabold text-gray-900 leading-tight tracking-tight">PFVMUSIC</span>
            <span className="text-[9px] sm:text-[11px] text-purple-600 font-medium -mt-0.5">Издательство</span>
          </div>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl text-[11px] sm:text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          На главную
        </a>
      </div>
    </header>
  );
}
