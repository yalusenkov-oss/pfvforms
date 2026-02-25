import { useState, useEffect, useRef } from 'react';
import { Search, Lock, PenTool, FileCheck, Loader2 } from 'lucide-react';

// Animation steps that play before the server finishes
const steps = [
  { icon: Search,    emoji: '🔍', text: 'Проверяем данные договора…',   duration: 1200 },
  { icon: Lock,      emoji: '🔐', text: 'Шифруем вашу подпись…',        duration: 1400 },
  { icon: PenTool,   emoji: '🖊️', text: 'Ставим вашу подпись…',         duration: 1600 },
  { icon: FileCheck, emoji: '📄', text: 'Генерируем PDF c двумя подписями…', duration: 99999 }, // holds until server responds
];

interface SigningOverlayProps {
  onComplete: () => void;
  serverReady: boolean; // becomes true when server responds
}

export function SigningOverlay({ onComplete, serverReady }: SigningOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [waitingForServer, setWaitingForServer] = useState(false);
  const completedRef = useRef(false);

  // Advance animation steps (last step holds until serverReady)
  useEffect(() => {
    const isLastStep = currentStep === steps.length - 1;
    if (isLastStep) {
      setWaitingForServer(true);
      return;
    }
    if (currentStep >= steps.length) return;

    const stepDuration = steps[currentStep].duration;
    const progressTarget = ((currentStep + 1) / steps.length) * 100;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const increment = (progressTarget - prev) / 10;
        return Math.min(prev + increment, progressTarget);
      });
    }, 50);

    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, stepDuration);

    return () => { clearTimeout(timer); clearInterval(progressInterval); };
  }, [currentStep]);

  // When server responds AND we are on the last step → complete
  useEffect(() => {
    if (!serverReady || !waitingForServer || completedRef.current) return;
    completedRef.current = true;

    // Animate progress to 100%
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + 4, 100);
        if (next >= 100) clearInterval(progressInterval);
        return next;
      });
    }, 30);

    const timer = setTimeout(() => {
      onComplete();
    }, 700);

    return () => { clearTimeout(timer); clearInterval(progressInterval); };
  }, [serverReady, waitingForServer, onComplete]);

  const safeStep = Math.min(currentStep, steps.length - 1);
  const StepIcon = steps[safeStep].icon;

  return (
    <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="absolute top-10 left-10 text-2xl animate-float-sparkle" style={{ animationDelay: '0s' }}>✨</div>
      <div className="absolute top-20 right-16 text-xl animate-float-sparkle" style={{ animationDelay: '0.5s' }}>✨</div>
      <div className="absolute bottom-20 left-20 text-xl animate-float-sparkle" style={{ animationDelay: '1s' }}>✨</div>
      <div className="absolute bottom-16 right-10 text-2xl animate-float-sparkle" style={{ animationDelay: '1.5s' }}>✨</div>
      <div className="absolute top-1/3 left-8 text-lg animate-float-sparkle" style={{ animationDelay: '0.7s' }}>💫</div>
      <div className="absolute top-1/4 right-8 text-lg animate-float-sparkle" style={{ animationDelay: '1.2s' }}>💫</div>

      <div className="max-w-md w-full mx-4 text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center animate-scale-in" key={safeStep}>
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-lg shadow-purple-200/50 relative">
            <StepIcon className="w-10 h-10 text-purple-600" />
            {waitingForServer && !serverReady && (
              <Loader2 className="absolute -bottom-2 -right-2 w-6 h-6 text-purple-500 animate-spin bg-white rounded-full p-0.5" />
            )}
          </div>
        </div>

        {/* Text */}
        <div key={`text-${safeStep}-${waitingForServer}`}>
          <p className="text-xl font-bold text-gray-900">
            {steps[safeStep].emoji} {steps[safeStep].text}
          </p>
          {waitingForServer && !serverReady && (
            <p className="text-sm text-gray-400 mt-2">Это может занять 10–30 секунд. Не закрывайте страницу.</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i <= safeStep ? 'bg-purple-600 scale-110' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
