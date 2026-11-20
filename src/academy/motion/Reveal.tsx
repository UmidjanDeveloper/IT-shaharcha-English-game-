// Entrance and hover motion for the club pages. The pattern (sections and cards that rise in with a
// stagger as you scroll, cards that tilt towards the pointer) is inspired by
// adrianhajdin/project_3D_developer_portfolio; this is our own implementation with `motion`.
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { ReactNode, PointerEvent } from 'react';

const rise = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 120, damping: 20 } },
};

/** A container whose direct <RevealItem> children rise in one after another when scrolled into view. */
export function RevealGroup({ children, className, stagger = .06, as = 'div' }: { children: ReactNode; className?: string; stagger?: number; as?: 'div' | 'ol' | 'ul' | 'section' }) {
  const Tag = motion[as];
  return <Tag className={className} initial="hidden" whileInView="shown" viewport={{ once: true, amount: .12 }}
    variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}>{children}</Tag>;
}

export function RevealItem({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  const Tag = motion[as];
  return <Tag className={className} variants={rise}>{children}</Tag>;
}

/** Fades and lifts a single block into view. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }}
    transition={{ type: 'spring', stiffness: 110, damping: 20, delay }}>{children}</motion.div>;
}

/** Tilts its content towards the pointer with a soft spring and a moving highlight. */
export function Tilt({ children, className, max = 9 }: { children: ReactNode; className?: string; max?: number }) {
  const x = useMotionValue(.5), y = useMotionValue(.5);
  const sx = useSpring(x, { stiffness: 180, damping: 18 }), sy = useSpring(y, { stiffness: 180, damping: 18 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const glare = useTransform([sx, sy] as never, ([a, b]: number[]) => `radial-gradient(circle at ${a * 100}% ${b * 100}%, rgb(255 255 255 / .22), transparent 55%)`);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width); y.set((e.clientY - r.top) / r.height);
  };
  return <motion.div className={`tilt ${className ?? ''}`} style={{ rotateX, rotateY, transformPerspective: 900 }}
    onPointerMove={move} onPointerLeave={() => { x.set(.5); y.set(.5); }}>
    {children}<motion.span className="tilt-glare" style={{ background: glare }} aria-hidden="true" />
  </motion.div>;
}
