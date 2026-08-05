"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

const revealTransition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function ErpMotionBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <m.div
          className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14),transparent_68%)] blur-3xl"
          animate={reduceMotion ? undefined : { y: [0, -12, 0], x: [0, 8, 0] }}
          transition={reduceMotion ? undefined : { duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <m.div
          className="absolute right-[-5rem] top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.12),transparent_68%)] blur-3xl"
          animate={reduceMotion ? undefined : { y: [0, 14, 0], x: [0, -10, 0] }}
          transition={reduceMotion ? undefined : { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0))]" />
      </div>
    </LazyMotion>
  );
}

export function ErpMotionSection({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={className}
        initial={reduceMotion ? undefined : { opacity: 0, y }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ ...revealTransition, delay }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

export function ErpMotionStagger({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={className}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "show"}
        variants={{
          hidden: { opacity: 0, y: 12 },
          show: {
            opacity: 1,
            y: 0,
            transition: {
              delayChildren: delay,
              staggerChildren: 0.07,
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1] as const,
            },
          },
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

export function ErpMotionItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={className}
        variants={
          reduceMotion
            ? undefined
            : {
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }
        }
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
