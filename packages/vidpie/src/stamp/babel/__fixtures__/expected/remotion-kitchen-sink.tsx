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
  Video } from
'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

interface Clip {
  id: string;
  src: string;
  from: number;
}

const CLIPS: Clip[] = [
{ id: 'a', src: 'a.mp4', from: 0 },
{ id: 'b', src: 'b.mp4', from: 60 }];


const Title = ({ text, ...rest }: {text: string;}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div className="title" style={{ opacity }} {...rest} data-picker-src="remotion-kitchen-sink.tsx:58:5">
      <h1 data-picker-src="remotion-kitchen-sink.tsx:59:7">{text}</h1>
      <p data-picker-src="remotion-kitchen-sink.tsx:60:7">
        Subtitle <span data-picker-src="remotion-kitchen-sink.tsx:61:18">with emphasis</span>
      </p>
    </div>);

};

const Backdrop = () =>
<>
    <div data-picker-src="remotion-kitchen-sink.tsx:69:5" data-picker-component="Solid" style={{ display: "contents" }}><Solid color="#000" /></div>
    <div data-picker-src="remotion-kitchen-sink.tsx:70:5" data-picker-component="Img" style={{ display: "contents" }}><Img src={staticFile('grain.png')} /></div>
    <img src="raw.png" alt="" data-picker-src="remotion-kitchen-sink.tsx:71:5" />
  </>;


const Reel = () =>
<div data-picker-src="remotion-kitchen-sink.tsx:76:3" data-picker-component="AbsoluteFill" style={{ display: "contents" }}><AbsoluteFill>
    <div data-picker-src="remotion-kitchen-sink.tsx:77:5" data-picker-component="Backdrop" style={{ display: "contents" }}><Backdrop /></div>
    {CLIPS.map((clip) =>
    <div data-picker-src="remotion-kitchen-sink.tsx:79:7" data-picker-component="Sequence" style={{ display: "contents" }}><Sequence key={clip.id} from={clip.from} durationInFrames={60}>
        <div data-picker-src="remotion-kitchen-sink.tsx:80:9" data-picker-component="OffthreadVideo" style={{ display: "contents" }}><OffthreadVideo src={staticFile(clip.src)} /></div>
      </Sequence></div>
    )}
  </AbsoluteFill></div>;


const Chapters = () =>
<div data-picker-src="remotion-kitchen-sink.tsx:87:3" data-picker-component="Series" style={{ display: "contents" }}><Series>
    <Series.Sequence durationInFrames={60}>
      <div data-picker-src="remotion-kitchen-sink.tsx:89:7" data-picker-component="Title" style={{ display: "contents" }}><Title text="One" /></div>
    </Series.Sequence>
    <Series.Sequence durationInFrames={90}>
      <div data-picker-src="remotion-kitchen-sink.tsx:92:7" data-picker-component="Video" style={{ display: "contents" }}><Video src={staticFile('two.mp4')} /></div>
    </Series.Sequence>
  </Series></div>;


const Transitions = () =>
<div data-picker-src="remotion-kitchen-sink.tsx:98:3" data-picker-component="TransitionSeries" style={{ display: "contents" }}><TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={60}>
      <div data-picker-src="remotion-kitchen-sink.tsx:100:7" data-picker-component="Title" style={{ display: "contents" }}><Title text="Before" /></div>
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence durationInFrames={60}>
      <div data-picker-src="remotion-kitchen-sink.tsx:104:7" data-picker-component="Title" style={{ display: "contents" }}><Title text="After" /></div>
    </TransitionSeries.Sequence>
  </TransitionSeries></div>;


export const Main = () => {
  const config = useVideoConfig() satisfies {fps: number;};

  return (
    <div data-picker-src="remotion-kitchen-sink.tsx:113:5" data-picker-component="AbsoluteFill" style={{ display: "contents" }}><AbsoluteFill style={{ backgroundColor: 'black' } as React.CSSProperties}>
      <div data-picker-src="remotion-kitchen-sink.tsx:114:7" data-picker-component="Reel" style={{ display: "contents" }}><Reel /></div>
      <div data-picker-src="remotion-kitchen-sink.tsx:115:7" data-picker-component="Chapters" style={{ display: "contents" }}><Chapters /></div>
      <div data-picker-src="remotion-kitchen-sink.tsx:116:7" data-picker-component="Transitions" style={{ display: "contents" }}><Transitions /></div>
      <div data-picker-src="remotion-kitchen-sink.tsx:117:7" data-picker-component="Fragment" style={{ display: "contents" }}><Fragment key="overlays">
        <div data-picker-src="remotion-kitchen-sink.tsx:118:9" data-picker-component="Loop" style={{ display: "contents" }}><Loop durationInFrames={30}>
          <div data-picker-src="remotion-kitchen-sink.tsx:119:11" data-picker-component="Title" style={{ display: "contents" }}><Title text={`at ${config.fps}fps`} /></div>
        </Loop></div>
        <div data-picker-src="remotion-kitchen-sink.tsx:121:9" data-picker-component="IFrame" style={{ display: "contents" }}><IFrame src="https://example.com" /></div>
        <div data-picker-src="remotion-kitchen-sink.tsx:122:9" data-picker-component="Audio" style={{ display: "contents" }}><Audio src={staticFile('score.mp3')} /></div>
      </Fragment></div>
      <div data-picker-src="remotion-kitchen-sink.tsx:124:7" data-picker-component="Experimental.Clipper" style={{ display: "contents" }}><Experimental.Clipper /></div>
      <div data-picker-src="remotion-kitchen-sink.tsx:125:7" data-picker-component="Experimental.Null" style={{ display: "contents" }}><Experimental.Null /></div>
    </AbsoluteFill></div>);

};

export const Root = () =>
<Folder name="scenes">
    <Composition
    id="main"
    component={Main}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080} />
  
    <Still id="poster" component={Main} width={1920} height={1080} />
  </Folder>;