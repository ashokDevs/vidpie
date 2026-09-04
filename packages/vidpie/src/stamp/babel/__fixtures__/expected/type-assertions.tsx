const raw: unknown = { width: 1920 };
const size = raw as {width: number;};

export const Frame = () => <div style={{ width: size.width }} data-picker-src="type-assertions.tsx:4:28" />;