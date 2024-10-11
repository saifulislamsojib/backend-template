import pluginJs from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import vitest from 'eslint-plugin-vitest';
import globals from 'globals';
import { configs as tsEslintConfigs } from 'typescript-eslint';
import airbnb from './eslint.airbnb.mjs';

export default [
  ...airbnb,
  pluginJs.configs.recommended,
  pluginImport.flatConfigs.recommended,
  pluginImport.flatConfigs.typescript,
  pluginPrettierRecommended,
  ...tsEslintConfigs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    ignores: ['**/node_modules', '**/dist'],
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
  {
    files: ['**/*.test.ts', 'src/test/*.ts'],
    plugins: { vitest },
    languageOptions: { globals: vitest.environments.env.globals },
    settings: { vitest: { typecheck: true } },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/max-nested-describe': ['error', { max: 3 }],
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
];
