import type { ReactNode } from "react";
import { useInView } from "./useInView";

/**
 * Engravings from the plate volumes of Diderot and d'Alembert's Encyclopédie
 * (Paris, 1762), scanned by Wikimedia Commons contributors. Public domain.
 * Each file is the engraving's ink on a transparent ground, so it prints onto
 * whatever surface it sits on.
 */
export const plates = {
  masons: { src: "/plates/masons.webp", width: 960, height: 1550 },
  machines: { src: "/plates/machines.webp", width: 820, height: 1327 },
  stonecut: { src: "/plates/stonecut.webp", width: 820, height: 1286 },
  plan: { src: "/plates/plan.webp", width: 820, height: 1324 },
  house: { src: "/plates/house.webp", width: 945, height: 396 },
} as const;

type Props = {
  name: keyof typeof plates;
  alt: string;
  caption?: ReactNode;
  /** Mount the engraving on a sheet of lighter paper, like a leaf from the book. */
  sheet?: boolean;
  eager?: boolean;
  className?: string;
};

export function Plate({ name, alt, caption, sheet, eager, className = "" }: Props) {
  const [ref, seen] = useInView<HTMLElement>(0.12);
  const plate = plates[name];
  return (
    <figure ref={ref} className={`vq-plate ${seen ? "is-in" : ""} ${className}`}>
      <div className={sheet ? "vq-sheet" : undefined}>
        <img
          src={plate.src}
          width={plate.width}
          height={plate.height}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
