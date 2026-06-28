"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

type MotionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

type MotionStaggerProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function MotionReveal({
  children,
  className,
  delay = 0,
  y = 24,
}: MotionRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={className}
        initial={reduceMotion ? undefined : { opacity: 0, y }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.24 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

export function MotionStagger({
  children,
  className,
  delay = 0,
}: MotionStaggerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={className}
        initial={reduceMotion ? undefined : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.18 }}
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: {
            opacity: 1,
            y: 0,
            transition: {
              delayChildren: delay,
              staggerChildren: 0.08,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

export function MotionItem({
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
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0 },
              }
        }
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
