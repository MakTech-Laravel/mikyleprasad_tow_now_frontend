import { motion } from 'motion/react';
import { SITE_NAME } from '@/components/seo/siteName';

interface LoadingProps {
  message?: string;
  backgroundText?: string;
}

export default function Loading({
  message = 'Loading...',
  backgroundText = SITE_NAME,
}: LoadingProps) {
  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden bg-background py-24">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px] md:h-[500px] md:w-[500px] md:blur-[120px]" />

      {/* Subtle grid */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:40px_40px]" />

      <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-4">
        {/* Background text + spinner */}
        <div className="relative flex items-center justify-center">
          {/*
           * Background text — capped small on mobile so it never overflows.
           * 4rem  → fits ~375px screens comfortably
           * 7rem  → tablet
           * 16rem → desktop (original size)
           */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-[1rem] leading-none font-black tracking-tighter text-foreground/5 select-none sm:text-[4rem] md:text-[8rem]"
          >
            {backgroundText}
          </motion.h1>

          {/* Spinner overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Outer slow ring */}
              <motion.span
                className="absolute h-16 w-16 rounded-full border-2 border-primary/20 sm:h-24 sm:w-24"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              />

              {/* Middle dashed ring */}
              <motion.span
                className="absolute h-11 w-11 rounded-full border-2 border-dashed border-primary/40 sm:h-16 sm:w-16"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              />

              {/* Inner spinning arc */}
              <motion.span
                className="absolute h-7 w-7 rounded-full border-2 border-transparent border-t-primary sm:h-10 sm:w-10"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              />

              {/* Center dot */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: 'backOut' }}
                className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/40 sm:h-4 sm:w-4"
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <p className="text-sm font-semibold tracking-wide text-foreground sm:text-base">
            {message}
          </p>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
