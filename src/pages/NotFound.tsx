import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MoveLeft, Home } from 'lucide-react';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <PageMeta
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
        keywords={['404', 'not found', 'error']}
      />
      <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background">
        {/* Background Decorative Glow */}
        <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="container-fluid relative z-10 mx-auto flex flex-col items-center justify-center px-4">
          {/* Animated Number */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative"
          >
            <h1 className="text-[12rem] leading-none font-black tracking-tighter text-foreground/5 select-none md:text-[18rem]">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                  Lost in space?
                </h2>
                <p className="mx-auto mt-4 max-w-[400px] text-lg text-muted-foreground">
                  The page you're looking for has vanished into the digital void. Let's get you back
                  on track.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              className="group h-14 rounded-full border-border px-8 text-base font-semibold hover:bg-muted"
            >
              <MoveLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Go Back
            </Button>

            <Button
              asChild
              size="lg"
              className="h-14 rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Subtle Grid Background (Optional) */}
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:40px_40px]" />
      </div>
    </>
  );
}
