#!/usr/bin/env node

import { Command, InvalidArgumentError, Option } from 'commander';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadConfig } from './config';
import { GitHubClient } from './github';
import { ReadmeGenerator, updateReadmeMarkers } from './generator';
import { readPackageVersion } from './version';
import {
  BilingualError,
  Locale,
  cliText,
  errorText,
  initNextStepLines,
  parseLocale
} from './locale';

function shouldDisableColor(options: { color?: boolean }): boolean {
  // Commander maps --no-color to { color: false } on the command (and program).
  return options.color === false || !!process.env.NO_COLOR;
}

function isColorDisabled(commandOptions: { color?: boolean }): boolean {
  return shouldDisableColor({
    color: commandOptions.color === false || program.opts().color === false
      ? false
      : commandOptions.color
  });
}

function applyNoColor(): void {
  // FORCE_COLOR wins over NO_COLOR in chalk/supports-color; drop it so --no-color wins.
  delete process.env.FORCE_COLOR;
  process.env.NO_COLOR = '1';
  chalk.level = 0;
}

function createSpinner(
  text: string,
  options: { json?: boolean; quiet?: boolean; colorDisabled?: boolean }
): { spinner: Ora | null; spinnerEnabled: boolean } {
  if (options.json || options.quiet) {
    return { spinner: null, spinnerEnabled: false };
  }

  // Non-TTY / CI pipes: skip ora so succeed/fail use console.log/error (stdout
  // for success). Ora + FORCE_COLOR would otherwise write the summary to stderr.
  const spinnerEnabled = !options.colorDisabled && Boolean(process.stderr.isTTY);
  const spinner = spinnerEnabled
    ? ora({ text })
    : ora({ text, isEnabled: false });
  return { spinner, spinnerEnabled };
}

function spinnerSucceed(
  spinner: Ora | null,
  spinnerEnabled: boolean,
  message: string
): void {
  // ora.succeed() prefixes log-symbols (chalk-colored ✔) even when constructed with isEnabled: false.
  if (!spinner || !spinnerEnabled) {
    console.log(message);
    return;
  }
  spinner.succeed(chalk.green(message));
}

function spinnerFail(
  spinner: Ora | null,
  spinnerEnabled: boolean,
  message: string
): void {
  if (!spinner || !spinnerEnabled) {
    console.error(message);
    return;
  }
  spinner.fail(chalk.red(message));
}

const program = new Command();

function isQuiet(options: { quiet?: boolean }): boolean {
  return Boolean(options.quiet || program.opts().quiet);
}

function shouldPrintHuman(options: { json?: boolean; quiet?: boolean }): boolean {
  return !options.json && !isQuiet(options);
}

function localeOption(): Option {
  return new Option(
    '--locale <en|zh>',
    'CLI language en|zh; omit for bilingual · CLI 语言 en|zh；省略则中英双语'
  ).argParser((value: string) => {
    try {
      return parseLocale(value);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new InvalidArgumentError(message);
    }
  });
}

function getLocale(options: { locale?: Locale }): Locale | undefined {
  return options.locale ?? program.opts().locale;
}

function configNotFoundError(path: string): BilingualError {
  return new BilingualError(
    `Config not found / 配置文件不存在: ${path}`,
    `Config not found: ${path}`,
    `配置文件不存在: ${path}`
  );
}

program
  .name('breathing-profile')
  .description('Living GitHub profile README generator · 会呼吸的 GitHub profile README 生成器')
  .version(readPackageVersion())
  .option('-q, --quiet', 'Suppress spinner and success summary · 静默 spinner 与成功摘要')
  .option('--no-color', 'Disable colored output · 禁用彩色输出')
  .addOption(localeOption());

program
  .command('generate')
  .description('Generate a full README · 生成完整 README.md')
  .option('-c, --config <path>', 'Config path · 配置文件路径', 'config.yml')
  .option('-o, --output <path>', 'Output path · 输出文件路径', 'README.md')
  .option('-j, --json', 'Output JSON only · 仅输出 JSON')
  .option('-q, --quiet', 'Suppress spinner and success summary · 静默 spinner 与成功摘要')
  .option('--no-color', 'Disable colored output · 禁用彩色输出')
  .addOption(localeOption())
  .action(async (options) => {
    const locale = getLocale(options);
    const colorDisabled = isColorDisabled(options);
    if (colorDisabled) {
      applyNoColor();
    }
    const { spinner, spinnerEnabled } = createSpinner(
      cliText(locale, {
        both: 'Generating README… · 正在生成 README...',
        en: 'Generating README…',
        zh: '正在生成 README...'
      }),
      {
        json: options.json,
        quiet: isQuiet(options),
        colorDisabled
      }
    );
    if (spinnerEnabled && spinner) {
      spinner.start();
    }

    try {
      if (!existsSync(options.config)) {
        throw configNotFoundError(options.config);
      }

      const config = loadConfig(options.config);
      const client = new GitHubClient();

      if (spinner) {
        spinner.text = cliText(locale, {
          both: `Fetching GitHub data for ${config.username}… · 正在获取数据...`,
          en: `Fetching GitHub data for ${config.username}…`,
          zh: '正在获取数据...'
        });
      }
      const data = await client.getProfileData(config.username);

      if (spinner) {
        spinner.text = cliText(locale, {
          both: 'Writing README… · 正在生成 README 内容...',
          en: 'Writing README…',
          zh: '正在生成 README 内容...'
        });
      }
      const generator = new ReadmeGenerator(config, data);
      const readme = generator.generate();

      writeFileSync(options.output, readme, 'utf-8');

      const dataDir = 'data';
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      const dataPath = join(dataDir, 'profile.json');
      writeFileSync(
        dataPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      if (options.json) {
        const bytes = Buffer.byteLength(readme, 'utf-8');
        const sections = config.sections?.length || 0;
        console.log(JSON.stringify({
          ok: true,
          output: options.output,
          config: options.config,
          username: config.username,
          bytes,
          sections
        }, null, 2));
      } else if (shouldPrintHuman(options)) {
        spinnerSucceed(
          spinner,
          spinnerEnabled,
          cliText(locale, {
            both: `✓ README written / 已生成: ${options.output}`,
            en: `✓ README written: ${options.output}`,
            zh: `✓ 已生成: ${options.output}`
          })
        );
        console.log(chalk.gray(cliText(locale, {
          both: `  Data saved / 数据已保存: ${dataPath}`,
          en: `  Data saved: ${dataPath}`,
          zh: `  数据已保存: ${dataPath}`
        })));
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({
          ok: false,
          error: (error as Error).message
        }, null, 2));
      } else {
        spinnerFail(
          spinner,
          spinnerEnabled,
          cliText(locale, {
            both: 'Generate failed / 生成失败',
            en: 'Generate failed',
            zh: '生成失败'
          })
        );
        console.error(chalk.red(cliText(locale, {
          both: `Error / 错误: ${errorText(error)}`,
          en: `Error: ${errorText(error, 'en')}`,
          zh: `错误: ${errorText(error, 'zh')}`
        })));
      }
      process.exit(1);
    }
  });

program
  .command('refresh')
  .description('Refresh marker sections only · 只刷新 README 标记部分')
  .option('-c, --config <path>', 'Config path · 配置文件路径', 'config.yml')
  .option('-r, --readme <path>', 'README path · README 文件路径', 'README.md')
  .option('-j, --json', 'Output JSON only · 仅输出 JSON')
  .option('-q, --quiet', 'Suppress spinner and success summary · 静默 spinner 与成功摘要')
  .option('--no-color', 'Disable colored output · 禁用彩色输出')
  .addOption(localeOption())
  .action(async (options) => {
    const locale = getLocale(options);
    const colorDisabled = isColorDisabled(options);
    if (colorDisabled) {
      applyNoColor();
    }
    const { spinner, spinnerEnabled } = createSpinner(
      cliText(locale, {
        both: 'Refreshing README… · 正在刷新 README...',
        en: 'Refreshing README…',
        zh: '正在刷新 README...'
      }),
      {
        json: options.json,
        quiet: isQuiet(options),
        colorDisabled
      }
    );
    if (spinnerEnabled && spinner) {
      spinner.start();
    }

    try {
      if (!existsSync(options.config)) {
        throw configNotFoundError(options.config);
      }

      if (!existsSync(options.readme)) {
        throw new BilingualError(
          `README not found / README 文件不存在: ${options.readme}`,
          `README not found: ${options.readme}`,
          `README 文件不存在: ${options.readme}`
        );
      }

      const config = loadConfig(options.config);
      const client = new GitHubClient();

      if (spinner) {
        spinner.text = cliText(locale, {
          both: `Fetching GitHub data for ${config.username}… · 正在获取数据...`,
          en: `Fetching GitHub data for ${config.username}…`,
          zh: '正在获取数据...'
        });
      }
      const data = await client.getProfileData(config.username);

      if (spinner) {
        spinner.text = cliText(locale, {
          both: 'Updating markers… · 正在更新 README 标记部分...',
          en: 'Updating markers…',
          zh: '正在更新 README 标记部分...'
        });
      }
      const existingReadme = readFileSync(options.readme, 'utf-8');
      
      const markerSections = (config.sections || []).map(section => {
        const marker = section.marker || section.type.toUpperCase();
        let content = '';

        const tempGenerator = new ReadmeGenerator(config, data);
        const fullReadme = tempGenerator.generate();
        
        const startMarker = `<!--${marker}:START-->`;
        const endMarker = `<!--${marker}:END-->`;
        const regex = new RegExp(
          `${escapeRegex(startMarker)}([\\s\\S]*?)${escapeRegex(endMarker)}`
        );
        const match = fullReadme.match(regex);
        
        if (match) {
          content = match[1].trim();
        }

        return { marker, content };
      });

      const updatedReadme = updateReadmeMarkers(existingReadme, markerSections);
      writeFileSync(options.readme, updatedReadme, 'utf-8');

      const dataDir = 'data';
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      writeFileSync(
        join(dataDir, 'profile.json'),
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      if (options.json) {
        console.log(JSON.stringify({
          ok: true,
          action: 'refreshed',
          path: options.readme
        }, null, 2));
      } else if (shouldPrintHuman(options)) {
        spinnerSucceed(
          spinner,
          spinnerEnabled,
          cliText(locale, {
            both: `✓ README refreshed / 已刷新: ${options.readme}`,
            en: `✓ README refreshed: ${options.readme}`,
            zh: `✓ 已刷新: ${options.readme}`
          })
        );
        console.log(chalk.gray(cliText(locale, {
          both: `  Data saved / 数据已保存: ${join(dataDir, 'profile.json')}`,
          en: `  Data saved: ${join(dataDir, 'profile.json')}`,
          zh: `  数据已保存: ${join(dataDir, 'profile.json')}`
        })));
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({
          ok: false,
          error: (error as Error).message
        }, null, 2));
      } else {
        spinnerFail(
          spinner,
          spinnerEnabled,
          cliText(locale, {
            both: 'Refresh failed / 刷新失败',
            en: 'Refresh failed',
            zh: '刷新失败'
          })
        );
        console.error(chalk.red(cliText(locale, {
          both: `Error / 错误: ${errorText(error)}`,
          en: `Error: ${errorText(error, 'en')}`,
          zh: `错误: ${errorText(error, 'zh')}`
        })));
      }
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Create a starter config.yml · 创建初始配置文件')
  .option('-o, --output <path>', 'Output path · 输出路径', 'config.yml')
  .option('-f, --force', 'Overwrite if exists · 强制覆盖已存在的文件')
  .option('-j, --json', 'Output JSON only · 仅输出 JSON')
  .option('-q, --quiet', 'Suppress spinner and success summary · 静默 spinner 与成功摘要')
  .option('--no-color', 'Disable colored output · 禁用彩色输出')
  .addOption(localeOption())
  .action(async (options) => {
    const locale = getLocale(options);
    if (isColorDisabled(options)) {
      applyNoColor();
    }
    try {
      const outputPath = options.output;
      let action: 'created' | 'updated' | 'skipped' = 'created';

      if (existsSync(outputPath)) {
        if (!options.force) {
          if (options.json) {
            console.log(JSON.stringify({
              ok: false,
              error: `Config already exists: ${outputPath}. Use --force to overwrite.`
            }, null, 2));
          } else {
            console.error(
              chalk.red(
                cliText(locale, {
                  both:
                    `✗ Config already exists / 配置文件已存在: ${outputPath}\n` +
                    `  Use --force to overwrite / 使用 --force 覆盖`,
                  en:
                    `✗ Config already exists: ${outputPath}\n` +
                    `  Use --force to overwrite`,
                  zh:
                    `✗ 配置文件已存在: ${outputPath}\n` +
                    `  使用 --force 覆盖`
                })
              )
            );
          }
          process.exit(1);
        }
        action = 'updated';
      }

      const templatePath = join(__dirname, '..', 'examples', 'demo-config.yml');
      
      if (!existsSync(templatePath)) {
        throw new BilingualError(
          `Template not found / 模板文件不存在: ${templatePath}`,
          `Template not found: ${templatePath}`,
          `模板文件不存在: ${templatePath}`
        );
      }

      const templateContent = readFileSync(templatePath, 'utf-8');
      writeFileSync(outputPath, templateContent, 'utf-8');

      if (options.json) {
        console.log(JSON.stringify({
          ok: true,
          action,
          path: outputPath
        }, null, 2));
      } else if (shouldPrintHuman(options)) {
        console.log(chalk.green(cliText(locale, {
          both: `✓ Config created / 配置文件已创建: ${outputPath}`,
          en: `✓ Config created: ${outputPath}`,
          zh: `✓ 配置文件已创建: ${outputPath}`
        })));
        for (const line of initNextStepLines(locale, outputPath)) {
          console.log(chalk.gray(line));
        }
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({
          ok: false,
          error: (error as Error).message
        }, null, 2));
      } else {
        console.error(chalk.red(cliText(locale, {
          both: `✗ Init failed / 初始化失败: ${errorText(error)}`,
          en: `✗ Init failed: ${errorText(error, 'en')}`,
          zh: `✗ 初始化失败: ${errorText(error, 'zh')}`
        })));
      }
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate config file · 验证配置文件')
  .option('-c, --config <path>', 'Config path · 配置文件路径', 'config.yml')
  .option('-j, --json', 'Output JSON only · 仅输出 JSON')
  .option('-q, --quiet', 'Suppress spinner and success summary · 静默 spinner 与成功摘要')
  .option('--no-color', 'Disable colored output · 禁用彩色输出')
  .addOption(localeOption())
  .action(async (options) => {
    const locale = getLocale(options);
    if (isColorDisabled(options)) {
      applyNoColor();
    }
    try {
      if (!existsSync(options.config)) {
        throw configNotFoundError(options.config);
      }

      const config = loadConfig(options.config);
      
      if (options.json) {
        console.log(JSON.stringify({ ok: true, config }, null, 2));
      } else if (shouldPrintHuman(options)) {
        console.log(chalk.green(cliText(locale, {
          both: '✓ Config valid / 配置文件有效',
          en: '✓ Config valid',
          zh: '✓ 配置文件有效'
        })));
        console.log(chalk.gray(cliText(locale, {
          both: '\nConfig / 配置内容:',
          en: '\nConfig:',
          zh: '\n配置内容:'
        })));
        console.log(JSON.stringify(config, null, 2));
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ ok: false, error: (error as Error).message }, null, 2));
      } else {
        console.error(chalk.red(cliText(locale, {
          both: `✗ Invalid config / 配置无效: ${errorText(error)}`,
          en: `✗ Invalid config: ${errorText(error, 'en')}`,
          zh: `✗ 配置无效: ${errorText(error, 'zh')}`
        })));
      }
      process.exit(1);
    }
  });

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

program.parse();
