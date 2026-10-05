import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create your account',
  robots: { index: false, follow: false },
};

export { default } from '../../(auth)/register/page';
