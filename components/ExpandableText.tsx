"use client";

import { useState } from "react";

type Props = {
  text: string;
  className?: string;
  clampClassName?: string;
  minLengthToClamp?: number;
};

// Renders text clamped to a few lines with a "Read more" / "Show less"
// toggle. Only shows the toggle when the text is long enough that it would
// actually be truncated, so short entries render as plain, uncluttered text.
export default function ExpandableText({
  text,
  className = "",
  clampClassName = "line-clamp-3",
  minLengthToClamp = 160,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const needsClamp = text.length > minLengthToClamp;

  return (
    <div>
      <p className={`${className} ${!expanded && needsClamp ? clampClassName : ""}`}>
        {text}
      </p>
      {needsClamp && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
