import { readFile, writeFile, mkdir } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
const svg = await readFile(
  new URL("../assets/vorq-logo.svg", import.meta.url),
  "utf8",
);
const render = (content, size) =>
  new Resvg(content, { fitTo: { mode: "width", value: size } })
    .render()
    .asPng();
const inner = svg.replace(
  "<svg ",
  '<svg x="142" y="246" width="740" height="532" ',
);
const adaptive = svg.replace(
  "<svg ",
  '<svg x="212" y="300" width="600" height="424" ',
);
const square = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;
await writeFile(
  new URL("../assets/icon.png", import.meta.url),
  render(
    square(`<rect width="1024" height="1024" fill="white"/>${inner}`),
    1024,
  ),
);
await writeFile(
  new URL("../assets/android-icon-foreground.png", import.meta.url),
  render(square(adaptive), 1024),
);
const silhouette =
  '<svg x="212" y="300" width="600" height="424" viewBox="75 40 620 430"><path fill="white" d="M105 109H235C264 109 279 119 294 145L360 258L466 79C478 59 499 52 528 52H663C679 52 683 58 674 74L478 421C467 443 453 452 427 452H287C267 452 257 446 246 427L92 131C84 116 89 109 105 109Z"/></svg>';
await writeFile(
  new URL("../assets/android-icon-monochrome.png", import.meta.url),
  render(square(silhouette), 1024),
);
await writeFile(
  new URL("../assets/favicon.png", import.meta.url),
  render(
    square(`<rect width="1024" height="1024" rx="160" fill="white"/>${inner}`),
    64,
  ),
);
await mkdir(new URL("../public/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/vorq-logo.svg", import.meta.url), svg);
await writeFile(
  new URL("../src/components/Brand.tsx", import.meta.url),
  `// Generated from assets/vorq-logo.svg by npm run assets:brand.\nimport { SvgXml } from 'react-native-svg';\nconst logo = ${JSON.stringify(svg)};\nexport function Brand({ size = 42 }: { size?: number }) { return <SvgXml xml={logo} width={size} height={size * 0.72} accessibilityLabel="VORQ logo" />; }\n`,
);
console.log(
  "Generated VORQ SVG component and launcher assets from the supplied brand mark.",
);
