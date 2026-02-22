import { Music, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200/60 bg-white/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">PFVMUSIC</p>
              <p className="text-xs text-gray-500">Музыкальное издательство</p>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              <a href="mailto:booking@pfvmusic.ru" className="hover:text-purple-600 transition-colors">
                booking@pfvmusic.ru
              </a>
            </div>
            <p className="text-xs text-gray-400">© 2026 PFVMUSIC. Все права защищены.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
