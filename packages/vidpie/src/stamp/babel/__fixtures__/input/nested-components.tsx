const Inner = () => <span>inner</span>;

const Middle = () => (
  <div>
    <Inner />
  </div>
);

export const Outer = () => (
  <Middle>
    <Inner />
  </Middle>
);
