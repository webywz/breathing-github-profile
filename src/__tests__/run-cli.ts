import { spawnSync } from 'child_process';
import { join } from 'path';

export const cliPath = join(__dirname, '../cli.ts');
export const tsxBin = join(__dirname, '../../node_modules/.bin/tsx');

export function splitArgs(args: string): string[] {
  return args.trim().split(/\s+/).filter(Boolean);
}

export function runCli(
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv = process.env
): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync(tsxBin, [cliPath, ...args], {
    encoding: 'utf-8',
    cwd,
    env
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status ?? 1
  };
}

export function expectExit(
  result: { stdout: string; stderr: string; exitCode: number },
  code: number
): void {
  if (result.exitCode !== code) {
    throw new Error(
      `expected exit ${code}, got ${result.exitCode}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }
}
