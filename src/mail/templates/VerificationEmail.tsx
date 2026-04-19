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
import { Tailwind } from '@react-email/tailwind';
import { env } from 'src/common/config/env/env';

interface VerificationEmailProps {
  name: string;
  verificationSecret: string;
  userId: string;
  appName?: string;
  supportEmail?: string;
  expiresInMinutes?: number;
}

export const VerificationEmail = ({
  name,
  verificationSecret,
  userId,
  appName = 'Your App',
  supportEmail = 'support@example.com',
  expiresInMinutes = 15,
}: VerificationEmailProps) => {
  const actionUrl = `${env.APP_URL}/auth/verify-email?userId=${userId}&secret=${verificationSecret}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Verify your {appName} account to activate your AI-native workspace.
      </Preview>
      <Tailwind>
        <Body className="m-0 bg-slate-100 py-8 font-sans">
          <Container className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-8">
            <Section>
              <Text className="m-0 inline-block rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">
                Verify Email
              </Text>

              <Heading className="m-0 mt-5 text-2xl font-semibold text-slate-900">
                Verify your email, {name}
              </Heading>

              <Text className="mb-0 mt-4 text-base leading-7 text-slate-700">
                You are almost there. Confirm your email address to activate
                your {appName} account and secure access to your AI-native
                workspace.
              </Text>
            </Section>

            <Section className="my-8 text-center">
              <Button
                href={actionUrl}
                className="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white no-underline"
              >
                Verify Email
              </Button>
            </Section>

            <Section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center">
              <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                One-time verification code
              </Text>
              <Text className="m-0 mt-3 font-mono text-3xl font-semibold tracking-[0.2em] text-slate-900">
                {verificationSecret}
              </Text>
              <Text className="m-0 mt-3 text-xs text-slate-500">
                This code expires in {expiresInMinutes} minutes.
              </Text>
            </Section>

            <Text className="mb-0 mt-8 text-sm leading-6 text-slate-600">
              If the button does not work, copy and paste this secure link into
              your browser:
            </Text>
            <Link
              href={actionUrl}
              className="break-all text-sm text-blue-700 no-underline"
            >
              {actionUrl}
            </Link>

            <Hr className="my-8 border-slate-200" />

            <Text className="m-0 text-xs leading-6 text-slate-500">
              If you did not create this account, you can safely ignore this
              email. Your address will not be verified unless you complete this
              step.
            </Text>

            <Text className="m-0 mt-4 text-xs leading-6 text-slate-500">
              Need help? Contact us at{' '}
              <Link
                href={`mailto:${supportEmail}`}
                className="text-slate-700 no-underline"
              >
                {supportEmail}
              </Link>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
