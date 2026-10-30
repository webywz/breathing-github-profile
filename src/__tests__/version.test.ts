import { readFileSync } from 'fs';
import { join } from 'path';
import { readPackageVersion } from '../version';

describe('readPackageVersion', () => {
  it('matches package.json version', () => {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8')
    ) as { version: string };
    expect(readPackageVersion()).toBe(pkg.version);
    expect(readPackageVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
