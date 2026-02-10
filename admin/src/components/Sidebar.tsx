import { LayoutDashboard, Disc3, Megaphone, Settings, Music, ExternalLink, MessageCircle, X, Menu, Ticket, LogOut } from 'lucide-react';
import { AdminTab } from '../types';
import { cn } from '../utils/cn';

interface SidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const NAV_ITEMS: { tab: AdminTab; label: string; icon: React.ReactNode }[] = [
  { tab: 'dashboard', label: 'Дашборд', icon: <LayoutDashboard size={20} /> },
  { tab: 'distributions', label: 'Дистрибуция', icon: <Disc3 size={20} /> },
  { tab: 'promos', label: 'Промо', icon: <Megaphone size={20} /> },
  { tab: 'promocodes', label: 'Промокоды', icon: <Ticket size={20} /> },
  { tab: 'settings', label: 'Настройки', icon: <Settings size={20} /> },
];

const EXTERNAL_LINKS = [
  { label: 'VK Группа', url: 'https://vk.ru/pfvmusic', icon: <ExternalLink size={16} /> },
  { label: 'Telegram канал', url: 'https://t.me/pfvmusic', icon: <MessageCircle size={16} /> },
  { label: 'Поддержка', url: 'https://t.me/pfvmusic_support', icon: <MessageCircle size={16} /> },
];

export function Sidebar({ activeTab, onTabChange, isOpen, onToggle, onLogout }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggle} />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden bg-dark-800 border border-dark-700 p-2 rounded-lg text-white hover:bg-dark-700 transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-dark-900 border-r border-dark-700 z-40 flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Music size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">PFVMUSIC</h1>
              <p className="text-xs text-dark-400">Админ-панель</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs text-dark-500 uppercase tracking-wider px-3 mb-3 font-medium">Меню</p>
          {NAV_ITEMS.map(({ tab, label, icon }) => (
            <button
              key={tab}
              onClick={() => {
                onTabChange(tab);
                if (window.innerWidth < 1024) onToggle();
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === tab
                  ? 'bg-primary-600/20 text-primary-400 shadow-sm'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              )}
            >
              {icon}
              {label}
            </button>
          ))}

          <div className="pt-6">
            <p className="text-xs text-dark-500 uppercase tracking-wider px-3 mb-3 font-medium">Ссылки</p>
            {EXTERNAL_LINKS.map(({ label, url, icon }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-400 hover:text-white hover:bg-dark-800 transition-all duration-200"
              >
                {icon}
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* Bottom info */}
        <div className="p-4 border-t border-dark-700 space-y-3">
          <div className="bg-dark-800 rounded-lg p-3">
            <p className="text-xs text-dark-400">ИП Орехов Д.А.</p>
            <p className="text-xs text-dark-500 mt-1">ОГРНИП 324710000080681</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
}
