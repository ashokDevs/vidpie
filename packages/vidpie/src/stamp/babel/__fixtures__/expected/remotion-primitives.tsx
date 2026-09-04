import { AbsoluteFill, OffthreadVideo, Sequence } from 'remotion';

export const Scene = () =>
<div data-picker-src="remotion-primitives.tsx:4:3" data-picker-component="AbsoluteFill" style={{ display: "contents" }}><AbsoluteFill>
    <div data-picker-src="remotion-primitives.tsx:5:5" data-picker-component="Sequence" style={{ display: "contents" }}><Sequence from={0} durationInFrames={60}>
      <div data-picker-src="remotion-primitives.tsx:6:7" data-picker-component="OffthreadVideo" style={{ display: "contents" }}><OffthreadVideo src="clip.mp4" /></div>
    </Sequence></div>
  </AbsoluteFill></div>;