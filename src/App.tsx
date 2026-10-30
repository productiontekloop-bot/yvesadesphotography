import { useState } from 'react';
import VirtualGallery from './components/gallery/VirtualGallery';
import GalleryToolbar from './components/ui/GalleryToolbar';
import GuidedTourControls from './components/ui/GuidedTourControls';
import LoadingScreen from './components/ui/LoadingScreen';
import MobileControls from './components/ui/MobileControls';
import HelpOverlay from './components/ui/HelpOverlay';
import { useGalleryStore } from './hooks/useGalleryStore';

export default function App() {
  const [galleryStatus, setGalleryStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const assetLoadErrors = useGalleryStore((state) => state.assetLoadErrors ?? {});
  const failedArtwork = Object.values(assetLoadErrors);

  return (
    <div id="app-root" className="w-screen h-screen relative bg-[#ECECE9] overflow-hidden select-none">
      {/* 1. Immersive 3D WebGL Canvas Scene (Central Corridor + 5 themed rooms) */}
      <VirtualGallery
        onReady={() => setGalleryStatus('ready')}
        onError={() => setGalleryStatus('error')}
      />

      {/* 2. Sleek Editorial Onboarding Loading Screen */}
      <LoadingScreen status={galleryStatus} />

      {failedArtwork.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-4 left-4 z-[60] max-w-sm rounded-md border border-amber-200 bg-white/95 px-3 py-2 text-xs text-neutral-700 shadow-md"
        >
          <strong className="font-semibold">
            {failedArtwork.length} photograph{failedArtwork.length === 1 ? '' : 's'} could not be loaded.
          </strong>
          <span className="ml-1">
            Showing previews for {failedArtwork.map((artwork) => artwork.title).join(', ')}.
          </span>
        </div>
      )}

      {/* 3. Navigation Controls Floating Toolbar (Top-Left, Center, Top-Right) */}
      <GalleryToolbar />

      {/* 4. Guided Tour Playback Controls Panel (Bottom-Center) */}
      <GuidedTourControls />

      {/* 5. Mobile Virtual Joysticks & Sprint locks (Bottom-Left) */}
      <MobileControls />

      {/* 6. Onboarding Temporary Key Controls Guide Overlay */}
      <HelpOverlay />
    </div>
  );
}
