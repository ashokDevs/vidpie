import { AbsoluteFill, OffthreadVideo, Sequence } from 'remotion';

export const Scene = () => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={60}>
      <OffthreadVideo src="clip.mp4" />
    </Sequence>
  </AbsoluteFill>
);
