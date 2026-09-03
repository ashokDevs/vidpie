import { Fragment } from 'react';

export const List = () => (
  <>
    <li>one</li>
    <Fragment key="two">
      <li>two</li>
    </Fragment>
  </>
);
