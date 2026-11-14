import type { ReactNode } from "react";
import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Smooth 2px telemetry progress ribbon pinned beneath the top edge of the viewport. */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.0005,
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] overflow-hidden bg-white/[0.04]"
    >
      <motion.div
        style={{ scaleX, transformOrigin: "0% 50%" }}
        className="h-full w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 shadow-[0_0_12px_rgba(16,240,160,0.65)]"
      />
    </div>
  );
}

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  scaleFrom?: number;
}

/** Smooth GPU-composited scroll-triggered entrance container. */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  yOffset = 22,
  scaleFrom = 0.985,
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, scale: scaleFrom }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: "some" }}
      transition={{
        duration: 0.58,
        delay,
        ease: EASE_OUT_EXPO,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxMediaProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  shiftY?: number;
  scaleRange?: [number, number];
  width?: number;
  height?: number;
  loading?: "eager" | "lazy";
  ariaHidden?: boolean;
  /** Set true when filling a positioned card/section background instead of standalone box sizing. */
  fillParent?: boolean;
}

/**
 * Scroll-linked GPU parallax frame for technical artwork and visual backdrops.
 * Smooths raw scroll velocity via a damped spring to prevent stepped wheel jitter.
 */
export function ParallaxMedia({
  src,
  alt,
  className = "",
  imgClassName = "",
  shiftY = 24,
  scaleRange = [1.06, 1.14],
  width,
  height,
  loading = "lazy",
  ariaHidden = false,
  fillParent = false,
}: ParallaxMediaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.001,
  });

  const y = useTransform(smoothProgress, [0, 1], [-shiftY, shiftY]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [scaleRange[0], scaleRange[1], scaleRange[0]]);

  return (
    <div
      ref={containerRef}
      className={`${fillParent ? "absolute inset-0" : "relative"} overflow-hidden ${className}`}
    >
      <motion.img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        aria-hidden={ariaHidden}
        style={{
          y,
          scale,
          height: `calc(100% + ${shiftY * 2}px)`,
          top: `-${shiftY}px`,
        }}
        className={`relative w-full object-cover will-change-transform ${imgClassName}`}
      />
    </div>
  );
}
