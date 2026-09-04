import { Fragment } from 'react';

export const List = () =>
<>
    <li data-picker-src="fragments.tsx:5:5">one</li>
    <div data-picker-src="fragments.tsx:6:5" data-picker-component="Fragment" style={{ display: "contents" }}><Fragment key="two">
      <li data-picker-src="fragments.tsx:7:7">two</li>
    </Fragment></div>
  </>;