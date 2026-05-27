import { PageMeta } from '@/components/seo/PageMeta';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DriverAccountApprovalPage() {
  return (
    <>
      <PageMeta title="Account approval" description="Driver onboarding status." />
      <div className="space-y-6">
        <h1 className="font-montserrat text-2xl font-semibold tracking-tight">Account approval</h1>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Under review</CardTitle>
            <CardDescription>
              Thanks for applying. Our team is verifying your documents. You will receive an email
              when you are cleared to go online (Figma: Account approval waiting).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Typical review time: 1–2 business days.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
