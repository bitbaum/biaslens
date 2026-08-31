import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...coreWebVitals,
  ...typescript,
  {
    // eslint-plugin-react's "detect" breaks under ESLint 10 (getFilename removed);
    // pin the React version explicitly.
    settings: { react: { version: '19' } },
  },
];

export default config;
