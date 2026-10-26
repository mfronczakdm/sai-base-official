'use client';

import type { JSX } from 'react';
import { Link, RichText, Text } from '@sitecore-content-sdk/nextjs';
import { getDatasource, getFieldValue } from '@/lib/component-props';
import { cn } from '@/lib/utils';
import { NoDataFallback } from '@/utils/NoDataFallback';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { RegionalFaqProps, ResolvedRegionalFaq } from './regional-faq.props';
import { resolveRegionalFaqList } from './resolve-regional-faq';

const isChecked = (field?: {
  jsonValue?: { value?: boolean | string };
  value?: boolean | string;
}): boolean => {
  const value = getFieldValue(field)?.value ?? field?.value;
  return value === true || value === '1' || value === 'true';
};

const EditorEmpty = ({ message }: { message: string }): JSX.Element => (
  <div className="component regional-faq">
    <div className="component-content">
      <span className="is-empty-hint">{message}</span>
    </div>
  </div>
);

const FaqAccordionItems = ({
  faqs,
  showCategories,
}: {
  faqs: ResolvedRegionalFaq[];
  showCategories: boolean;
}): JSX.Element => (
  <>
    {faqs.map((faq) => {
      const panelId = `regional-faq-panel-${faq.id}`;
      return (
        <AccordionItem key={faq.id} value={faq.id} data-testid="regional-faq-item">
          <AccordionTrigger
            className="text-left font-heading text-base font-semibold focus-visible:ring-2 focus-visible:ring-ring"
            aria-controls={panelId}
          >
            <span className="flex flex-col items-start gap-1">
              {showCategories && faq.category && (
                <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  {faq.category}
                </span>
              )}
              <Text field={faq.question} />
            </span>
          </AccordionTrigger>
          <AccordionContent id={panelId}>
            {faq.resolvedAnswer && (
              <RichText
                field={faq.resolvedAnswer}
                className="text-sm leading-relaxed text-foreground/90 [&_p]:mb-3"
              />
            )}
            {faq.behavior === 'AddRegionalInformation' && faq.regionalSupportingInformation && (
              <div
                className="mt-4 border-l-4 border-secondary pl-4"
                data-testid="regional-faq-supporting"
              >
                <RichText
                  field={faq.regionalSupportingInformation}
                  className="text-sm leading-relaxed text-foreground/85 [&_p]:mb-2"
                />
              </div>
            )}
            {faq.contactCta?.value?.href && (
              <div className="mt-4">
                <Link
                  field={faq.contactCta}
                  className="text-sm font-medium text-primary underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      );
    })}
  </>
);

export const Default = (props: RegionalFaqProps): JSX.Element => {
  const { fields, params, page } = props;
  const { styles, RenderingIdentifier } = params || {};
  const isEditing = Boolean(page?.mode?.isEditing);

  const datasource = getDatasource(fields) || fields?.data?.datasource;
  if (!datasource) {
    return isEditing ? (
      <EditorEmpty message="Regional FAQ needs a Regional FAQ Collection datasource assigned." />
    ) : (
      <NoDataFallback componentName="RegionalFAQ" />
    );
  }

  const configurations =
    datasource.faqConfigurations?.targetItems || datasource.children?.results || [];
  const faqs = resolveRegionalFaqList(configurations);

  const headingField = getFieldValue(datasource.heading) || getFieldValue(datasource.title);
  const introField = getFieldValue(datasource.introductoryText);
  const emptyMessageField = getFieldValue(datasource.emptyStateMessage);
  const expandFirst = isChecked(datasource.expandFirstItem);
  const allowMultiple = isChecked(datasource.allowMultipleOpenItems);
  const showCategories = isChecked(datasource.showCategories);

  const hasHeading = Boolean(headingField?.value?.toString().trim()) || isEditing;
  const hasIntro = Boolean(introField?.value?.toString().trim()) || isEditing;
  const hasFaqs = faqs.length > 0;

  if (!hasHeading && !hasIntro && !hasFaqs) {
    if (isEditing) {
      return (
        <EditorEmpty message="No applicable FAQs are configured for this region. Add FAQ Configurations or check Exclude/Active settings." />
      );
    }
    return <NoDataFallback componentName="RegionalFAQ" />;
  }

  const defaultValue = expandFirst && faqs[0] ? faqs[0].id : undefined;

  return (
    <section
      className={cn('component regional-faq @container bg-background text-foreground', styles)}
      id={RenderingIdentifier || undefined}
      data-testid="regional-faq"
    >
      <div className="component-content mx-auto max-w-3xl px-4 py-10 @md:py-14">
        {hasHeading && (
          <Text
            tag="h2"
            field={headingField}
            className="font-heading text-3xl font-semibold tracking-tight text-foreground @md:text-4xl"
          />
        )}

        {hasIntro && (
          <RichText
            field={introField}
            className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/90 [&_p]:mb-3"
          />
        )}

        {!hasFaqs && isEditing && (
          <p className="mt-6 text-sm text-muted-foreground" data-testid="regional-faq-editor-empty">
            {emptyMessageField?.value?.toString().trim() ||
              'No applicable FAQs are configured for this region.'}
          </p>
        )}

        {!hasFaqs && !isEditing && emptyMessageField?.value?.toString().trim() && (
          <p className="mt-6 text-sm text-foreground/80" data-testid="regional-faq-empty-state">
            {emptyMessageField.value.toString()}
          </p>
        )}

        {hasFaqs && allowMultiple && (
          <Accordion
            type="multiple"
            defaultValue={defaultValue ? [defaultValue] : undefined}
            className="mt-8 w-full"
            data-testid="regional-faq-accordion"
          >
            <FaqAccordionItems faqs={faqs} showCategories={showCategories} />
          </Accordion>
        )}

        {hasFaqs && !allowMultiple && (
          <Accordion
            type="single"
            collapsible
            defaultValue={defaultValue}
            className="mt-8 w-full"
            data-testid="regional-faq-accordion"
          >
            <FaqAccordionItems faqs={faqs} showCategories={showCategories} />
          </Accordion>
        )}
      </div>
    </section>
  );
};
