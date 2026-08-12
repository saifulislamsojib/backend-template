import getFlatConfigs, { testFiles } from "@stack-lint/base";
import getNodeConfig from "@stack-lint/node";
import getTsConfigs from "@stack-lint/typescript";
import vitest from "@vitest/eslint-plugin";

export default getFlatConfigs(
  getNodeConfig({ extension: true }),
  ...getTsConfigs({ tsRootDir: "src/" }),
  {
    files: testFiles,
    ...vitest.configs.recommended,
  },
);
