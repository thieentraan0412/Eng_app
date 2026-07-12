// Khai báo kiểu tối giản cho nspell (thư viện không kèm types)
declare module 'nspell' {
  interface NSpell {
    correct(word: string): boolean
    suggest(word: string): string[]
    spell(word: string): { correct: boolean; forbidden: boolean; warn: boolean }
    add(word: string): NSpell
  }
  export default function nspell(aff: string, dic?: string): NSpell
}
