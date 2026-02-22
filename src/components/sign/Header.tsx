import { ArrowLeft, Music } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-purple-600 flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-black text-gray-900 leading-none tracking-tight">PFVMUSIC</span>
            <span className="text-[11px] font-bold text-purple-600 mt-1">Издательство</span>
          </div>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </a>
      </div>
    </header>
  );
}
