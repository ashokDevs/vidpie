export const Rows = ({ items }: {items: string[];}) =>
<ul data-picker-src="map-body.tsx:2:3">
    {items.map((item) =>
  <li key={item} data-picker-src="map-body.tsx:4:7">
        <div data-picker-src="map-body.tsx:5:9" data-picker-component="Row" style={{ display: "contents" }}><Row label={item} /></div>
      </li>
  )}
  </ul>;


const Row = ({ label }: {label: string;}) => <span data-picker-src="map-body.tsx:11:47">{label}</span>;