import { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

export function SignatureCanvas({ onSignatureChange }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Workaround for CSS zoom coordinate bugs on mobile
    let cssZoom = 1;
    let el: HTMLElement | null = canvas;
    while (el) {
      const z = window.getComputedStyle(el).zoom;
      if (z && z !== 'normal' && !isNaN(Number(z))) {
        cssZoom *= parseFloat(z);
      }
      el = el.parentElement;
    }

    const x = (clientX / cssZoom - rect.left / cssZoom) * scaleX;
    const y = (clientY / cssZoom - rect.top / cssZoom) * scaleY;

    return { x, y };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const setupContext = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2.5;
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Only prevent default on touch to avoid scrolling, let mouse events pass if needed, but safe to prevent here too
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    setupContext(ctx);

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawing.current = true;
    setShowPlaceholder(false);
  }, [getCanvasCoords]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawn.current = true;
  }, [getCanvasCoords]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && hasDrawn.current) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  }, [onSignatureChange]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    isDrawing.current = false;
    setShowPlaceholder(true);
    onSignatureChange(null);
  }, [onSignatureChange]);

  return (
    <div className="space-y-2 sm:space-y-3 w-full">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full border-2 border-dashed border-purple-200 rounded-xl bg-white cursor-crosshair touch-none"
          style={{ maxHeight: '108px' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {showPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-xs sm:text-sm font-medium">Нарисуйте подпись здесь</p>
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <button
          onClick={clearCanvas}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-medium text-gray-400 hover:text-gray-500 bg-transparent hover:bg-gray-100/50 transition-colors"
        >
          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Очистить
        </button>
      </div>
    </div>
  );
}
