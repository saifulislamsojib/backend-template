const path = require('path');

module.exports = {
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  env: { node: true, jest: true },
  settings: {
    'import/resolver': {
      node: {
        paths: ['./src'],
        extensions: ['.ts', '.json'],
      },
      alias: {
        map: [
          ['src', path.resolve(__dirname, './src')],
          ['@', path.resolve(__dirname, './src')],
        ],
        extensions: ['.ts', '.json'],
      },
    },
  },
  extends: [
    'airbnb-base',
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['node_modules', 'dist', '.eslintrc.cjs'],
  plugins: ['prettier', '@typescript-eslint', 'import', 'jest'],
  root: true,
  rules: {
    camelcase: 0,
    'object-curly-newline': 0,
    'no-underscore-dangle': 0,
    'no-console': 0,
    'linebreak-style': 0,
    'jest/expect-expect': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    'import/extensions': ['error', 'ignorePackages', { ts: 'never' }],
    'import/no-extraneous-dependencies': [
      'error',
      { devDependencies: ['**/test.*.ts', '**/*.test.ts'] },
    ],
  },
};
