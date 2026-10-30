import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { expectExit, runCli, splitArgs } from './run-cli';

const testOutputPath = join(__dirname, '../../test-config.yml');
const repoRoot = join(__dirname, '../..');

function runInit(args: string = ''): { stdout: string; stderr: string; exitCode: number } {
  return runCli(['init', ...splitArgs(args)], repoRoot);
}

describe('Init Command', () => {
  beforeEach(() => {
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath);
    }
  });

  afterEach(() => {
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath);
    }
  });

  it('应该创建配置文件', () => {
    const result = runInit(`-o ${testOutputPath}`);
    
    expect(result.exitCode).toBe(0);
    expect(existsSync(testOutputPath)).toBe(true);
    
    const content = readFileSync(testOutputPath, 'utf-8');
    expect(content).toContain('username:');
    expect(content).toContain('intro:');
    expect(content).toContain('sections:');
  });

  it('创建的配置应该能通过 validate', () => {
    runInit(`-o ${testOutputPath}`);
    
    const content = readFileSync(testOutputPath, 'utf-8');
    expect(content).toContain('username: octocat');
    
    const validateResult = runCli(['validate', '-c', testOutputPath], repoRoot);
    expectExit(validateResult, 0);
    expect(validateResult.stdout).toContain('Config valid');
  });

  it('文件已存在时应该拒绝覆盖', () => {
    writeFileSync(testOutputPath, 'existing content', 'utf-8');
    
    const result = runInit(`-o ${testOutputPath}`);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/already exists|已存在/);
    
    const content = readFileSync(testOutputPath, 'utf-8');
    expect(content).toBe('existing content');
  });

  it('使用 --force 应该覆盖已存在的文件', () => {
    writeFileSync(testOutputPath, 'old content', 'utf-8');
    
    const result = runInit(`-o ${testOutputPath} --force`);
    
    expect(result.exitCode).toBe(0);
    
    const content = readFileSync(testOutputPath, 'utf-8');
    expect(content).not.toBe('old content');
    expect(content).toContain('username:');
  });

  it('默认输出路径应该是 config.yml', () => {
    const defaultPath = join(__dirname, '../../config.yml');
    const backupPath = `${defaultPath}.backup`;
    
    let hasBackup = false;
    if (existsSync(defaultPath)) {
      execSync(`mv ${defaultPath} ${backupPath}`);
      hasBackup = true;
    }

    try {
      const result = runInit();
      expect(result.exitCode).toBe(0);
      expect(existsSync(defaultPath)).toBe(true);
      
      unlinkSync(defaultPath);
    } finally {
      if (hasBackup) {
        execSync(`mv ${backupPath} ${defaultPath}`);
      }
    }
  });

  describe('JSON 模式（--json）', () => {
    it('成功创建时应该输出 JSON，ok: true，action: created', () => {
      const result = runInit(`--json -o ${testOutputPath}`);
      
      expect(result.exitCode).toBe(0);
      expect(existsSync(testOutputPath)).toBe(true);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.action).toBe('created');
      expect(parsed.path).toBe(testOutputPath);
      
      const content = readFileSync(testOutputPath, 'utf-8');
      expect(content).toContain('username:');
    });

    it('文件已存在时应该输出 JSON，ok: false', () => {
      writeFileSync(testOutputPath, 'existing', 'utf-8');
      
      const result = runInit(`--json -o ${testOutputPath}`);
      
      expect(result.exitCode).toBe(1);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.error).toBeDefined();
      expect(parsed.error).toMatch(/already exists/);
    });

    it('使用 --force 覆盖时应该输出 action: updated', () => {
      writeFileSync(testOutputPath, 'old', 'utf-8');
      
      const result = runInit(`--json -o ${testOutputPath} --force`);
      
      expect(result.exitCode).toBe(0);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.action).toBe('updated');
      expect(parsed.path).toBe(testOutputPath);
      
      const content = readFileSync(testOutputPath, 'utf-8');
      expect(content).not.toBe('old');
      expect(content).toContain('username:');
    });

    it('JSON 模式下不应该输出 chalk 文本', () => {
      const result = runInit(`-j -o ${testOutputPath}`);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('✓');
      expect(result.stdout).not.toContain('Config created');
      expect(result.stdout).not.toContain('配置文件已创建');
      expect(result.stdout).not.toContain('Next steps');
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
    });

    it('JSON 输出应该是合法的、可解析的', () => {
      const result = runInit(`--json -o ${testOutputPath}`);
      
      expect(result.exitCode).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toHaveProperty('ok');
      expect(parsed).toHaveProperty('action');
      expect(parsed).toHaveProperty('path');
    });
  });
});
