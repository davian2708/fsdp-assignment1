import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import "../styles/tutorial.css";

const TOOLTIP_GAP = 12;
const VIEWPORT_PADDING = 12;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getTooltipPosition(rect, tooltipRect, preferredPlacement) {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const placements = [preferredPlacement, "top", "bottom", "right", "left"];
  const uniquePlacements = placements.filter(
    (v, i, arr) => v && arr.indexOf(v) === i
  );

  const targetBox = {
    left: rect.left - TOOLTIP_GAP,
    right: rect.right + TOOLTIP_GAP,
    top: rect.top - TOOLTIP_GAP,
    bottom: rect.bottom + TOOLTIP_GAP,
  };

  const overlapsTarget = (left, top) => {
    const tooltipBox = {
      left,
      right: left + tooltipRect.width,
      top,
      bottom: top + tooltipRect.height,
    };

    return !(
      tooltipBox.right < targetBox.left ||
      tooltipBox.left > targetBox.right ||
      tooltipBox.bottom < targetBox.top ||
      tooltipBox.top > targetBox.bottom
    );
  };

  for (const placement of uniquePlacements) {
    let top = 0;
    let left = 0;

    if (placement === "top") {
      top = rect.top - TOOLTIP_GAP - tooltipRect.height;
      left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    } else if (placement === "bottom") {
      top = rect.bottom + TOOLTIP_GAP;
      left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    } else if (placement === "left") {
      top = rect.top + rect.height / 2 - tooltipRect.height / 2;
      left = rect.left - TOOLTIP_GAP - tooltipRect.width;
    } else if (placement === "right") {
      top = rect.top + rect.height / 2 - tooltipRect.height / 2;
      left = rect.right + TOOLTIP_GAP;
    }

    const fitsHorizontally =
      left >= VIEWPORT_PADDING &&
      left + tooltipRect.width <= viewportW - VIEWPORT_PADDING;
    const fitsVertically =
      top >= VIEWPORT_PADDING &&
      top + tooltipRect.height <= viewportH - VIEWPORT_PADDING;

    if (fitsHorizontally && fitsVertically && !overlapsTarget(left, top)) {
      return {
        top,
        left,
      };
    }
  }

  const spaceAbove = rect.top;
  const spaceBelow = viewportH - rect.bottom;
  const preferAbove = spaceAbove > spaceBelow;

  const fallbackTop = preferAbove
    ? rect.top - TOOLTIP_GAP - tooltipRect.height
    : rect.bottom + TOOLTIP_GAP;

  return {
    top: clamp(
      fallbackTop,
      VIEWPORT_PADDING,
      viewportH - VIEWPORT_PADDING - tooltipRect.height
    ),
    left: clamp(
      rect.left + rect.width / 2 - tooltipRect.width / 2,
      VIEWPORT_PADDING,
      viewportW - VIEWPORT_PADDING - tooltipRect.width
    ),
  };
}

export default function TutorialOverlay({ steps = [], tutorialKey }) {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [spotlightStyle, setSpotlightStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    radius: 14,
  });
  const tooltipRef = useRef(null);
  const maskIdRef = useRef(
    `tutorial-mask-${Math.random().toString(36).slice(2)}`
  );

  const currentStep = useMemo(() => steps[index], [steps, index]);

  const stopTutorial = useCallback(() => {
    setActive(false);
    setIndex(0);
    if (tutorialKey) {
      window.dispatchEvent(
        new CustomEvent("app:tutorial-finished", {
          detail: { key: tutorialKey },
        })
      );
    }
  }, [tutorialKey]);

  const startTutorial = useCallback(() => {
    if (!steps.length) return;
    setActive(true);
    setIndex(0);
  }, [steps.length]);

  const goNext = useCallback(() => {
    if (index >= steps.length - 1) {
      stopTutorial();
      return;
    }
    setIndex((prev) => prev + 1);
  }, [index, steps.length, stopTutorial]);

  const goPrev = useCallback(() => {
    setIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    function handleOpenTutorial(event) {
      const eventKey = event?.detail?.key;
      if (tutorialKey && eventKey && eventKey !== tutorialKey) return;
      startTutorial();
    }

    window.addEventListener("app:open-tutorial", handleOpenTutorial);
    return () =>
      window.removeEventListener("app:open-tutorial", handleOpenTutorial);
  }, [startTutorial, tutorialKey]);

  useEffect(() => {
    if (!active || !currentStep) return undefined;

    const target = document.querySelector(currentStep.selector);
    if (!target) {
      goNext();
      return undefined;
    }

    target.classList.add("tutorial-highlight");

    const updatePosition = () => {
      const rect = target.getBoundingClientRect();
      const placement = currentStep.placement || "bottom";
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      if (!tooltipRect) return;
      const { top, left } = getTooltipPosition(rect, tooltipRect, placement);
      const padding = currentStep.padding ?? 6;
      const radius = currentStep.radius ?? 14;

      setSpotlightStyle({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        radius,
      });

      setTooltipStyle({
        top: `${top}px`,
        left: `${left}px`,
      });
    };

    const rafId = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      target.classList.remove("tutorial-highlight");
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [active, currentStep, goNext]);

  if (!active || !currentStep) return null;

  const overlay = (
    <div className="tutorial-layer" role="dialog" aria-live="polite">
      <svg className="tutorial-mask" aria-hidden="true">
        <defs>
          <mask id={maskIdRef.current}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={spotlightStyle.left}
              y={spotlightStyle.top}
              width={spotlightStyle.width}
              height={spotlightStyle.height}
              rx={spotlightStyle.radius}
              ry={spotlightStyle.radius}
              fill="black"
            />
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(4, 8, 18, 0.65)"
          mask={`url(#${maskIdRef.current})`}
        />

        <rect
          className="tutorial-outline"
          x={spotlightStyle.left}
          y={spotlightStyle.top}
          width={spotlightStyle.width}
          height={spotlightStyle.height}
          rx={spotlightStyle.radius}
          ry={spotlightStyle.radius}
        />
      </svg>

      <div className="tutorial-tooltip" style={tooltipStyle} ref={tooltipRef}>
        <div className="tutorial-step">Step {index + 1} of {steps.length}</div>
        <h4 className="tutorial-title">{currentStep.title}</h4>
        <p className="tutorial-text">{currentStep.content}</p>

        <div className="tutorial-actions">
          <button className="tutorial-btn secondary" onClick={stopTutorial}>
            Skip all
          </button>
          <div className="tutorial-nav">
            <button
              className="tutorial-btn ghost"
              onClick={goPrev}
              disabled={index === 0}
            >
              Back
            </button>
            <button className="tutorial-btn secondary" onClick={goNext}>
              Skip step
            </button>
            <button className="tutorial-btn primary" onClick={goNext}>
              {index === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }

  return overlay;
}