"use client";

import { motion, HTMLMotionProps } from "framer-motion";

export function FadeIn(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      {...props}
    />
  );
}
