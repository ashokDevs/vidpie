const raw: unknown = { width: 1920 };
const size = raw as { width: number };

export const Frame = () => <div style={{ width: size.width }} />;
