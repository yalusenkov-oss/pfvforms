import { useState } from 'react';
import { Music, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authenticate } from '../store';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!login.trim() || !password.trim()) {
      setError('Введите логин и пароль');
      return;
    }

    setIsLoading(true);

    // Simulate a slight delay for UX
    setTimeout(() => {
      const success = authenticate(login.trim(), password);
      if (success) {
        onLogin();
      } else {
        setError('Неверный логин или пароль');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25 mb-4">
            <Music size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">PFVMUSIC</h1>
          <p className="text-dark-400 mt-1 text-sm">Вход в админ-панель</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-dark-900 border border-dark-700 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 animate-fade-in">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Login field */}
          <div className="space-y-2">
            <label className="text-sm text-dark-300 font-medium">Логин</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="Введите логин"
                className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label className="text-sm text-dark-300 font-medium">Пароль</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold text-sm hover:from-primary-500 hover:to-primary-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Вход...
              </>
            ) : (
              <>
                <Lock size={16} />
                Войти
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-dark-500">
            ИП Орехов Данила Александрович · ОГРНИП 324710000080681
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <a href="https://t.me/pfvmusic_support" target="_blank" rel="noopener noreferrer" className="text-xs text-dark-400 hover:text-primary-400 transition-colors">
              Поддержка
            </a>
            <span className="text-dark-700">·</span>
            <a href="https://t.me/pfvmusic" target="_blank" rel="noopener noreferrer" className="text-xs text-dark-400 hover:text-primary-400 transition-colors">
              Telegram
            </a>
            <span className="text-dark-700">·</span>
            <a href="https://vk.ru/pfvmusic" target="_blank" rel="noopener noreferrer" className="text-xs text-dark-400 hover:text-primary-400 transition-colors">
              VK
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
