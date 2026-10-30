import { Text } from '@react-three/drei';

interface ExhibitionHeadingProps {
  title: string;
  subtitle: string;
  themeColor: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

const HEADINGS: Record<string, { title: string; quote: string; author?: string }> = {
  ARCHITECTURE: {
    title: 'ARCHITECTURE',
    quote: '"The camera is an instrument that\nteaches people how to see without camera"',
    author: 'DOROTHEA LANGE',
  },
  'UNSCRIPTED MOMENTS': {
    title: 'UNSCRIPTED MOMENTS',
    quote: '“Photography takes an instant out of\ntime, altering life by holding it still.”',
    author: 'DOROTHEA LANGE',
  },
  FRAGMENTS: {
    title: 'FRAGMENTS / “NATOCCOLS”',
    quote: '“In abstraction, the image is a mirror.\nWhat you see is shaped by what you bring.”',
  },
  THRESHOLDS: {
    title: 'THRESHOLDS',
    quote: '"The photograph, like a poem,\ndoesn\'t necessarily explain, rather it evokes."',
  },
  NATURE: {
    title: 'NATURE',
    quote: '"Actually, it\'s nature itself that creates the most\nbeautiful pictures. I\'m only choosing the perspective.',
    author: 'KATJA MICHAEL',
  },
};

export default function ExhibitionHeading({ title, subtitle, position, rotation }: ExhibitionHeadingProps) {
  const key = title.toUpperCase().startsWith('FRAGMENTS') ? 'FRAGMENTS' : title.toUpperCase();
  const heading = HEADINGS[key] ?? { title: title.toUpperCase(), quote: subtitle };
  return (
    <group position={position} rotation={rotation}>
      <Text position={[0, 0.43, 0.015]} fontSize={0.19} color="#111111"
        anchorX="center" anchorY="middle" fontWeight={400} letterSpacing={0.015}
        maxWidth={4.8} textAlign="center">
        {heading.title}
      </Text>
      <Text position={[0, 0.13, 0.015]} fontSize={0.105} color="#171717"
        anchorX="center" anchorY="middle" fontWeight={400} lineHeight={1.25}
        maxWidth={4.8} textAlign="center">
        {heading.quote}
      </Text>
      {heading.author && (
        <Text position={[1.12, -0.09, 0.015]} fontSize={0.078} color="#111111"
          anchorX="right" anchorY="middle" fontWeight={400}>
          {heading.author}
        </Text>
      )}
    </group>
  );
}
