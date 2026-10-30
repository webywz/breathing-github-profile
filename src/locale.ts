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

export function errorText(error: unknown, locale?: Locale): string {
  if (error instanceof BilingualError) {
    return error.format(locale);
  }
  return error instanceof Error ? error.message : String(error);
}
