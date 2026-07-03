import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export type SeatChurnVariant = 'inactive' | 'low-usage';

export interface SeatChurnReminderEmailProps {
  firstName: string;
  variant: SeatChurnVariant;
  periodDays: number;
  activeDaysInPeriod: number;
  lastActiveDay: string | null;
  dashboardUrl: string;
}

const colors = {
  background: '#faf7f1',
  foreground: '#26262b',
  card: '#ffffff',
  primary: '#e5322f',
  muted: '#6b6b73',
  border: '#e7e2d8',
};

function getUsageMessage(props: SeatChurnReminderEmailProps): string {
  const { variant, periodDays, activeDaysInPeriod, lastActiveDay } = props;

  if (variant === 'inactive') {
    if (lastActiveDay) {
      return `Over the last ${periodDays} days you had no active usage days in Cursor. Your last active day was ${lastActiveDay}.`;
    }
    return `Over the last ${periodDays} days you had no active usage days in Cursor.`;
  }

  return `Over the last ${periodDays} days you had ${activeDaysInPeriod} active day${activeDaysInPeriod === 1 ? '' : 's'} in Cursor${lastActiveDay ? ` — last active on ${lastActiveDay}` : ''}. We'd love to see you using it more.`;
}

export function SeatChurnReminderEmail(props: SeatChurnReminderEmailProps) {
  const { firstName, variant, dashboardUrl } = props;
  const usageMessage = getUsageMessage(props);
  const previewText =
    variant === 'inactive'
      ? `${firstName}, your Cursor seat hasn't seen much use lately`
      : `${firstName}, a friendly nudge to use Cursor more`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={wordmark}>shiwa</Text>
            <Text style={headerSubtitle}>Cursor Dashboard</Text>
          </Section>

          <Section style={card}>
            <Heading style={heading}>Hi {firstName},</Heading>
            <Text style={paragraph}>
              {variant === 'inactive'
                ? "We noticed your Cursor seat hasn't had active usage recently. Cursor is a powerful AI coding assistant — and your team has a seat reserved for you."
                : "You're using Cursor, but not as much as you could. A little more regular use helps you get the most from your seat — and keeps it active on the team plan."}
            </Text>
            <Text style={usageBox}>{usageMessage}</Text>
            <Text style={paragraph}>
              Open the dashboard to see your stats, track your progress on the leaderboard, and explore what Cursor can do for your daily workflow.
            </Text>

            <Section style={ctaSection}>
              <Button style={button} href={`${dashboardUrl}/me`}>
                See your Cursor stats
              </Button>
            </Section>

            <Text style={secondaryLink}>
              New to Cursor?{' '}
              <Link href="https://cursor.com/docs" style={link}>
                Start here
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You received this because an admin on the Shiwa Cursor Dashboard sent you a personal reminder.
            Reply to this email if you have questions.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default SeatChurnReminderEmail;

const main: React.CSSProperties = {
  backgroundColor: colors.background,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: '32px 16px',
};

const container: React.CSSProperties = {
  margin: '0 auto',
  maxWidth: '560px',
};

const header: React.CSSProperties = {
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const wordmark: React.CSSProperties = {
  color: colors.primary,
  fontSize: '28px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: '0 0 4px',
  textTransform: 'lowercase' as const,
};

const headerSubtitle: React.CSSProperties = {
  color: colors.muted,
  fontSize: '13px',
  margin: 0,
};

const card: React.CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  padding: '32px 28px',
};

const heading: React.CSSProperties = {
  color: colors.foreground,
  fontSize: '22px',
  fontWeight: 600,
  lineHeight: '1.3',
  margin: '0 0 16px',
};

const paragraph: React.CSSProperties = {
  color: colors.foreground,
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const usageBox: React.CSSProperties = {
  backgroundColor: colors.background,
  border: `1px solid ${colors.border}`,
  borderRadius: '12px',
  color: colors.muted,
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 20px',
  padding: '14px 16px',
};

const ctaSection: React.CSSProperties = {
  margin: '28px 0 20px',
  textAlign: 'center' as const,
};

const button: React.CSSProperties = {
  backgroundColor: colors.primary,
  borderRadius: '9999px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '14px 28px',
  textDecoration: 'none',
};

const secondaryLink: React.CSSProperties = {
  color: colors.muted,
  fontSize: '14px',
  margin: 0,
  textAlign: 'center' as const,
};

const link: React.CSSProperties = {
  color: colors.primary,
  textDecoration: 'underline',
};

const hr: React.CSSProperties = {
  borderColor: colors.border,
  margin: '24px 0',
};

const footer: React.CSSProperties = {
  color: colors.muted,
  fontSize: '12px',
  lineHeight: '1.5',
  margin: 0,
  textAlign: 'center' as const,
};
