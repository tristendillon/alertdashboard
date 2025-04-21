import { AnyFieldApi } from "@tanstack/react-form";
import { motion, AnimatePresence } from "motion/react"
import { useEffect, useRef, useState } from "react";

// React Motion
const containerAnimation = {
  initial: { height: 0 },
  animate: (height: number) => ({ height }),
  transition: { duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] },
};

const contentAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

interface FieldInfoProps {
  field: AnyFieldApi;
}

export function FieldInfo({ field }: FieldInfoProps) {
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const hasContent =
        (field.state.meta.isTouched && field.state.meta.errors.length) ||
        field.state.meta.isValidating;
      setHeight(hasContent ? contentRef.current.scrollHeight : 0);
    }
  }, [
    field.state.meta.isTouched,
    field.state.meta.errors.length,
    field.state.meta.isValidating,
  ]);

  return (
    <motion.div
      className="overflow-hidden"
      initial={containerAnimation.initial}
      animate={containerAnimation.animate(height)}
      transition={containerAnimation.transition}
    >
      <div ref={contentRef}>
        <AnimatePresence mode="wait">
          {field.state.meta.isTouched && field.state.meta.errors.length ? (
            <motion.p
              key="error"
              className="text-sm font-medium text-destructive"
              {...contentAnimation}
            >
              {field.state.meta.errors.map((err) => err.message).join(", ")}
            </motion.p>
          ) : field.state.meta.isValidating ? (
            <motion.p
              key="validating"
              className="text-sm text-muted-foreground"
              {...contentAnimation}
            >
              Validating...
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
