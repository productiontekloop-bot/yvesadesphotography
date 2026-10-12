import { useEffect, useState, useRef, useMemo, memo } from 'react';
import { Texture, FrontSide } from 'three';
import { useGalleryStore } from '../../hooks/useGalleryStore';
import { ArtworkData } from '../../data/exhibitions';
import { getOrCreatePlaceholderTexture, loadArtworkTexture, isRoomWithinLoadDistance } from '../../utils/textureManager';

interface ArtworkProps {
  artwork: ArtworkData;
}

function Artwork({ artwork }: ArtworkProps) {
  const [texture, setTexture] = useState<Texture | null>(null);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const lastClickTime = useRef(0);

  // 1. Get procedural photographic placeholder texture immediately
  const placeholderTexture = useMemo(() => {
    return getOrCreatePlaceholderTexture(artwork);
  }, [artwork]);

  // 2. High-res image texture loader: query load distance without subscribing every frame
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const checkAndLoad = () => {
      const state = useGalleryStore.getState();
      const shouldLoad = isRoomWithinLoadDistance(artwork.room, state.activeRoomId, state.visitorPosition);
      if (shouldLoad) {
        unsubscribe = loadArtworkTexture(artwork, (loadedTex) => {
          setTexture(loadedTex);
        });
      }
    };

    checkAndLoad();

    let prevRoomId = useGalleryStore.getState().activeRoomId;
    const unsubStore = useGalleryStore.subscribe((state) => {
      if (state.activeRoomId !== prevRoomId) {
        prevRoomId = state.activeRoomId;
        checkAndLoad();
      }
    });

    return () => {
      unsubStore();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [artwork]);

  const navigateToArtwork = useGalleryStore((state) => state.navigateToArtwork);

  const displayWidth = artwork.width;
  const displayHeight = artwork.height;

  const triggerNavigation = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 350) return;
    lastClickTime.current = now;
    navigateToArtwork(artwork);
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    pointerDownPos.current = {
      x: e.clientX ?? e.nativeEvent?.clientX ?? 0,
      y: e.clientY ?? e.nativeEvent?.clientY ?? 0
    };
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    const cx = e.clientX ?? e.nativeEvent?.clientX ?? pointerDownPos.current.x;
    const cy = e.clientY ?? e.nativeEvent?.clientY ?? pointerDownPos.current.y;
    const dx = Math.abs(cx - pointerDownPos.current.x);
    const dy = Math.abs(cy - pointerDownPos.current.y);
    if (dx < 20 && dy < 20) {
      triggerNavigation();
    }
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
  };

  return (
    <group 
      position={[artwork.position[0], artwork.position[1], artwork.position[2]]}
      rotation={[artwork.rotation[0], artwork.rotation[1], artwork.rotation[2]]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Pure, clean image mounted directly on wall without frames or shadows */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[displayWidth, displayHeight]} />
        <meshStandardMaterial 
          map={texture || placeholderTexture} 
          roughness={0.12} 
          metalness={0.0} 
          toneMapped={true} 
          side={FrontSide}
        />
      </mesh>
    </group>
  );
}

export default memo(Artwork);
