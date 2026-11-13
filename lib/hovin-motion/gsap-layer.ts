"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import {
  hovinMotionDistance,
  hovinMotionDuration,
  hovinMotionEase,
  hovinMotionStagger,
} from "./tokens";
import { prefersReducedMotion } from "./reduce-motion";

let registered = false;

export function ensureHovinGsap() {
  if (registered || typeof window === "undefined") return gsap;
  gsap.registerPlugin(Flip);
  registered = true;
  return gsap;
}

export type EnterOptions = {
  targets: gsap.TweenTarget;
  stagger?: boolean;
};

/** Subtle fade + rise for workflow panels. No-op under reduced motion. */
export function hovinEnter(options: EnterOptions) {
  ensureHovinGsap();
  if (prefersReducedMotion()) {
    gsap.set(options.targets, { clearProps: "opacity,transform" });
    return null;
  }
  return gsap.fromTo(
    options.targets,
    { opacity: 0, y: hovinMotionDistance.enterY },
    {
      opacity: 1,
      y: 0,
      duration: hovinMotionDuration.enter,
      ease: hovinMotionEase.enter,
      stagger: options.stagger ? hovinMotionStagger.step : 0,
      overwrite: "auto",
    },
  );
}

/**
 * GSAP Flip for list↔detail / step layout changes.
 * Call after DOM mutation with a prior Flip.getState snapshot.
 */
export function hovinFlip(state: Flip.FlipState | null, targets: gsap.DOMTarget) {
  ensureHovinGsap();
  if (!state || prefersReducedMotion()) return null;
  return Flip.from(state, {
    targets,
    duration: hovinMotionDuration.ui,
    ease: hovinMotionEase.standard,
    absolute: false,
    nested: true,
    onEnter: (elements) =>
      gsap.fromTo(
        elements,
        { opacity: 0, y: hovinMotionDistance.enterY },
        { opacity: 1, y: 0, duration: hovinMotionDuration.enter, ease: hovinMotionEase.enter },
      ),
    onLeave: (elements) =>
      gsap.to(elements, { opacity: 0, duration: hovinMotionDuration.feedback, ease: hovinMotionEase.standard }),
  });
}

export function hovinFlipState(targets: gsap.DOMTarget) {
  ensureHovinGsap();
  if (prefersReducedMotion()) return null;
  return Flip.getState(targets);
}

/** Progress width for known logistics checkpoints only. */
export function hovinProgress(target: gsap.TweenTarget, progress01: number) {
  ensureHovinGsap();
  const width = `${Math.max(0, Math.min(1, progress01)) * 100}%`;
  if (prefersReducedMotion()) {
    gsap.set(target, { width });
    return null;
  }
  return gsap.to(target, {
    width,
    duration: hovinMotionDuration.progress,
    ease: hovinMotionEase.progress,
    overwrite: "auto",
  });
}

export { Flip, gsap };
