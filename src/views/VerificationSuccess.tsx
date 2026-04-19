import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import { env } from 'src/common/config/env/env';

const appName = env.APP_NAME;
const loginUrl = `${env.APP_URL}/api/${env.API_VERSION}/auth/sign-in`;

export const VerificationSuccess = () => {
  return (
    <Html lang="en">
      <Head />
      <Preview>Congrats. Your {appName} account is verified.</Preview>
      <Tailwind>
        <Body className="m-0 min-h-screen bg-slate-100 font-sans">
          <Container className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-8">
            <Section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <Text className="m-0 inline-block rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">
                Congrats
              </Text>

              <Heading className="m-0 mt-5 text-3xl font-semibold tracking-tight text-slate-900">
                Verification complete
              </Heading>

              <Text className="m-0 mt-4 text-base leading-7 text-slate-600">
                Your {appName} account is verified.
              </Text>

              <Section className="mt-8">
                <Button
                  href={loginUrl}
                  className="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white no-underline"
                >
                  Sign in
                </Button>
              </Section>

              <Text className="m-0 mt-5 text-xs leading-6 text-slate-500">
                If the button does not work, use this link:{' '}
                <Link
                  href={loginUrl}
                  className="break-all text-cyan-700 no-underline"
                >
                  {loginUrl}
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
