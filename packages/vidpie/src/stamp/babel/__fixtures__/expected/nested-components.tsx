const Inner = () => <span data-picker-src="nested-components.tsx:1:21">inner</span>;

const Middle = () =>
<div data-picker-src="nested-components.tsx:4:3">
    <div data-picker-src="nested-components.tsx:5:5" data-picker-component="Inner" style={{ display: "contents" }}><Inner /></div>
  </div>;


export const Outer = () =>
<div data-picker-src="nested-components.tsx:10:3" data-picker-component="Middle" style={{ display: "contents" }}><Middle>
    <div data-picker-src="nested-components.tsx:11:5" data-picker-component="Inner" style={{ display: "contents" }}><Inner /></div>
  </Middle></div>;