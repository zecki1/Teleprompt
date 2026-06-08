declare module "typo-js" {
  export interface TypoOptions {
    dictionaryPath?: string;
  }

  export default class Typo {
    constructor(
      lang: string,
      affData: string | null,
      dicData: string | null,
      options?: TypoOptions
    );
    check(word: string): boolean;
    suggest(word: string, limit?: number): string[];
    alphabet: string;
  }
}
