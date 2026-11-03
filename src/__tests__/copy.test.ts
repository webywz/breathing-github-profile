import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { run } from '../cli';
import { expectExit, runCli } from './run-cli';

/** Keep `node` for tsx's shebang, but omit clipboard tools. */
function clipboardFreeEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: dirname(process.execPath),
    FORCE_COLOR: '0'
  };
}

const VALID_CONFIG = `
username: octocat
intro:
  zh: 剪贴板测试
  en: Clipboard test
sections:
  - type: stats
    marker: STATS
`;

function writeConfig(dir: string): void {
  writeFileSync(join(dir, 'config.yml'), VALID_CONFIG, 'utf-8');
}

async function runMain(
  cwd: string,
  args: string[],
  copyToClipboard?: (text: string) => boolean
): Promise<{ calls: string[] }> {
  const calls: string[] = [];
  const prev = process.cwd();
  process.chdir(cwd);
  try {
    await run(
      args,
      copyToClipboard
        ? {
            copyToClipboard: (text: string) => {
              calls.push(text);
              return copyToClipboard(text);
            }
          }
        : {}
    );
    return { calls };
  } finally {
    process.chdir(prev);
  }
}

describe('--copy', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'breathing-copy-test-'));
    writeConfig(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('generate', () => {
    it('copies the written README markdown (injected clipboard mock)', async () => {
      const { calls } = await runMain(
        testDir,
        ['generate', '--copy', '--quiet', '-c', 'config.yml', '-o', 'README.md'],
        () => true
      );

      const written = readFileSync(join(testDir, 'README.md'), 'utf-8');
      expect(calls).toHaveLength(1);
      expect(calls[0]).toBe(written);
      expect(written).toContain('octocat');
      expect(calls[0]).not.toMatch(/^\s*\{/);
      expect(calls[0]).not.toMatch(/<html/i);
    });

    it('with --json still copies README markdown, not the JSON blob', async () => {
      const { calls } = await runMain(
        testDir,
        ['generate', '--copy', '--json', '-c', 'config.yml', '-o', 'README.md'],
        () => true
      );

      const written = readFileSync(join(testDir, 'README.md'), 'utf-8');
      expect(calls).toHaveLength(1);
      expect(calls[0]).toBe(written);
      expect(calls[0]).not.toContain('"ok"');
      expect(calls[0]).not.toContain('"bytes"');
    });

    it('with --html still copies README markdown, not HTML chrome', async () => {
      const htmlPath = join(testDir, 'preview.html');
      const { calls } = await runMain(
        testDir,
        [
          'generate',
          '--copy',
          '--quiet',
          '--html',
          htmlPath,
          '-c',
          'config.yml',
          '-o',
          'README.md'
        ],
        () => true
      );

      const written = readFileSync(join(testDir, 'README.md'), 'utf-8');
      const html = readFileSync(htmlPath, 'utf-8');
      expect(html).toMatch(/<html/i);
      expect(calls).toHaveLength(1);
      expect(calls[0]).toBe(written);
      expect(calls[0]).not.toMatch(/<html/i);
    });

    it('missing clipboard is a silent skip (mock returns false)', async () => {
      const { calls } = await runMain(
        testDir,
        ['generate', '--copy', '--quiet', '-c', 'config.yml', '-o', 'README.md'],
        () => false
      );

      expect(calls).toHaveLength(1);
      expect(existsSync(join(testDir, 'README.md'))).toBe(true);
    });

    it('clipboard throw is a silent skip', async () => {
      const { calls } = await runMain(
        testDir,
        ['generate', '--copy', '--quiet', '-c', 'config.yml', '-o', 'README.md'],
        () => {
          throw new Error('clipboard exploded');
        }
      );
      expect(calls).toHaveLength(1);
      expect(existsSync(join(testDir, 'README.md'))).toBe(true);
    });

    it('without --copy does not invoke the clipboard', async () => {
      let called = false;
      const { calls } = await runMain(
        testDir,
        ['generate', '--quiet', '-c', 'config.yml', '-o', 'README.md'],
        () => {
          called = true;
          return true;
        }
      );
      expect(called).toBe(false);
      expect(calls).toHaveLength(0);
    });
  });

  describe('refresh', () => {
    beforeEach(() => {
      writeFileSync(
        join(testDir, 'README.md'),
        `# Profile

<!--STATS:START-->
Old stats
<!--STATS:END-->
`,
        'utf-8'
      );
    });

    it('copies the updated README markdown (injected clipboard mock)', async () => {
      const { calls } = await runMain(
        testDir,
        ['refresh', '--copy', '--quiet', '-c', 'config.yml', '-r', 'README.md'],
        () => true
      );

      const written = readFileSync(join(testDir, 'README.md'), 'utf-8');
      expect(calls).toHaveLength(1);
      expect(calls[0]).toBe(written);
      expect(written).toContain('STATS:START');
      expect(written).not.toContain('Old stats');
      expect(calls[0]).not.toMatch(/^\s*\{/);
      expect(calls[0]).not.toMatch(/<html/i);
    });

    it('with --json still copies README markdown, not the JSON blob', async () => {
      const { calls } = await runMain(
        testDir,
        ['refresh', '--copy', '--json', '-c', 'config.yml', '-r', 'README.md'],
        () => true
      );

      const written = readFileSync(join(testDir, 'README.md'), 'utf-8');
      expect(calls).toHaveLength(1);
      expect(calls[0]).toBe(written);
      expect(calls[0]).not.toContain('"action"');
      expect(calls[0]).not.toContain('refreshed');
    });

    it('missing clipboard is a silent skip (mock returns false)', async () => {
      const { calls } = await runMain(
        testDir,
        ['refresh', '--copy', '--quiet', '-c', 'config.yml', '-r', 'README.md'],
        () => false
      );
      expect(calls).toHaveLength(1);
      expect(existsSync(join(testDir, 'README.md'))).toBe(true);
    });
  });

  describe('missing clipboard tools (spawn)', () => {
    it('generate --copy skips silently when no clipboard binary is on PATH', () => {
      const result = runCli(
        ['generate', '--copy', '--quiet', '-c', 'config.yml', '-o', 'README.md'],
        testDir,
        clipboardFreeEnv()
      );
      expectExit(result, 0);
      expect(existsSync(join(testDir, 'README.md'))).toBe(true);
      expect(result.stderr).not.toMatch(/clipboard/i);
      expect(result.stdout).not.toMatch(/clipboard/i);
    });

    it('refresh --copy skips silently when no clipboard binary is on PATH', () => {
      writeFileSync(
        join(testDir, 'README.md'),
        `<!--STATS:START-->\nOld\n<!--STATS:END-->\n`,
        'utf-8'
      );
      const result = runCli(
        ['refresh', '--copy', '--quiet', '-c', 'config.yml', '-r', 'README.md'],
        testDir,
        clipboardFreeEnv()
      );
      expectExit(result, 0);
      expect(result.stderr).not.toMatch(/clipboard/i);
      expect(result.stdout).not.toMatch(/clipboard/i);
    });
  });
});
