import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in to your workspace',
  robots: { index: false, follow: false },
};

export { default } from '../../(auth)/login/page';
