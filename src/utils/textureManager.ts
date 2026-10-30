import { TextureLoader, Texture, CanvasTexture, SRGBColorSpace, LinearMipmapLinearFilter } from 'three';
import { ArtworkData } from '../data/exhibitions';
import { getOptimizedImageUrl } from './imageOptimizer';

const loader = new TextureLoader();
const cache = new Map<string, Texture>();
type Listener = { loaded: (texture: Texture) => void; failed?: () => void };
type Job = { key: string; url: string; listeners: Set<Listener> };
const pending = new Map<string, Job>();
const queue: Job[] = [];
let running = 0;
let generation = 0;
let placeholder: CanvasTexture | undefined;

// Keep image decoding/upload work bounded, including StrictMode duplicate effects.
function pump() {
  while (running < 2 && queue.length) {
    const job = queue.shift()!;
    const currentGeneration = generation;
    running++;
    const finish = () => {
      if (currentGeneration !== generation) return;
      pending.delete(job.key);
      running--;
      pump();
    };
    loader.load(job.url, texture => {
      if (currentGeneration !== generation) { texture.dispose(); return; }
      texture.colorSpace = SRGBColorSpace;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.anisotropy = 2;
      cache.set(job.key, texture);
      try { for (const listener of job.listeners) listener.loaded(texture); }
      finally { finish(); }
    }, undefined, () => {
      if (currentGeneration !== generation) return;
      try { for (const listener of job.listeners) listener.failed?.(); }
      finally { finish(); }
    });
  }
}

export function hasPendingArtworkLoads() { return pending.size > 0; }

export function getOrCreatePlaceholderTexture(_artwork: ArtworkData): CanvasTexture {
  if (!placeholder) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (context) { context.fillStyle = '#E2E2DF'; context.fillRect(0, 0, 1, 1); }
    placeholder = new CanvasTexture(canvas);
    placeholder.colorSpace = SRGBColorSpace;
  }
  return placeholder;
}

export function isRoomWithinLoadDistance(_roomId: string, _activeRoomId: string, _visitorPos: [number, number, number]) {
  return true;
}

export function loadArtworkTexture(artwork: ArtworkData, onLoaded: (texture: Texture) => void, onError?: () => void): () => void {
  const url = getOptimizedImageUrl(artwork.image);
  const existing = cache.get(url);
  if (existing) { onLoaded(existing); return () => {}; }
  const listener: Listener = { loaded: onLoaded, failed: onError };
  let job = pending.get(url);
  if (!job) {
    job = { key: url, url, listeners: new Set() };
    pending.set(url, job);
    queue.push(job);
  }
  job.listeners.add(listener);
  pump();
  return () => { job!.listeners.delete(listener); };
}

// Photos belong to the gallery session, so room transitions never dispose them.
export function unloadArtworkTexture(_artworkId: string) {}

export function clearAllTextureCaches() {
  generation++;
  for (const texture of cache.values()) texture.dispose();
  cache.clear();
  pending.clear();
  queue.length = 0;
  running = 0;
  placeholder?.dispose();
  placeholder = undefined;
}
