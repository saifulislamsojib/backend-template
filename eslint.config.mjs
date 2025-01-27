import pluginJs from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import { flatConfigs as importConfigs } from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import { configs as tsEslintConfigs } from 'typescript-eslint';
import airbnb from './eslint.airbnb.mjs';

const files = ['src/**/*.{ts,d.ts}'];

export default [
  pluginJs.configs.recommended,
  importConfigs.recommended,
  importConfigs.typescript,
  ...tsEslintConfigs.recommended,
  ...airbnb,
  prettierRecommended,
  // for ignore directories
  { ignores: ['node_modules', 'dist'] },
  // for root custom configs
  {
    files: ['**/*.{js,mjs,cjs,ts,d.ts}'],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
          extensions: ['.ts', '.d.ts', '.json'],
        },
      },
    },
    rules: {
      camelcase: 0,
      'no-underscore-dangle': 0,
      'import/extensions': ['error', 'ignorePackages', { ts: 'never' }],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['vitest.config.*ts', 'eslint.*.mjs'],
        },
      ],
    },
  },
  // for src directory ts files only for type checking
  ...tsEslintConfigs.recommendedTypeChecked.map((config) => ({
    files,
    ...config,
  })),
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
        {
          checksVoidReturn: {
            arguments: false,
          },
        },
      ],
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
