import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const testOutputPath = join(__dirname, '../../test-config.yml');
const cliPath = join(__dirname, '../cli.ts');

function runInit(args: string = ''): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(
      `npx tsx ${cliPath} init ${args}`,
      { 
        encoding: 'utf-8',
        cwd: join(__dirname, '../..'),
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1
    };
  }
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
    
    const validateResult = execSync(
      `npx tsx ${cliPath} validate -c ${testOutputPath}`,
      { 
        encoding: 'utf-8',
        cwd: join(__dirname, '../..')
      }
    );
    
    expect(validateResult).toContain('Config valid');
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
});
