import bestPractices from 'eslint-config-airbnb-base/rules/best-practices';
import errors from 'eslint-config-airbnb-base/rules/errors';
import es6 from 'eslint-config-airbnb-base/rules/es6';
import imports from 'eslint-config-airbnb-base/rules/imports';
import node from 'eslint-config-airbnb-base/rules/node';
import strict from 'eslint-config-airbnb-base/rules/strict';
import style from 'eslint-config-airbnb-base/rules/style';
import variables from 'eslint-config-airbnb-base/rules/variables';

const airbnb = [bestPractices, errors, es6, imports, node, strict, style, variables].map((item) => {
  const newRole = { ...item };

  delete newRole.env;
  delete newRole.parserOptions;
  delete newRole.plugins;
  return newRole;
});

export default airbnb;
