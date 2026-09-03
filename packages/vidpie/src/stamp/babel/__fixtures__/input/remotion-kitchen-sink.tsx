// A realistic Remotion project in one file, reaching for as much of the API as
// a real video does. It is the shared subject for the stamp's tests, so every
// decision the plugin makes should be visible somewhere below:
//
//   host elements            div, h1, p, span, img, and a spread
//   component call sites     AbsoluteFill, Sequence, Img, Audio, Video, Loop,
//                            IFrame, Solid, OffthreadVideo
//   member expression, wrap  Experimental.Clipper, Experimental.Null
//   member expression, skip  Series.Sequence, TransitionSeries.Sequence
//   skipped, renders no DOM  Composition, Still, Folder
//   fragments                both the short form and Fragment
//   a .map body              sibling call sites sharing one source location
//   TypeScript               interface, type annotation, `as`, `satisfies`
//
// Every name here is a real export of remotion 4.0.506 or @remotion/transitions.

import { Fragment } from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Experimental,
  Folder,
  IFrame,
  Img,
  interpolate,
  Loop,
  OffthreadVideo,
  Sequence,
  Series,
  Solid,
  staticFile,
  Still,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

interface Clip {
  id: string;
  src: string;
  from: number;
}

const CLIPS: Clip[] = [
  { id: 'a', src: 'a.mp4', from: 0 },
  { id: 'b', src: 'b.mp4', from: 60 },
];

const Title = ({ text, ...rest }: { text: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div className="title" style={{ opacity }} {...rest}>
      <h1>{text}</h1>
      <p>
        Subtitle <span>with emphasis</span>
      </p>
    </div>
  );
};

const Backdrop = () => (
  <>
    <Solid color="#000" />
    <Img src={staticFile('grain.png')} />
    <img src="raw.png" alt="" />
  </>
);

const Reel = () => (
  <AbsoluteFill>
    <Backdrop />
    {CLIPS.map((clip) => (
      <Sequence key={clip.id} from={clip.from} durationInFrames={60}>
        <OffthreadVideo src={staticFile(clip.src)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

const Chapters = () => (
  <Series>
    <Series.Sequence durationInFrames={60}>
      <Title text="One" />
    </Series.Sequence>
    <Series.Sequence durationInFrames={90}>
      <Video src={staticFile('two.mp4')} />
    </Series.Sequence>
  </Series>
);

const Transitions = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={60}>
      <Title text="Before" />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence durationInFrames={60}>
      <Title text="After" />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);

export const Main = () => {
  const config = useVideoConfig() satisfies { fps: number };

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' } as React.CSSProperties}>
      <Reel />
      <Chapters />
      <Transitions />
      <Fragment key="overlays">
        <Loop durationInFrames={30}>
          <Title text={`at ${config.fps}fps`} />
        </Loop>
        <IFrame src="https://example.com" />
        <Audio src={staticFile('score.mp3')} />
      </Fragment>
      <Experimental.Clipper />
      <Experimental.Null />
    </AbsoluteFill>
  );
};

export const Root = () => (
  <Folder name="scenes">
    <Composition
      id="main"
      component={Main}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
    <Still id="poster" component={Main} width={1920} height={1080} />
  </Folder>
);
