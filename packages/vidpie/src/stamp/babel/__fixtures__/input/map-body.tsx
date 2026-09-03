export const Rows = ({ items }: { items: string[] }) => (
  <ul>
    {items.map((item) => (
      <li key={item}>
        <Row label={item} />
      </li>
    ))}
  </ul>
);

const Row = ({ label }: { label: string }) => <span>{label}</span>;
