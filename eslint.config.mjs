import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      '.roomio-data/**',
      'test-results/**',
      'tsconfig.tsbuildinfo',
      // Next.js auto-generates and overwrites this file; it must not be hand-edited.
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // .cjs utility scripts intentionally use CommonJS `require()` (they run
    // standalone via plain `node` before/without `npm install`), so the
    // ESM-oriented no-require-imports rule does not apply to them.
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Codebase convention: a leading underscore marks an intentionally
    // unused binding (e.g. destructuring-to-omit a property, or a
    // required-but-unused callback arg).
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
    },
  },
];

export default eslintConfig;
