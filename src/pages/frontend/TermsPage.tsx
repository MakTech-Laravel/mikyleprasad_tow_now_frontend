import Section from '@/components/section';
import { PageMeta } from '@/components/seo/PageMeta';
import { termsSections } from '@/features/townow-flow/data';

export default function TermsPage() {
  return (
    <>
      <PageMeta
        title="Terms Of Service"
        description="TowTruckTT terms of service."
        keywords={['terms', 'legal']}
      />

      <Section applyContainer containerClassName="space-y-6">
        <Section.Heading
          title="Terms Of Service"
          subtitle="TowTruckTT terms of service."
          align="left"
          className="mb-0"
        />

        <div className="space-y-4 text-sm leading-relaxed">
          {termsSections.map((item, index) => (
            <article key={index}>
              <h2 className="text-xl font-semibold">
                {' '}
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
