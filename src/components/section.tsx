/**
 * Section — Reusable animated section component
 *
 * Sub-components:
 *   <Section.Heading>  — Animated title + subtitle block
 *   <Section.Item>     — Stagger-aware child wrapper
 *
 * @example Basic
 * <Section variant="alternate" paddingY="lg">
 *   <div>content</div>
 * </Section>
 *
 * @example With heading + staggered items
 * <Section stagger={0.12} preset="fadeUp">
 *   <Section.Heading title="How It Works" subtitle="Three simple steps" />
 *   <div className="grid grid-cols-3 gap-6">
 *     <Section.Item><Card /></Section.Item>
 *     <Section.Item><Card /></Section.Item>
 *     <Section.Item><Card /></Section.Item>
 *   </div>
 * </Section>
 *
 * @example Color variant
 * <Section color="primary" paddingY="xl">
 *   <p>Yellow primary background</p>
 * </Section>
 *
 * @example Polymorphic tag
 * <Section as="article" variant="light">
 *   <p>Renders as an article element</p>
 * </Section>
 *
 * @example No animation (above the fold)
 * <Section animated={false}>
 *   <HeroSection />
 * </Section>
 */

import { cn } from '@/lib/utils';
import { motion, type Easing, type MotionProps } from 'motion/react';
import { type ElementType, type HTMLAttributes, type ReactNode } from 'react';

// ─── Enums / union types ──────────────────────────────────────────────────────

export type SectionVariant = 'default' | 'alternate' | 'light' | 'dark' | 'transparent';

export type SectionColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'destructive'
  | 'card'
  | 'none';

export type PaddingSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type AnimationPreset =
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'fade'
  | 'scale'
  | 'blur'
  | 'none';

export type SectionAs =
  | 'section'
  | 'div'
  | 'article'
  | 'aside'
  | 'main'
  | 'header'
  | 'footer'
  | 'nav';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  children?: ReactNode;
  /** HTML element to render. Default: 'section' */
  as?: SectionAs;
  /** Background / text color scheme */
  variant?: SectionVariant;
  /**
   * Semantic color override — applies background from your design token.
   * When set, takes priority over `variant`.
   */
  color?: SectionColor;
  /** Uniform padding on all sides */
  padding?: PaddingSize;
  /** Vertical padding (default: 'lg') */
  paddingY?: PaddingSize;
  /** Horizontal padding */
  paddingX?: PaddingSize;
  /** Enable / disable animation. Default: true */
  animated?: boolean;
  /** Named entry animation. Default: 'fadeUp' */
  preset?: AnimationPreset;
  /** Entry delay in seconds */
  delay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Easing function */
  ease?: Easing;
  /** Stagger between Section.Item children in seconds. 0 = no stagger */
  stagger?: number;
  /** Portion of section visible before animating (0–1). Default: 0.15 */
  viewportAmount?: number;
  /** Animate only on first viewport entry. Default: true */
  once?: boolean;
  /** Distance in px for directional presets. Default: 24 */
  distance?: number;
  /** Full-width container bypass — set true to skip `container mx-auto` */
  fluid?: boolean;
  /** Apply container to the child item element of the section and return the outline/children. Default: false */
  applyContainer?: boolean;
  /** Class name to apply to the container. Default: '' */
  containerClassName?: string;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const VARIANT_CLASSES: Record<SectionVariant, string> = {
  default: '',
  alternate: 'bg-accent text-foreground',
  light: 'bg-background text-foreground',
  dark: 'bg-secondary text-secondary-foreground',
  transparent: 'bg-transparent',
};

const COLOR_CLASSES: Record<SectionColor, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  muted: 'bg-muted text-muted-foreground',
  accent: 'bg-accent text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  card: 'bg-accent text-card-foreground',
  none: '',
};

const PADDING_Y_CLASSES: Record<PaddingSize, string> = {
  none: '',
  xs: 'py-4',
  sm: 'py-8',
  md: 'py-12 md:py-16',
  lg: 'py-16 md:py-24',
  xl: 'py-20 md:py-32',
  '2xl': 'py-24 md:py-40',
  '3xl': 'py-32 md:py-48',
};

const PADDING_X_CLASSES: Record<PaddingSize, string> = {
  none: '',
  xs: 'px-2',
  sm: 'px-4',
  md: 'px-6 md:px-8',
  lg: 'px-8 md:px-12',
  xl: 'px-10 md:px-16',
  '2xl': 'px-12 md:px-20',
  '3xl': 'px-16 md:px-24',
};

const PADDING_ALL_CLASSES: Record<PaddingSize, string> = {
  none: '',
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-6 md:p-8',
  lg: 'p-8 md:p-12',
  xl: 'p-10 md:p-16',
  '2xl': 'p-12 md:p-20',
  '3xl': 'p-16 md:p-24',
};

/** Pre-created motion host elements — avoids `motion.create()` inside render (eslint react-hooks/static-components). */
const MOTION_BY_TAG: Record<SectionAs, ElementType> = {
  section: motion.section,
  div: motion.div,
  article: motion.article,
  aside: motion.aside,
  main: motion.main,
  header: motion.header,
  footer: motion.footer,
  nav: motion.nav,
};

// ─── Animation presets ────────────────────────────────────────────────────────

type AnimationState = Record<string, number | string>;

function resolvePreset(
  preset: AnimationPreset,
  distance: number,
): { initial: AnimationState; animate: AnimationState } {
  const hidden: Record<AnimationPreset, AnimationState> = {
    fadeUp: { opacity: 0, y: distance },
    fadeDown: { opacity: 0, y: -distance },
    fadeLeft: { opacity: 0, x: distance },
    fadeRight: { opacity: 0, x: -distance },
    fade: { opacity: 0 },
    scale: { opacity: 0, scale: 0.94 },
    blur: { opacity: 0, filter: `blur(8px)`, y: distance * 0.5 },
    none: {},
  };
  const visible: Record<AnimationPreset, AnimationState> = {
    fadeUp: { opacity: 1, y: 0 },
    fadeDown: { opacity: 1, y: 0 },
    fadeLeft: { opacity: 1, x: 0 },
    fadeRight: { opacity: 1, x: 0 },
    fade: { opacity: 1 },
    scale: { opacity: 1, scale: 1 },
    blur: { opacity: 1, filter: 'blur(0px)', y: 0 },
    none: {},
  };
  return { initial: hidden[preset], animate: visible[preset] };
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  children,
  className,
  id,
  as = 'section',
  variant = 'default',
  color,
  padding,
  paddingY = 'sm',
  paddingX,
  animated = true,
  preset = 'fadeUp',
  delay = 0,
  duration = 0.5,
  ease = 'easeOut',
  stagger = 0,
  viewportAmount = 0.15,
  once = true,
  distance = 24,
  fluid = false,
  applyContainer = false,
  containerClassName,
  ...rest
}: SectionProps) {
  // ── Class resolution ────────────────────────────────────────────────────────
  const bgClass = color ? COLOR_CLASSES[color] : VARIANT_CLASSES[variant];

  const paddingClass = padding
    ? PADDING_ALL_CLASSES[padding]
    : cn(paddingY ? PADDING_Y_CLASSES[paddingY] : '', paddingX ? PADDING_X_CLASSES[paddingX] : '');

  const baseClass = cn(bgClass, paddingClass, className);
  const containerWrapClass = cn(fluid ? 'container-fluid' : 'container', containerClassName);

  // ── Static render ───────────────────────────────────────────────────────────
  if (!animated || preset === 'none') {
    // Use a native element directly to avoid JSX.IntrinsicElements namespace issue
    const Tag = as as ElementType;
    if (applyContainer) {
      return (
        <Tag id={id} className={baseClass} {...rest}>
          <div className={containerWrapClass}>{children}</div>
        </Tag>
      );
    }
    return (
      <Tag id={id} className={baseClass} {...rest}>
        {children}
      </Tag>
    );
  }

  // ── Animated render ─────────────────────────────────────────────────────────
  const { initial, animate } = resolvePreset(preset, distance);

  const MotionTag = MOTION_BY_TAG[as] as ElementType;

  const transition: MotionProps['transition'] =
    stagger > 0
      ? { duration, ease, delay, staggerChildren: stagger, delayChildren: delay }
      : { duration, ease, delay };

  if (applyContainer) {
    return (
      <MotionTag
        id={id}
        className={baseClass}
        initial={initial}
        whileInView={animate}
        viewport={{ once, amount: viewportAmount }}
        transition={transition}
        {...(rest as MotionProps)}
      >
        <div className={containerWrapClass}>{children}</div>
      </MotionTag>
    );
  }
  return (
    <MotionTag
      id={id}
      className={baseClass}
      initial={initial}
      whileInView={animate}
      viewport={{ once, amount: viewportAmount }}
      transition={transition}
      {...(rest as MotionProps)}
    >
      {children}
    </MotionTag>
  );
}

// ─── Section.Item ─────────────────────────────────────────────────────────────

export interface SectionItemProps {
  children: ReactNode;
  className?: string;
  /** Per-item preset, independent of parent's preset */
  preset?: AnimationPreset;
  distance?: number;
}

function SectionItem({ children, className, preset = 'fadeUp', distance = 20 }: SectionItemProps) {
  const { initial, animate } = resolvePreset(preset, distance);
  return (
    <motion.div className={className} variants={{ hidden: initial, visible: animate }}>
      {children}
    </motion.div>
  );
}

// ─── Section.Heading ──────────────────────────────────────────────────────────

export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  /** Animate the heading in. Default: true */
  animated?: boolean;
  delay?: number;
  /** Badge label shown above the title */
  badge?: string;
}

function SectionHeading({
  title,
  subtitle,
  align = 'center',
  className,
  titleClassName,
  subtitleClassName,
  animated = true,
  delay = 0,
  badge,
}: SectionHeadingProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  const inner = (
    <div className={cn('mb-12', alignClass, className)}>
      {badge && (
        <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-widest text-primary uppercase">
          {badge}
        </span>
      )}
      <h2 className={cn('font-montserrat text-3xl font-bold text-foreground', titleClassName)}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-2 text-muted-foreground', subtitleClassName)}>{subtitle}</p>
      )}
    </div>
  );

  if (!animated) return inner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {inner}
    </motion.div>
  );
}

// ─── Attach sub-components ────────────────────────────────────────────────────

Section.Item = SectionItem;
Section.Heading = SectionHeading;

export default Section;