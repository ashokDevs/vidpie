import { Composition, Folder, Still } from 'remotion';

import { Scene } from './remotion-primitives.js';

export const Root = () =>
<Folder name="scenes">
    <Composition id="scene" component={Scene} durationInFrames={60} fps={30} width={1920} height={1080} />
    <Still id="poster" component={Scene} width={1920} height={1080} />
  </Folder>;