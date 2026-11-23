"use client";

import { cn } from "@/lib/utils";

export interface DiagonalQuadLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * DiagonalQuadLoader:
 * 4 dynamic small rectangles arranged in an orbiting quadrant.
 * Symmetrically aligned with exact equidistant horizontal and vertical gaps
 * to ensure 100% precision centering without wobble.
 */
export function DiagonalQuadLoader({
  size = "md",
  className,
}: DiagonalQuadLoaderProps) {
  // Container bounding box (square with origin-center for wobble-free spin)
  const containerSize =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";

  // Symmetrical tile proportions with equal X & Y crosshair spacing
  const rectSize =
    size === "sm"
      ? "h-[10px] w-[10px]"
      : size === "lg"
      ? "h-[16px] w-[16px]"
      : "h-[13px] w-[13px]";

  // Offset placement to maintain an exact center crosshair gap
  const offset = size === "sm" ? "2px" : size === "lg" ? "3px" : "3px";

  // Diagonal rounded corners: opposite diagonal corners rounded, adjacent corners micro
  const tlRadius =
    size === "sm"
      ? "rounded-tl-[5px] rounded-br-[5px] rounded-tr-[1px] rounded-bl-[1px]"
      : size === "lg"
      ? "rounded-tl-[8px] rounded-br-[8px] rounded-tr-[2px] rounded-bl-[2px]"
      : "rounded-tl-[6px] rounded-br-[6px] rounded-tr-[1.5px] rounded-bl-[1.5px]";

  const trRadius =
    size === "sm"
      ? "rounded-tr-[5px] rounded-bl-[5px] rounded-tl-[1px] rounded-br-[1px]"
      : size === "lg"
      ? "rounded-tr-[8px] rounded-bl-[8px] rounded-tl-[2px] rounded-br-[2px]"
      : "rounded-tr-[6px] rounded-bl-[6px] rounded-tl-[1.5px] rounded-br-[1.5px]";

  const blRadius =
    size === "sm"
      ? "rounded-bl-[5px] rounded-tr-[5px] rounded-tl-[1px] rounded-br-[1px]"
      : size === "lg"
      ? "rounded-bl-[8px] rounded-tr-[8px] rounded-tl-[2px] rounded-br-[2px]"
      : "rounded-bl-[6px] rounded-tr-[6px] rounded-tl-[1.5px] rounded-br-[1.5px]";

  const brRadius =
    size === "sm"
      ? "rounded-br-[5px] rounded-tl-[5px] rounded-tr-[1px] rounded-bl-[1px]"
      : size === "lg"
      ? "rounded-br-[8px] rounded-tl-[8px] rounded-tr-[2px] rounded-bl-[2px]"
      : "rounded-br-[6px] rounded-tl-[6px] rounded-tr-[1.5px] rounded-bl-[1.5px]";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center animate-quad-spin origin-center select-none",
        containerSize,
        className,
      )}
      style={{ transformOrigin: "center center" }}
      aria-hidden="true"
    >
      {/* ── Top-Left Rectangle (Container 1) ── */}
      <span
        style={{ top: offset, left: offset }}
        className={cn(
          "absolute transition-colors animate-quad-rect-1",
          rectSize,
          tlRadius,
        )}
      />

      {/* ── Top-Right Rectangle (Container 2) ── */}
      <span
        style={{ top: offset, right: offset }}
        className={cn(
          "absolute transition-colors animate-quad-rect-2",
          rectSize,
          trRadius,
        )}
      />

      {/* ── Bottom-Left Rectangle (Container 3) ── */}
      <span
        style={{ bottom: offset, left: offset }}
        className={cn(
          "absolute transition-colors animate-quad-rect-3",
          rectSize,
          blRadius,
        )}
      />

      {/* ── Bottom-Right Rectangle (Container 4) ── */}
      <span
        style={{ bottom: offset, right: offset }}
        className={cn(
          "absolute transition-colors animate-quad-rect-4",
          rectSize,
          brRadius,
        )}
      />
    </div>
  );
}
