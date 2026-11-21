import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/** True once the element has scrolled into view (latches; never resets). */
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

const step = (i: number) => ({ "--i": i }) as CSSProperties;
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/** An inked stroke that draws itself in. `i` orders it within the drawing. */
function Ink({
  d,
  i = 0,
  w,
  o,
}: {
  d: string;
  i?: number;
  w?: number;
  o?: number;
}) {
  return (
    <path
      d={d}
      className="vq-ink"
      pathLength={1}
      strokeWidth={w}
      opacity={o}
      style={step(i)}
    />
  );
}

/** Dashed construction line: fades in instead of drawing (dashes are in use). */
function Faint({ d, i = 0, dash = "7 5" }: { d: string; i?: number; dash?: string }) {
  return (
    <path d={d} className="vq-faint" strokeDasharray={dash} style={step(i)} />
  );
}

function Note({
  x,
  y,
  i = 0,
  anchor = "start",
  size = 11,
  rotate,
  children,
}: {
  x: number;
  y: number;
  i?: number;
  anchor?: "start" | "middle" | "end";
  size?: number;
  rotate?: number;
  children: ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      className="vq-note"
      textAnchor={anchor}
      fontSize={size}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      style={step(i)}
    >
      {children}
    </text>
  );
}

type SketchProps = {
  viewBox: string;
  className?: string;
  title?: string;
  /** Displacement in user units — the slight wobble of a hand-held pen. */
  rough?: number;
  children: ReactNode;
};

function Sketch({ viewBox, className = "", title, rough = 1.4, children }: SketchProps) {
  const [ref, seen] = useInView<SVGSVGElement>(0.15);
  const filterId = `vq${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      className={`vq-sketch ${seen ? "is-in" : ""} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <filter id={filterId} x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves="2"
            seed="11"
            result="grain"
          />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale={rough} />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>{children}</g>
    </svg>
  );
}

type DrawingProps = { className?: string };

/** Hero plate: principal elevation of a classical facade, dimensioned. */
export function Elevation({ className }: DrawingProps) {
  const columns = [130, 206, 282, 358, 434, 510];
  const bays = [168, 244, 396, 472];
  let triglyphs = "";
  for (let x = 122; x <= 516; x += 19) triglyphs += `M${x} 163V173M${x + 4} 163V173`;
  return (
    <Sketch
      viewBox="0 0 640 520"
      className={className}
      rough={1.8}
      title="Hand-drawn principal elevation of a classical facade with dimension lines"
    >
      {/* Regulating geometry */}
      <g opacity={0.45} strokeWidth={0.7}>
        <Ink d={circle(320, 244, 160)} i={0} />
        <Ink d="M104 404 320 84 536 404" i={2} />
        <Ink d="M104 152 320 404 536 152" i={3} />
        <Faint d="M320 34V448" i={1} dash="16 4 2 4" />
        <Faint d="M40 244H600" i={4} dash="16 4 2 4" />
      </g>

      {/* Ground and stylobate */}
      <Ink d="M20 440H620" i={5} w={1.5} />
      <Ink d="M90 440V428H550V440" i={6} />
      <Ink d="M100 428V416H540V428" i={7} />
      <Ink d="M110 416V404H530V416" i={8} />

      {/* Colonnade */}
      {columns.map((cx, n) => (
        <g key={cx}>
          <Ink d={`M${cx - 14} 404V398H${cx + 14}V404`} i={9 + n} />
          <Ink
            d={`M${cx - 10} 398 ${cx - 8.5} 206M${cx + 10} 398 ${cx + 8.5} 206`}
            i={10 + n}
          />
          <Ink
            d={`M${cx - 3.5} 394V212M${cx + 3.5} 394V212`}
            i={12 + n}
            w={0.6}
            o={0.5}
          />
          <Ink
            d={`M${cx - 8.5} 206Q${cx - 13} 204 ${cx - 14} 198H${cx + 14}Q${cx + 13} 204 ${cx + 8.5} 206ZM${cx - 15} 198V192H${cx + 15}V198`}
            i={13 + n}
          />
        </g>
      ))}

      {/* Entablature */}
      <Ink d="M112 192H528V176H112Z" i={19} />
      <Ink d="M112 176V160H528V176" i={20} />
      <Ink d={triglyphs} i={21} w={0.8} />
      <Ink d="M104 160V152H536V160Z" i={22} />

      {/* Pediment */}
      <Ink d="M104 152 320 84 536 152" i={23} w={1.4} />
      <Ink d="M134 149 320 97 506 149" i={24} />
      <Ink d={circle(320, 128, 11)} i={25} />
      <Ink d={circle(320, 128, 6)} i={26} w={0.7} />

      {/* Openings */}
      <Ink d="M300 404V300A20 20 0 0 1 340 300V404" i={25} />
      <Ink d="M320 280V404M300 300H340" i={26} w={0.7} />
      {bays.map((c, n) => (
        <g key={c}>
          <Ink
            d={`M${c - 12} 356V290H${c + 12}V356ZM${c} 290V356M${c - 12} 323H${c + 12}`}
            i={26 + n}
            w={0.9}
          />
          <Ink d={`M${c - 9} 256V232H${c + 9}V256Z`} i={27 + n} w={0.9} />
          <Ink d={`M${c - 15} 360H${c + 15}`} i={28 + n} w={0.9} />
        </g>
      ))}

      {/* Dimensions */}
      <g strokeWidth={0.7}>
        <Ink d="M110 446V482M530 446V482" i={31} />
        <Ink d="M110 476H530M106 480l8-8M526 480l8-8" i={32} />
        <Ink
          d={`M130 458H510${columns.map((cx) => `M${cx - 3} 461l6-6`).join("")}`}
          i={33}
        />
        <Ink d="M542 404H586M326 84H586" i={34} />
        <Ink d="M580 404V84M576 408l8-8M576 88l8-8" i={35} />
        <Ink d="M436 108 492 66H506" i={36} />
        <Ink d="M114 410 70 380H56" i={37} />
      </g>
      <Note x={320} y={494} anchor="middle" i={34}>
        105′-0″
      </Note>
      <Note x={244} y={454} anchor="middle" i={35} size={9}>
        5 bays @ 19′-0″ c/c
      </Note>
      <Note x={604} y={244} anchor="middle" rotate={-90} i={36}>
        80′-0″
      </Note>
      <Note x={510} y={62} i={37} size={10}>
        tympanum
      </Note>
      <Note x={52} y={376} anchor="end" i={38} size={10}>
        stylobate
      </Note>
      <Note x={22} y={512} i={39} size={12}>
        Fig. I — Principal elevation
      </Note>
      <Note x={618} y={512} anchor="end" i={40} size={10}>
        Scale 1 : 100
      </Note>
    </Sketch>
  );
}

/** Floor plan with partitions, door swings and a stair. */
export function Plan({ className }: DrawingProps) {
  let treads = "";
  for (let x = 78; x <= 98; x += 4) treads += `M${x} 74V102`;
  return (
    <Sketch viewBox="0 0 120 120" className={className}>
      <Ink d="M14 14H106V106H14Z" i={0} w={1.6} />
      <Ink d="M18 18H102V102H18Z" i={1} w={0.7} />
      <Ink d="M18 62H46M58 62H102M58 18V40M58 52V62" i={2} />
      <Ink d="M46 62V50A12 12 0 0 1 58 62" i={3} w={0.7} />
      <Ink d="M58 40H70A12 12 0 0 1 58 52" i={4} w={0.7} />
      <Ink d={`M74 74H102${treads}`} i={5} w={0.8} />
      <Ink d="M14 7H106M14 4V10M106 4V10M60 5V9" i={6} w={0.6} />
      <Ink d="M113 14V106M110 14H116M110 106H116" i={7} w={0.6} />
    </Sketch>
  );
}

/** Semicircular arch with voussoirs and keystone. */
export function Arch({ className }: DrawingProps) {
  let joints = "";
  for (let k = 1; k < 9; k += 1) {
    if (k === 4 || k === 5) continue;
    const a = (Math.PI * k) / 9;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    joints += `M${(60 - 30 * cos).toFixed(1)} ${(78 - 30 * sin).toFixed(1)}L${(60 - 42 * cos).toFixed(1)} ${(78 - 42 * sin).toFixed(1)}`;
  }
  return (
    <Sketch viewBox="0 0 120 120" className={className}>
      <Ink d="M8 108H112" i={0} w={1.5} />
      <Ink d="M18 108V78M30 108V78M90 108V78M102 108V78" i={1} />
      <Ink d="M30 78A30 30 0 0 1 90 78" i={2} />
      <Ink d="M18 78A42 42 0 0 1 102 78" i={3} />
      <Ink d={joints} i={4} w={0.8} />
      <Ink d="M54.8 48.5 52.5 32H67.5L65.2 48.5" i={5} />
      <Ink d="M14 78H34M86 78H106" i={6} w={0.7} />
      <Faint d="M60 78 81.2 56.8M60 72V84M54 78H66" i={7} dash="3 3" />
    </Sketch>
  );
}

/** King-post roof truss. */
export function Truss({ className }: DrawingProps) {
  return (
    <Sketch viewBox="0 0 120 120" className={className}>
      <Ink d="M8 88H112M8 93H112" i={0} />
      <Ink d="M10 88 60 36 110 88" i={1} w={1.5} />
      <Ink d="M17 88 60 43.5 103 88" i={2} w={0.7} />
      <Ink d="M57 42V88M63 42V88" i={3} />
      <Ink d="M60 86 35 62M60 86 85 62" i={4} />
      <Ink d="M12 93V110M22 93V110M98 93V110M108 93V110" i={5} />
      <Ink d="M8 110H26M94 110H112" i={6} w={1.5} />
      <Ink d="M10 22H110M10 19V25M110 19V25" i={7} w={0.6} />
    </Sketch>
  );
}

/** Spiral stair in plan. */
export function Stair({ className }: DrawingProps) {
  let treads = "";
  for (let k = 0; k < 14; k += 1) {
    const a = (Math.PI * 2 * k) / 16;
    treads += `M${(60 + 9 * Math.cos(a)).toFixed(1)} ${(60 + 9 * Math.sin(a)).toFixed(1)}L${(60 + 44 * Math.cos(a)).toFixed(1)} ${(60 + 44 * Math.sin(a)).toFixed(1)}`;
  }
  return (
    <Sketch viewBox="0 0 120 120" className={className}>
      <Ink d={circle(60, 60, 44)} i={0} w={1.5} />
      <Ink d={circle(60, 60, 48)} i={1} w={0.6} />
      <Ink d={circle(60, 60, 9)} i={2} />
      <Ink d={treads} i={3} w={0.8} />
      <Ink d="M88 60A28 28 0 1 1 71 34.3M71 34.3l-6.5-.6M71 34.3l-2.4 6" i={4} w={0.7} />
    </Sketch>
  );
}

/** Drafting dividers striking an arc. */
export function Dividers({ className }: DrawingProps) {
  return (
    <Sketch viewBox="0 0 120 120" className={className}>
      <Ink d={circle(60, 20, 6)} i={0} />
      <Ink d={circle(60, 20, 2)} i={1} w={0.7} />
      <Ink d="M60 8V14" i={1} w={1.6} />
      <Ink d="M55.5 24 33 100 59 27" i={2} />
      <Ink d="M64.5 24 87 100 61 27" i={3} />
      <Ink d="M45 60H75" i={4} w={0.7} />
      <Ink d="M20 96Q60 118 100 96" i={5} w={0.8} />
      <Faint d="M33 100H87" i={6} dash="3 3" />
    </Sketch>
  );
}

/** Wall section: brick courses on a hatched footing. */
export function Section({ className }: DrawingProps) {
  let courses = "";
  for (let y = 24; y <= 74; y += 10) courses += `M44 ${y}H76`;
  let bonds = "";
  for (let y = 14, k = 0; y < 84; y += 10, k += 1)
    bonds += k % 2 ? `M54 ${y}V${y + 10}M68 ${y}V${y + 10}` : `M60 ${y}V${y + 10}`;
  let hatch = "";
  for (let x = 34; x < 86; x += 7) hatch += `M${x} 98L${Math.min(x + 14, 86)} ${x + 14 > 86 ? 98 - (86 - x) : 84}`;
  return (
    <Sketch viewBox="0 0 120 120" className={className}>
      <Ink d="M44 84V14H76V84" i={0} w={1.5} />
      <Ink d={courses} i={1} w={0.8} />
      <Ink d={bonds} i={2} w={0.7} />
      <Ink d="M34 84H86V98H34Z" i={3} w={1.5} />
      <Ink d={hatch} i={4} w={0.6} />
      <Ink d="M8 78H34M86 78H112" i={5} />
      <Ink d="M10 78l-5 6M18 78l-5 6M26 78l-5 6M94 78l-5 6M102 78l-5 6M110 78l-5 6" i={6} w={0.6} />
      <Ink d="M96 14V78M93 14H99M93 78H99" i={7} w={0.6} />
    </Sketch>
  );
}

/** Approval seal carrying the VORQ monogram. */
export function Seal({ className }: DrawingProps) {
  let ticks = "";
  for (let k = 0; k < 36; k += 1) {
    const a = (Math.PI * 2 * k) / 36;
    ticks += `M${(60 + 40 * Math.cos(a)).toFixed(1)} ${(60 + 40 * Math.sin(a)).toFixed(1)}L${(60 + 44 * Math.cos(a)).toFixed(1)} ${(60 + 44 * Math.sin(a)).toFixed(1)}`;
  }
  return (
    <Sketch viewBox="0 0 120 120" className={className}>
      <Ink d={circle(60, 60, 48)} i={0} w={1.5} />
      <Ink d={circle(60, 60, 36)} i={1} />
      <Ink d={ticks} i={2} w={0.7} />
      <Ink d={circle(60, 60, 28)} i={3} w={0.6} />
      <Ink d="M44 46H53L62.5 64.5 59.5 76Z" i={4} />
      <Ink d="M74 46H77L59.5 76" i={5} />
    </Sketch>
  );
}

/** Compass rose / north point. */
export function Rose({ className }: DrawingProps) {
  let ticks = "";
  for (let k = 0; k < 32; k += 1) {
    const a = (Math.PI * 2 * k) / 32;
    const inner = k % 4 === 0 ? 40 : 43;
    ticks += `M${(60 + inner * Math.cos(a)).toFixed(1)} ${(60 + inner * Math.sin(a)).toFixed(1)}L${(60 + 47 * Math.cos(a)).toFixed(1)} ${(60 + 47 * Math.sin(a)).toFixed(1)}`;
  }
  return (
    <Sketch viewBox="0 0 120 120" className={className} rough={1}>
      <Ink d={circle(60, 60, 47)} i={0} />
      <Ink d={circle(60, 60, 34)} i={1} w={0.6} />
      <Ink d={ticks} i={2} w={0.6} />
      <Ink d="M60 16 65 55 104 60 65 65 60 104 55 65 16 60 55 55Z" i={3} />
      <Ink d="M60 16V104M16 60H104" i={4} w={0.5} />
      <Ink d="M79 41 63 57M41 41 57 57M41 79 57 63M79 79 63 63" i={5} w={0.6} />
    </Sketch>
  );
}
