import { useEffect, useState, useRef, useMemo, memo } from 'react';
import { Texture, FrontSide } from 'three';
import { useGalleryStore } from '../../hooks/useGalleryStore';
import { ArtworkData } from '../../data/exhibitions';
import { getOrCreatePlaceholderTexture, loadArtworkTexture } from '../../utils/textureManager';

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

  // Load each real photo once; the shared queue limits concurrent decoding.
  useEffect(() => loadArtworkTexture(artwork, loadedTex => {
    setTexture(loadedTex);
    useGalleryStore.getState().setArtworkLoadError(artwork.id, null);
  }, () => {
    useGalleryStore.getState().setArtworkLoadError(artwork.id, {
      title: artwork.title, image: artwork.image
    });
  }), [artwork]);

  const navigateToArtwork = useGalleryStore((state) => state.navigateToArtwork);

  const image = texture?.image as { width?: number; height?: number } | undefined;
  const imageAspectRatio = image?.width && image.height
    ? image.width / image.height
    : artwork.width / artwork.height;
  const frameAspectRatio = artwork.width / artwork.height;
  const displayWidth = imageAspectRatio > frameAspectRatio
    ? artwork.width
    : artwork.height * imageAspectRatio;
  const displayHeight = imageAspectRatio > frameAspectRatio
    ? artwork.width / imageAspectRatio
    : artwork.height;

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
        <meshBasicMaterial 
          map={texture || placeholderTexture} 
          toneMapped={false} 
          side={FrontSide}
        />
      </mesh>
    </group>
  );
}

export default memo(Artwork);
