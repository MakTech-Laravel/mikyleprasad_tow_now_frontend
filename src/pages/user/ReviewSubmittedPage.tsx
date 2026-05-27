import { Link } from 'react-router-dom';
import { Home, ThumbsUp } from 'lucide-react';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import Section from '@/components/section';

export default function ReviewSubmittedPage() {
  return (
    <>
      <PageMeta
        title="Review Submitted"
        description="Review submission success page."
        keywords={['review submitted']}
      />

      <Section
        applyContainer
        containerClassName="flex min-h-[55vh] flex-col items-center justify-center space-y-4 text-center"
      >
        <div className="rounded-full bg-primary p-5 text-primary-foreground">
          <ThumbsUp className="size-10" />
        </div>
        <Section.Heading
          title="Thank You!"
          subtitle="Your review has been submitted successfully"
          className="mb-0"
        />
        {/* <h1 className="text-5xl font-bold">Thank You!</h1>
        <p className="text-muted-foreground">Your review has been submitted successfully</p> */}
        <div className="mt-3 flex w-full items-center justify-center gap-2">
          <Link to="/">
            <Button variant="outline" className="cursor-pointer">
              <Home className="size-4" /> Back to Home
            </Button>
          </Link>
          <Link to="/request-service">
            <Button className="cursor-pointer">Book Another Service</Button>
          </Link>
        </div>
      </Section>
    </>
  );
}
