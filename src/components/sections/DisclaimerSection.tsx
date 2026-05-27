import { AlertCircle } from 'lucide-react';
import Section from '@/components/section';

export default function DisclaimerSection() {
  return (
    <Section animated={true} applyContainer className="bg-primary/25">
      <div className="flex max-w-[90%] gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
        <div>
          <p className="mb-1 font-semibold text-foreground">Important Disclaimer</p>
          <p>
            TowTruckTT operates as a directory and connection platform only. We do not provide
            towing services directly. All tow truck drivers listed on this platform are independent
            service providers. TowTruckTT is not responsible for the quality, safety, pricing, or
            any aspect of the services provided by individual drivers. Users engage with drivers at
            their own discretion and risk. We recommend verifying credentials, discussing pricing
            upfront, and ensuring proper insurance coverage. By using this platform, you acknowledge
            that TowTruckTT serves solely as a facilitator and assumes no liability for services
            rendered by third-party providers.
          </p>
        </div>
      </div>
    </Section>
  );
}
