import type { Language } from '../core/constants';
import { dictionaries, type TranslationKey } from './dictionaries';

export class I18n {
  private language: Language;

  constructor() {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('rairaitei-language');
    } catch {
      saved = null;
    }
    this.language = saved === 'vn' ? 'vn' : 'jp';
  }

  get current(): Language {
    return this.language;
  }

  setLanguage(language: Language): void {
    this.language = language;
    try {
      localStorage.setItem('rairaitei-language', language);
    } catch {
      // The selected language remains active when browser storage is unavailable.
    }
  }

  t(key: TranslationKey, vars: Record<string, string | number> = {}): string {
    let text = dictionaries[this.language][key];
    for (const [name, value] of Object.entries(vars))
      text = text.replaceAll(`{${name}}`, String(value));
    return text;
  }
}
