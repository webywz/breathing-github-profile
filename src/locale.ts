export type Locale = 'en' | 'zh';

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

/** CLI errors whose `.message` stays bilingual so `--json` is unchanged. */
export class BilingualError extends Error {
  constructor(
    bilingual: string,
    public readonly en: string,
    public readonly zh: string
  ) {
    super(bilingual);
    this.name = 'BilingualError';
  }

  format(locale?: Locale): string {
    if (locale === 'en') return this.en;
    if (locale === 'zh') return this.zh;
    return this.message;
  }
}

export function parseLocale(raw: string | undefined): Locale {
  if (raw === undefined || raw === '') {
    throw new UsageError('--locale requires en or zh');
  }
  if (raw !== 'en' && raw !== 'zh') {
    throw new UsageError(`Invalid --locale "${raw}". Use en or zh.`);
  }
  return raw;
}

export function cliText(
  locale: Locale | undefined,
  parts: { both: string; en: string; zh: string }
): string {
  if (locale === 'en') return parts.en;
  if (locale === 'zh') return parts.zh;
  return parts.both;
}

/** Post-success next-step lines for `init` (command names stay English). */
export function initNextStepLines(
  locale: Locale | undefined,
  outputPath: string
): string[] {
  const heading = cliText(locale, {
    both: '  Next steps / 后续步骤:',
    en: '  Next steps:',
    zh: '  后续步骤:'
  });
  const edit = cliText(locale, {
    both:
      `  1. Edit ${outputPath} with your GitHub username\n` +
      `     编辑 ${outputPath}，填入你的 GitHub 用户名`,
    en: `  1. Edit ${outputPath} with your GitHub username`,
    zh: `  1. 编辑 ${outputPath}，填入你的 GitHub 用户名`
  }).split('\n');
  const runValidate = cliText(locale, {
    both: '  2. Run: breathing-profile validate',
    en: '  2. Run: breathing-profile validate',
    zh: '  2. 运行: breathing-profile validate'
  });
  const runGenerate = cliText(locale, {
    both: '  3. Run: breathing-profile generate',
    en: '  3. Run: breathing-profile generate',
    zh: '  3. 运行: breathing-profile generate'
  });
  return [heading, ...edit, runValidate, runGenerate];
}

export function errorText(error: unknown, locale?: Locale): string {
  if (error instanceof BilingualError) {
    return error.format(locale);
  }
  return error instanceof Error ? error.message : String(error);
}

/** Usage error when `--html` and `--json` are passed together. */
export const HTML_JSON_CONFLICT = {
  both: 'error: --html and --json cannot be used together / --html 与 --json 不能同时使用',
  en: 'error: --html and --json cannot be used together',
  zh: 'error: --html 与 --json 不能同时使用'
};
