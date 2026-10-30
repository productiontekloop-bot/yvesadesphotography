export default function GalleryLighting() {
  return <>
    <hemisphereLight intensity={1.3} color="#FFFFFF" groundColor="#FAF9F5" />
    <ambientLight intensity={0.95} color="#FAF9F5" />
    <directionalLight position={[-14, 28, 18]} intensity={0.9} color="#FFFDF7" />
    <directionalLight position={[18, 24, -16]} intensity={0.8} color="#F5F8FC" />
    <pointLight position={[0, 3.6, 0]} intensity={1.35} distance={30} decay={1.6} color="#FFFBF5" />
  </>;
}
