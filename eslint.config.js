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
  {
    ignores: [
      "src/**/*.test.ts",
      "src/test/**",
      "src/modules/**/*.repository.ts",
      "src/modules/**/*.model.ts",
      "src/errors/mongooseErrors.ts",
      "src/configs/db.ts",
      "src/server.ts",
      "src/utils/server.ts",
      "src/utils/catchAsync.ts",
      "src/index.d.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex:
                "(^|/)(mongoose|mongodb)(/|$)|\\.model(?:\\.[cm]?[jt]s)?$|(^|/)db(?:\\.[cm]?[jt]s)?$|(^|/)mongooseErrors(?:\\.[cm]?[jt]s)?$",
              message:
                "Use a module repository and neutral contracts; database infrastructure is private to persistence.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/index.d.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "mongoose", allowTypeImports: true }],
          patterns: [
            {
              regex:
                "(^|/)mongodb(/|$)|(^|/)mongoose/|\\.model(?:\\.[cm]?[jt]s)?$|(^|/)db(?:\\.[cm]?[jt]s)?$|(^|/)mongooseErrors(?:\\.[cm]?[jt]s)?$",
              message: "Only the Mongoose ObjectId type belongs in global contracts.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/utils/catchAsync.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex:
                "(^|/)(mongoose|mongodb)(/|$)|\\.model(?:\\.[cm]?[jt]s)?$|(^|/)db(?:\\.[cm]?[jt]s)?$",
              message:
                "The HTTP catch boundary may import the error translator, not database infrastructure.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server.ts", "src/utils/server.ts", "src/configs/db.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "\\.model(?:\\.[cm]?[jt]s)?$|(^|/)mongooseErrors(?:\\.[cm]?[jt]s)?$",
              message: "Lifecycle infrastructure must not access application models.",
            },
          ],
        },
      ],
    },
  },
);
