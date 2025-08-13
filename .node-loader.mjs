import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ext = '.ts';
const pathAlias = '@/';

const cwd = process.cwd();

// eslint-disable-next-line import-x/prefer-default-export
export async function resolve(specifier, context, defaultResolve) {
  const isAlias = specifier.startsWith(pathAlias);
  const isRelative = specifier.startsWith('.');

  if (
    !(isAlias || isRelative) ||
    specifier.endsWith(ext) ||
    context.parentURL?.includes('/node_modules/')
  ) {
    return defaultResolve(specifier, context, defaultResolve);
  }

  if (specifier.endsWith('package.json')) {
    return defaultResolve(path.join(cwd, 'package.json'), context, defaultResolve);
  }

  if (isAlias) {
    const filePath = path.join(cwd, 'src', specifier.replace(pathAlias, '/') + ext);
    if (fs.existsSync(filePath)) {
      return defaultResolve(filePath, context, defaultResolve);
    }
    return defaultResolve(`${filePath.replace(ext, '')}/index${ext}`, context, defaultResolve);
  }

  const parentURL = context.parentURL ?? pathToFileURL(`${cwd}/src/`).toString();
  const filePath = fileURLToPath(new URL(specifier + ext, parentURL));
  if (fs.existsSync(filePath)) {
    return defaultResolve(specifier + ext, context, defaultResolve);
  }
  return defaultResolve(`${specifier}/index${ext}`, context, defaultResolve);
}
