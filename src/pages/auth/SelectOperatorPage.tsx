import { Link } from 'react-router-dom';
import { Truck, User } from 'lucide-react';

import { PageMeta } from '@/components/seo/PageMeta';
import Section from '@/components/section';
import AppIcon from '@/components/app-icon';

export default function SelectOperatorPage() {
  return (
    <>
      <PageMeta
        title="Register as operator"
        description="Choose whether you need a tow or you drive for TowTruckTT."
        keywords={['register', 'driver', 'rider', 'operator']}
      />
      <Section
        applyContainer
        containerClassName="flex flex-col items-center justify-center space-y-4"
      >
        <AppIcon buttonClassName="size-14" className="size-8!" />
        <Section.Heading
          title="Join TowTruckTT"
          subtitle="Select how you will use the platform."
          align="center"
          className="mt-4 mb-0"
        />

        <div className="space-y-4">
          <Link
            to="/register?role=user"
            className="flex items-center gap-5 rounded-lg border border-primary/40 bg-input/20 p-6 transition-all duration-300 hover:bg-input/30"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/80 text-white">
              <User className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium">I need a tow</h3>
              <p className="text-sm text-muted-foreground">
                Book drivers, track service, and pay securely.
              </p>
            </div>
          </Link>

          <Link
            to="/register?role=driver"
            className="flex items-center gap-5 rounded-lg border border-secondary/40 bg-secondary/20 p-6 transition-all duration-300 hover:bg-secondary/30"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/80">
              <Truck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium">I drive / operate</h3>
              <p className="text-sm text-muted-foreground">
                Accept jobs, message customers, and manage payouts.
              </p>
            </div>
          </Link>
        </div>

        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </Section>
    </>
  );
}
