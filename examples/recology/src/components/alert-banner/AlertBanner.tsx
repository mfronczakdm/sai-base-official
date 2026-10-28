'use client';

import { useState, type JSX } from 'react';
import { Text } from '@sitecore-content-sdk/nextjs';
import { ButtonBase } from '@/components/button-component/ButtonComponent';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { NoDataFallback } from '@/utils/NoDataFallback';
import type { AlertBannerProps } from './alert-banner.props';

const AlertBannerEmpty = (): JSX.Element => (
  <div className="component alert-banner">
    <div className="component-content">
      <span className="is-empty-hint">Alert Banner</span>
    </div>
  </div>
);

export const Default = (props: AlertBannerProps): JSX.Element => {
  const { fields } = props;
  const { title, description, link } = fields || {};
  const [isHidden, setIsHidden] = useState(false);

  if (!fields) {
    return <NoDataFallback componentName="Alert Banner" />;
  }

  return (
    <Alert className={cn('relative border-none', { hidden: isHidden }, props.params?.styles)}>
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 py-1 xl:px-8">
        <div className="space-y-1">
          <AlertTitle className="text-base font-semibold leading-none tracking-tight">
            <Text className="font-heading text-lg font-semibold" field={title} />
          </AlertTitle>
          <AlertDescription className="text-muted-foreground text-sm">
            <Text tag="p" className="font-body" field={description} />
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2">
          {link?.value?.href && <ButtonBase buttonLink={link} variant="default" />}
          <Button variant="default" size="icon" onClick={() => setIsHidden(true)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
};

/** Cream notice strip matching Recology Contact Us “Pay by Phone” banner */
export const Notice = (props: AlertBannerProps): JSX.Element => {
  const { fields } = props;
  const { title, description, link } = fields || {};
  const id = props.params?.RenderingIdentifier;

  if (!fields) {
    return <AlertBannerEmpty />;
  }

  return (
    <div
      id={id || undefined}
      data-class-change
      className={cn(
        'component alert-banner alert-banner--notice mx-auto mb-6 w-full max-w-screen-xl px-4',
        props.params?.styles
      )}
    >
      <div className="rounded-sm border border-[#e6c35c] bg-[#fff8e1] px-5 py-3 text-sm text-[#333] md:px-6">
        <p className="m-0 leading-relaxed">
          {(title?.value || props.page?.mode?.isEditing) && (
            <Text tag="strong" className="font-bold" field={title} />
          )}{' '}
          {(description?.value || props.page?.mode?.isEditing) && (
            <Text tag="span" field={description} />
          )}
          {link?.value?.href ? (
            <>
              {' '}
              <ButtonBase
                buttonLink={link}
                variant="link"
                className="inline h-auto p-0 text-sm font-semibold text-[#0057a8] underline"
              />
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
};
