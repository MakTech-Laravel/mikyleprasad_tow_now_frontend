import { lazy, Suspense, useEffect } from 'react';
import { PageMeta } from '@/components/seo/PageMeta';
import Loading from '@/components/loading';
import HeroSection from '@/components/sections/HeroSection';
import { useLocation } from 'react-router-dom';
const HowItWorksSection = lazy(() => import('@/components/sections/HowItWorksSection'));
const FeaturedDriversSection = lazy(() => import('@/components/sections/FeaturedDriversSection'));
const TestimonialsSection = lazy(() => import('@/components/sections/TestimonialsSection'));
const DisclaimerSection = lazy(() => import('@/components/sections/DisclaimerSection'));

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetElement = document.getElementById(location.hash.slice(1));
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);
  return (
    <>
      <PageMeta
        title="Home"
        description="Connect with reliable tow truck drivers across Trinidad. Fast, simple, and trustworthy."
        keywords={['tow truck', 'Trinidad', 'roadside assistance', 'towing']}
      />
      <HeroSection />
      <Suspense fallback={<Loading />}>
        <FeaturedDriversSection />
        <HowItWorksSection id="how-it-works" />
        <TestimonialsSection />
        <DisclaimerSection />
      </Suspense>
    </>
  );
}
