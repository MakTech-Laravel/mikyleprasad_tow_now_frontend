import { Clock, Search, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Section from '@/components/section';

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Search,
    title: 'Find Drivers',
    description:
      'Browse available tow truck drivers in your area. View ratings, reviews, and pricing.',
  },
  {
    step: 2,
    icon: Users,
    title: 'Request Service',
    description:
      'Select a driver and send your service request with pickup and drop-off locations.',
  },
  {
    step: 3,
    icon: Clock,
    title: 'Get Towed',
    description: 'Driver accepts, arrives at your location, and safely transports your vehicle.',
  },
];

export default function HowItWorksSection({ id }: { id: string }) {
  return (
    <Section animated={true} applyContainer id={id}>
      <div className="mb-12 text-center">
        <h2 className="font-montserrat text-3xl font-bold text-foreground">How It Works</h2>
        <p className="mt-2 text-muted-foreground">Three simple steps to get help on the road</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
          <Card key={step} className="border-border bg-background text-center">
            <CardContent className="flex flex-col items-center gap-4 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                <span className="font-montserrat text-2xl font-bold text-foreground">{step}</span>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-montserrat text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
