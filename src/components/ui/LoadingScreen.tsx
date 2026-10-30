import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  status: 'loading' | 'ready' | 'error';
}

export default function LoadingScreen({ status }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (status !== 'ready') {
      setIsVisible(true);
      setShouldRender(true);
      return;
    }

    const fadeTimeout = setTimeout(() => setIsVisible(false), 500);
    const removeTimeout = setTimeout(() => setShouldRender(false), 1000);
    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, [status]);

  if (!shouldRender && status !== 'error') return null;
  const progress = status === 'ready' ? 100 : 68;

  return (
    <div 
      id="loading-screen"
      role={status === 'error' ? 'alert' : undefined}
      className={`fixed inset-0 z-[200] bg-[#FDFBF7] flex flex-col items-center justify-center p-8 transition-opacity duration-500 ease-in-out ${isVisible || status === 'error' ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Editorial Branding Logo Stack */}
      <div className="flex flex-col items-center gap-2 mb-10 text-center select-none">
        <span className="font-serif italic text-4xl md:text-5xl font-medium tracking-tight text-[#111111]">
          Photography
        </span>
        <span className="font-sans text-[11px] font-normal tracking-[0.45em] text-[#555555] uppercase mt-1 pl-[0.45em]">
          YVES ADES RETROSPECTIVE
        </span>
      </div>

      {status === 'error' ? (
        <div className="flex max-w-sm flex-col items-center gap-3 text-center font-sans">
          <p className="text-sm text-neutral-700">
            The 3D gallery could not start. Check that WebGL is enabled, then reload the exhibition.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-[#28C7C2] px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#20b0ac]"
          >
            Reload gallery
          </button>
        </div>
      ) : (
        <div className="w-full max-w-[200px] flex flex-col items-center gap-2 font-sans">
          <div className="w-full h-[2px] bg-neutral-100 overflow-hidden rounded">
            <div
              className={`h-full bg-[#28C7C2] transition-all duration-300 ease-out ${status === 'loading' ? 'animate-pulse' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between w-full text-[10px] text-[#555555] tracking-widest font-medium uppercase mt-1">
            <span>{status === 'ready' ? 'Opening...' : 'Preparing gallery...'}</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {/* Curatorial Credit */}
      <div className="absolute bottom-8 text-[9px] text-neutral-400 font-sans tracking-[0.2em] uppercase font-medium">
        Yves Ades Gallery Retrospective • Basel 2026
      </div>
    </div>
  );
}
