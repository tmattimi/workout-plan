import { useMemo } from "react";
import Model from "react-body-highlighter";

/*
  MuscleMap — wraps react-body-highlighter (MIT, real anatomical SVG polygons)
  and adapts it to MuscleScience's muscle-id system + pick(id) contract.

  VERIFIED from package docs:
    - <Model data={[{ name, muscles:[...] }]} onClick={fn} style={{}} />
    - onClick receives ({ muscle, data }) where `muscle` is the slug string
    - type prop selects the view: "anterior" (front) | "posterior" (back)
    - highlightedColors={[...]} sets colors by intensity (1-based)

  Library muscle slugs:
    trapezius, upper-back, lower-back, chest, biceps, triceps, forearm,
    back-deltoids, front-deltoids, abs, obliques, adductor, hamstring,
    quadriceps, abductors, calves, gluteal, head, neck
*/

const ID_TO_SLUGS = {
  chest:      ["chest"],
  shoulders:  ["front-deltoids", "back-deltoids"],
  biceps:     ["biceps"],
  triceps:    ["triceps"],
  core:       ["abs", "obliques"],
  back:       ["upper-back", "lower-back", "trapezius"],
  quads:      ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes:     ["gluteal"],
  calves:     ["calves"],
};

const SLUG_TO_ID = Object.entries(ID_TO_SLUGS).reduce((acc, [id, slugs]) => {
  slugs.forEach((s) => { acc[s] = id; });
  return acc;
}, {});

export default function MuscleMap({ view = "front", sel, onPick, colorFor, size = 200 }) {
  const data = useMemo(() => {
    // One entry per MuscleScience id. Selected muscle -> intensity 2 (highlight
    // color), everything else -> intensity 1 (soft baseline so the body reads
    // as a full anatomical figure and every region stays tappable).
    return Object.keys(ID_TO_SLUGS).map((id) => ({
      name: id,
      muscles: ID_TO_SLUGS[id],
      intensity: sel === id ? 2 : 1,
    }));
  }, [sel]);

  const selColor = (sel && colorFor) ? colorFor(sel) : "#2563a8";
  const colors = ["#e4dfd8", selColor]; // [baseline, selected]

  function handleClick(part) {
    const slug = part?.muscle || part?.slug || (typeof part === "string" ? part : null);
    if (!slug) return;
    const id = SLUG_TO_ID[slug];
    if (id && onPick) onPick(id);
  }

  return (
    <Model
      data={data}
      type={view === "back" ? "posterior" : "anterior"}
      onClick={handleClick}
      highlightedColors={colors}
      style={{ width: size, margin: "0 auto" }}
    />
  );
}
