import pluginJs from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import { flatConfigs as importConfigs } from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import { configs as tsEslintConfigs } from 'typescript-eslint';
import airbnb from './eslint.airbnb.js';

const files = ['src/**/*.{ts,d.ts}'];

export default [
  pluginJs.configs.recommended,
  importConfigs.recommended,
  importConfigs.typescript,
  ...airbnb,
  prettierRecommended,
  // for ignore directories
  { ignores: ['node_modules', 'dist'] },
  // for root custom configs
  {
    files: ['**/*.{js,mjs,cjs,ts,d.ts,mts}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
          extensions: ['.ts'],
        },
      },
    },
    rules: {
      camelcase: 0,
      'no-underscore-dangle': 0,
      'import/extensions': ['error', 'ignorePackages', { ts: 'never' }],
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['vitest.config.ts', 'eslint.*.js'] },
      ],
    },
  },
  // for src directory ts files only for type checking
  ...tsEslintConfigs.recommendedTypeChecked.map((config) => ({ files, ...config })),
  {
    files,
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { arguments: false } },
      ],
      '@typescript-eslint/no-base-to-string': ['error', { ignoredTypeNames: ['ObjectId'] }],
    },
  },
  // for test files only
  {
    files: ['**/*.test.ts', 'src/test/*.ts'],
    plugins: { vitest },
    settings: { vitest: { typecheck: true } },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/max-nested-describe': ['error', { max: 3 }],
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
];
