import { readFileSync } from 'fs';
import { join } from 'path';

/** Read version from package.json (works from src/ via tsx/jest and from dist/ after build). */
export function readPackageVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string };
    if (typeof pkg.version === 'string' && pkg.version.length > 0) {
      return pkg.version;
    }
  } catch {
    // fall through
  }
  return '0.0.0';
}
