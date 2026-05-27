import Section from '@/components/section';
import { PageMeta } from '@/components/seo/PageMeta';
import { privacySections } from '@/features/townow-flow/data';

export default function PrivacyPage() {
  return (
    <>
      <PageMeta
        title="Privacy Policy"
        description="TowTruckTT privacy policy."
        keywords={['privacy policy', 'legal']}
      />

      <Section applyContainer containerClassName="space-y-6">
        <Section.Heading
          title="Privacy Policy"
          subtitle="TowTruckTT privacy policy."
          align="left"
          className="mb-0"
        />
        {/* <h1 className="text-5xl font-bold">PRIVACY POLICY</h1>
        <p className="text-muted-foreground">
          Welcome to towtrucktt.com. Your privacy is important to us. This policy explains how we collect and use your information.
        </p> */}

        <div className="space-y-4 text-sm leading-relaxed">
          {privacySections.map((item, index) => (
            <article key={index}>
              <h2 className="text-xl font-semibold">
                {index + 1}. {item.title}
              </h2>
              <p className="text-muted-foreground">
                {item.contents.map((content) => (
                  <p key={content} className="pl-4">
                    {content}
                  </p>
                ))}
              </p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
