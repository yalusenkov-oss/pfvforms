import { useState, useEffect } from 'react';
import { Search, Lock, PenTool, Sparkles, PartyPopper } from 'lucide-react';

const steps = [
  { icon: Search, emoji: '🔍', text: 'Проверяем данные договора…', duration: 1200 },
  { icon: Lock, emoji: '🔐', text: 'Шифруем вашу подпись квантовым ключом…', duration: 1500 },
  { icon: PenTool, emoji: '🖊️', text: 'Ставим вашу подпись…', duration: 1800 },
  { icon: Sparkles, emoji: '🦋', text: 'Договор обретает юридическую силу…', duration: 1200 },
  { icon: PartyPopper, emoji: '🎉', text: 'Поздравляем, всё официально!', duration: 1500 },
];

interface SigningOverlayProps {
  onComplete: () => void;
}

export function SigningOverlay({ onComplete }: SigningOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStep >= steps.length) {
      const timer = setTimeout(onComplete, 800);
      return () => clearTimeout(timer);
    }

    const stepDuration = steps[currentStep].duration;
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const target = ((currentStep + 1) / steps.length) * 100;
        const increment = (target - prev) / 10;
        return Math.min(prev + increment, target);
      });
    }, 50);

    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, stepDuration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [currentStep, onComplete]);

  const safeStep = Math.min(currentStep, steps.length - 1);
  const StepIcon = steps[safeStep].icon;

  return (
    <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      {/* Sparkles */}
      <div className="absolute top-10 left-10 text-2xl animate-float-sparkle" style={{ animationDelay: '0s' }}>✨</div>
      <div className="absolute top-20 right-16 text-xl animate-float-sparkle" style={{ animationDelay: '0.5s' }}>✨</div>
      <div className="absolute bottom-20 left-20 text-xl animate-float-sparkle" style={{ animationDelay: '1s' }}>✨</div>
      <div className="absolute bottom-16 right-10 text-2xl animate-float-sparkle" style={{ animationDelay: '1.5s' }}>✨</div>
      <div className="absolute top-1/3 left-8 text-lg animate-float-sparkle" style={{ animationDelay: '0.7s' }}>💫</div>
      <div className="absolute top-1/4 right-8 text-lg animate-float-sparkle" style={{ animationDelay: '1.2s' }}>💫</div>

      <div className="max-w-md w-full mx-4 text-center space-y-8">
        {/* Animated icon */}
        <div className="flex justify-center animate-scale-in" key={safeStep}>
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-lg shadow-purple-200/50">
            <StepIcon className="w-10 h-10 text-purple-600 animate-pulse" />
          </div>
        </div>

        {/* Step text */}
        <div className="animate-fade-in-up" key={`text-${safeStep}`}>
          <p className="text-xl font-bold text-gray-900">
            {steps[safeStep].emoji} {steps[safeStep].text}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i <= safeStep
                    ? 'bg-purple-600 scale-110'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
