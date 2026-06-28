import { Text } from '@/components/ui/text';
import { LegalDocument, openLegalLink } from '@/lib/legal';
import { cn } from '@/lib/utils';

type LegalLinkProps = {
  document: LegalDocument;
  label: string;
  className?: string;
};

export function LegalLink({ document, label, className }: LegalLinkProps) {
  return (
    <Text
      className={cn('underline', className)}
      onPress={() => openLegalLink(document)}
      suppressHighlighting
    >
      {label}
    </Text>
  );
}

type LegalConsentProps = {
  action?: string;
  className?: string;
};

export function LegalConsent({
  action = 'continuing',
  className,
}: LegalConsentProps) {
  return (
    <Text
      variant="muted"
      className={cn('text-center text-xs leading-5', className)}
    >
      By {action}, you agree to our{' '}
      <LegalLink
        document="terms"
        label="Terms of Service"
        className="text-xs"
      />{' '}
      and{' '}
      <LegalLink
        document="privacy"
        label="Privacy Policy"
        className="text-xs"
      />
      .
    </Text>
  );
}
