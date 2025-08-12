import getFlatConfigs, { testFiles } from '@stack-lint/base';
import getNodeConfig from '@stack-lint/node';
import getTsConfigs from '@stack-lint/typescript';
import vitest from '@vitest/eslint-plugin';

export default getFlatConfigs(
  getNodeConfig(true),
  ...getTsConfigs({
    tsconfigRootDir: import.meta.dirname,
    tsRootDir: 'src/',
    rules: {
      '@typescript-eslint/no-base-to-string': ['error', { ignoredTypeNames: ['ObjectId'] }],
    },
  }),
  // for test files only
  {
    files: testFiles,
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/max-nested-describe': ['error', { max: 3 }],
    },
  },
);
