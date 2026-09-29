import { forwardRef } from "react";

import { schlonicPalette } from "../palette.js";

const SPARKS = 7;
const SPARK_COLOURS = [schlonicPalette.sparkHot, schlonicPalette.spark, schlonicPalette.sparkEmber] as const;

/** A number in 0..1 that is the same for the same seed on every machine: sparks flicker, both screens alike. */
const hash = (seed: number, salt: number): number => {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;

  return value - Math.floor(value);
};

/**
 * The grind's sparks, thrown back off the truck on the rail: short streaks fanned behind and
 * above it, redrawn every frame from where the rider is along the zone, so they flicker as it
 * travels and the two screens flicker alike. Hidden off a rail.
 */
export const paintSparks = (
  element: SVGGElement | null,
  spark: { visible: boolean; x: number; y: number; seed: number }
): void => {
  if (element === null) {
    return;
  }

  element.setAttribute("opacity", spark.visible ? "1" : "0");

  if (!spark.visible) {
    return;
  }

  element.setAttribute("transform", `translate(${spark.x} ${spark.y})`);

  for (let index = 0; index < SPARKS; index += 1) {
    const line = element.children[index];
    // Back along the rail and up off it, a few low ones skittering along its top.
    const angle = Math.PI * (0.92 + hash(spark.seed, index) * 0.42);
    const length = 1.2 + hash(spark.seed, index + 11) * 2.6;
    const from = 0.3 + hash(spark.seed, index + 23) * 0.8;

    line?.setAttribute("x1", `${Math.cos(angle) * from}`);
    line?.setAttribute("y1", `${Math.sin(angle) * from}`);
    line?.setAttribute("x2", `${Math.cos(angle) * (from + length)}`);
    line?.setAttribute("y2", `${Math.sin(angle) * (from + length)}`);
  }
};

export const Sparks = forwardRef<SVGGElement>((_props, ref): JSX.Element => (
  <g ref={ref} opacity={0} data-schlonic-sparks strokeLinecap="round">
    {Array.from({ length: SPARKS }, (_unused, index) => (
      <line key={index} stroke={SPARK_COLOURS[index % SPARK_COLOURS.length]} strokeWidth={index % 3 === 0 ? 0.55 : 0.4} />
    ))}
    <circle r={0.9} fill={schlonicPalette.sparkHot} opacity={0.9} />
  </g>
));

Sparks.displayName = "Sparks";
