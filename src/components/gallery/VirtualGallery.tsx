import { hasPendingArtworkLoads } from '../../utils/textureManager';
import { Canvas, useFrame } from '@react-three/fiber';
import { Component, ErrorInfo, ReactNode, Suspense, useRef } from 'react';
import { EXHIBITIONS } from '../../data/exhibitions';
import { useGalleryStore } from '../../hooks/useGalleryStore';
import { checkCollision, getRoomIdFromPosition } from '../../utils/collision';
import GalleryLighting from './GalleryLighting';
import GalleryArchitecture from './GalleryArchitecture';
import CentralHallway from './CentralHallway';
import ExhibitionRoom from './ExhibitionRoom';
import PlayerController from './PlayerController';

interface VirtualGalleryProps {
  onReady: () => void;
  onError: () => void;
}

interface GalleryErrorBoundaryProps extends VirtualGalleryProps {
  children: ReactNode;
}

interface GalleryErrorBoundaryState {
  error: Error | null;
}

class GalleryErrorBoundary extends Component<GalleryErrorBoundaryProps, GalleryErrorBoundaryState> {
  state: GalleryErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): GalleryErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('The 3D gallery failed to render.', error);
    this.props.onError();
  }

  render() {
    return this.state.error ? null : this.props.children;
  }
}

function GalleryReadySignal({ onReady }: { onReady: () => void }) {
  const hasReportedReady = useRef(false);

  useFrame(() => {
    if (!hasReportedReady.current && !hasPendingArtworkLoads()) {
      hasReportedReady.current = true;
      onReady();
    }
  });

  return null;
}

export default function VirtualGallery({ onReady, onError }: VirtualGalleryProps) {
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const pointerDownTime = useRef(0);
  
  const moveToPosition = useGalleryStore((state) => state.moveToPosition);
  const selectedArtwork = useGalleryStore((state) => state.selectedArtwork);
  const viewMode = useGalleryStore((state) => state.viewMode);

  const handlePointerDown = (e: any) => {
    if (e.button !== 0 && e.nativeEvent instanceof MouseEvent) return;
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    pointerDownTime.current = Date.now();
  };

  const handlePointerUp = (e: any) => {
    const visitorPosition = useGalleryStore.getState().visitorPosition;
    if (selectedArtwork) return;
    if (e.button !== 0 && e.nativeEvent instanceof MouseEvent) return;

    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - pointerDownTime.current;

    // Distinguish quick click/tap from an orbital or look drag
    if (dist < 5 && elapsed < 280) {
      if (e.point) {
        if (viewMode === 'floorplan' || viewMode === 'perspective') {
          // If in overview, clicking on a room or corridor enters walkthrough at that spot
          const verified = checkCollision(e.point.x, e.point.z);
          useGalleryStore.getState().moveToPosition(
            [verified.x, 1.65, verified.z],
            [verified.x, 1.65, verified.z - 3]
          );
          useGalleryStore.setState({ viewMode: 'walkthrough' });
          return;
        }

        // In walkthrough mode:
        // 1. Strictly ignore clicks on walls, artwork frames, ceiling, or vertical fixtures.
        // A walkable surface must be horizontal and near the floor (y <= 0.35, normal pointing up).
        const isFloorClick = Math.abs(e.point.y) <= 0.35 && (!e.face || e.face.normal.y > 0.65);
        if (!isFloorClick) {
          // Clicked on a vertical wall or obstacle - ignore completely to prevent wall-teleporting
          return;
        }

        // 2. Room changes must be door-to-door ONLY:
        // Players can only move within their current room when clicking on the floor.
        // Room transitions can only be made by walking through doors or interacting directly with doors.
        const currentRoom = getRoomIdFromPosition(visitorPosition[0], visitorPosition[2]);
        const verified = checkCollision(e.point.x, e.point.z, visitorPosition[0], visitorPosition[2]);
        const targetRoom = getRoomIdFromPosition(verified.x, verified.z);

        if (currentRoom === targetRoom) {
          const lookDirX = verified.x - visitorPosition[0];
          const lookDirZ = verified.z - visitorPosition[2];
          moveToPosition(
            [verified.x, 1.65, verified.z],
            [verified.x + lookDirX * 0.5, 1.65, verified.z + lookDirZ * 0.5]
          );
        }
      }
    }
  };

  return (
    <div id="canvas-container" className="w-full h-full select-none relative bg-[#E6E6E3] block">
      <GalleryErrorBoundary onReady={onReady} onError={onError}>
        <Canvas
          dpr={1}
          camera={{
            fov: 56,
            near: 0.1,
            far: 90,
            position: [-15, 27, 29]
          }}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            alpha: false,
            preserveDrawingBuffer: false
          }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.12;
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault();
              onError();
            });
            gl.domElement.addEventListener('webglcontextrestored', onReady);
          }}
        >
          <Suspense fallback={<color attach="background" args={['#E2E2DF']} />}>
            <group
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onDoubleClick={(e) => {
                e.stopPropagation();
              }}
            >
              <GalleryReadySignal onReady={onReady} />

              {/* Clean architectural studio background tone */}
              <color attach="background" args={['#E2E2DF']} />

              {/* Realistic curatorial exhibition lighting setup */}
              <GalleryLighting />

              {/* Camera & Interactive navigation controller */}
              <PlayerController />

              {/* Complete 5-room modern art gallery architecture with wooden doors */}
              <GalleryArchitecture />

              {/* Corridor curated elements */}
              <CentralHallway />

              {/* 5 Procedural Exhibition Galleries */}
              {EXHIBITIONS.map((room) => (
                <ExhibitionRoom key={room.id} room={room} />
              ))}
            </group>
          </Suspense>
        </Canvas>
      </GalleryErrorBoundary>
    </div>
  );
}
