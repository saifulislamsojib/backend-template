import getFlatConfigs, { testFiles } from '@stack-lint/base';
import getNodeConfig from '@stack-lint/node';
import getTsConfigs from '@stack-lint/typescript';
import vitest from '@vitest/eslint-plugin';

export default getFlatConfigs(
  getNodeConfig({ extension: true }),
  ...getTsConfigs({
    tsconfigRootDir: import.meta.dirname,
    tsRootDir: 'src/',
    rules: {
      '@typescript-eslint/no-base-to-string': ['error', { ignoredTypeNames: ['ObjectId'] }],
    },
  }),
  {
    rules: {
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: testFiles,
    ...vitest.configs.recommended,
  },
);
