import type { UserConfig } from '@commitlint/types';

// types of commit
// 'build', 'ci', 'docs', 'feat', 'fix', 'perf',
// 'refactor', 'revert', 'style', 'test' 'chore'

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
  },
};

export default Configuration;
