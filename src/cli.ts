#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadConfig } from './config';
import { GitHubClient } from './github';
import { ReadmeGenerator, updateReadmeMarkers } from './generator';
import { ProfileData } from './types';

const program = new Command();

program
  .name('breathing-profile')
  .description('可复用的活跃 GitHub profile README 生成器')
  .version('1.0.0');

program
  .command('generate')
  .description('生成新的 README.md')
  .option('-c, --config <path>', '配置文件路径', 'config.yml')
  .option('-o, --output <path>', '输出文件路径', 'README.md')
  .action(async (options) => {
    const spinner = ora('正在生成 README...').start();

    try {
      if (!existsSync(options.config)) {
        throw new Error(`配置文件不存在: ${options.config}`);
      }

      const config = loadConfig(options.config);
      const client = new GitHubClient();

      spinner.text = `正在获取 ${config.username} 的 GitHub 数据...`;
      const data = await client.getProfileData(config.username);

      spinner.text = '正在生成 README 内容...';
      const generator = new ReadmeGenerator(config, data);
      const readme = generator.generate();

      writeFileSync(options.output, readme, 'utf-8');

      const dataDir = 'data';
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      writeFileSync(
        join(dataDir, 'profile.json'),
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      spinner.succeed(chalk.green(`✓ README 已生成: ${options.output}`));
      console.log(chalk.gray(`  数据已保存到: ${join(dataDir, 'profile.json')}`));
    } catch (error) {
      spinner.fail(chalk.red('生成失败'));
      console.error(chalk.red(`错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('refresh')
  .description('刷新现有 README 的标记部分')
  .option('-c, --config <path>', '配置文件路径', 'config.yml')
  .option('-r, --readme <path>', 'README 文件路径', 'README.md')
  .action(async (options) => {
    const spinner = ora('正在刷新 README...').start();

    try {
      if (!existsSync(options.config)) {
        throw new Error(`配置文件不存在: ${options.config}`);
      }

      if (!existsSync(options.readme)) {
        throw new Error(`README 文件不存在: ${options.readme}`);
      }

      const config = loadConfig(options.config);
      const client = new GitHubClient();

      spinner.text = `正在获取 ${config.username} 的 GitHub 数据...`;
      const data = await client.getProfileData(config.username);

      spinner.text = '正在更新 README 标记部分...';
      const existingReadme = readFileSync(options.readme, 'utf-8');
      const generator = new ReadmeGenerator(config, data);
      
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

      spinner.succeed(chalk.green(`✓ README 已刷新: ${options.readme}`));
      console.log(chalk.gray(`  数据已保存到: ${join(dataDir, 'profile.json')}`));
    } catch (error) {
      spinner.fail(chalk.red('刷新失败'));
      console.error(chalk.red(`错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('验证配置文件')
  .option('-c, --config <path>', '配置文件路径', 'config.yml')
  .action(async (options) => {
    try {
      if (!existsSync(options.config)) {
        throw new Error(`配置文件不存在: ${options.config}`);
      }

      const config = loadConfig(options.config);
      console.log(chalk.green('✓ 配置文件有效'));
      console.log(chalk.gray('\n配置内容:'));
      console.log(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(chalk.red(`✗ 配置文件无效: ${(error as Error).message}`));
      process.exit(1);
    }
  });

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

program.parse();
