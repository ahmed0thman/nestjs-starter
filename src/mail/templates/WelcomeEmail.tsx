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

interface WelcomeEmailProps {
  name: string;
  appName?: string;
  loginUrl?: string;
  supportEmail?: string;
}

export const WelcomeEmail = ({
  name,
  appName = 'Your App',
  loginUrl = 'https://example.com/login',
  supportEmail = 'support@example.com',
}: WelcomeEmailProps) => {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to {appName}. Your account is ready.</Preview>
      <Tailwind>
        <Body className="m-0 bg-slate-100 py-8 font-sans">
          <Container className="mx-auto w-full max-w-xl rounded-lg bg-white px-6 py-8">
            <Section>
              <Text className="m-0 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Welcome
              </Text>

              <Heading className="m-0 mt-5 text-2xl font-semibold text-slate-900">
                Hi {name}, great to have you.
              </Heading>

              <Text className="mb-0 mt-4 text-base leading-7 text-slate-700">
                Your {appName} account is now active. You can sign in to finish
                setup and start using your workspace.
              </Text>
            </Section>

            <Section className="my-8 text-center">
              <Button
                href={loginUrl}
                className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white no-underline"
              >
                Open {appName}
              </Button>
            </Section>

            <Text className="m-0 text-sm leading-6 text-slate-600">
              If the button does not work, copy and paste this link into your
              browser:
            </Text>
            <Link
              href={loginUrl}
              className="break-all text-sm text-blue-700 no-underline"
            >
              {loginUrl}
            </Link>

            <Hr className="my-8 border-slate-200" />

            <Text className="m-0 text-xs leading-6 text-slate-500">
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
