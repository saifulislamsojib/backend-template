/* eslint-disable security/detect-non-literal-fs-filename */
// @ts-check

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ext = '.ts';
const pathAlias = '@/';
const cwd = process.cwd();
const packagePath = path.join(cwd, 'package.json');

/**
 * @type {import('node:module').ResolveHook}
 */

export const resolve = async (specifier, context, nextResolve) => {
  const isAlias = specifier.startsWith(pathAlias);
  const isRelative = specifier.startsWith('.');

  if (
    !(isAlias || isRelative) ||
    context.parentURL?.includes('/node_modules/') ||
    specifier.endsWith(ext)
  ) {
    return nextResolve(specifier, context);
  }

  if (specifier.endsWith('package.json')) {
    return nextResolve(packagePath, context);
  }

  if (isAlias) {
    const filePath = path.join(cwd, 'src', specifier.replace(pathAlias, '/'));
    const pathWithExt = filePath + ext;
    if (fs.existsSync(pathWithExt)) return nextResolve(pathWithExt, context);
    return nextResolve(`${filePath}/index${ext}`, context);
  }
  const filePath = fileURLToPath(new URL(specifier + ext, context.parentURL));
  if (fs.existsSync(filePath)) return nextResolve(specifier + ext, context);
  return nextResolve(`${specifier}/index${ext}`, context);
};
