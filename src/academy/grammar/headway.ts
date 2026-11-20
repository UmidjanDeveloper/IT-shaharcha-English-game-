// Grammar path that follows the order of the Headway (5th edition, Oxford University Press) series,
// Beginner → Advanced. Only the sequence of grammar points follows the books; every explanation and
// exercise here is our own. Unit numbers are shown only where the book's contents were verified.
import { cefrLevels, grammar } from './curriculum';
import type { GrammarItem, GrammarTopic } from './curriculum';
import { extraTopics } from './extraTopics';

export type HeadwayLevelId = 'beginner' | 'elementary' | 'pre-intermediate' | 'intermediate' | 'upper-intermediate' | 'advanced';
export type HeadwayLesson = { topic: string; unit?: number; focus?: string };
export type HeadwayLevel = { id: HeadwayLevelId; title: string; cefr: string; color: string; about: string; lessons: HeadwayLesson[] };

export const allTopics: GrammarTopic[] = [...cefrLevels.flatMap(l => grammar[l]), ...extraTopics];
const byId = new Map(allTopics.map(t => [t.id, t]));
export const topicById = (id: string) => byId.get(id)!;

export const headway: HeadwayLevel[] = [
  { id: 'beginner', title: 'Beginner', cefr: 'A1', color: 'mint', about: 'Noldan boshlovchilar uchun: to be, oddiy zamon, can, o‘tgan zamon va rejalar.', lessons: [
    { topic: 'hw-b1', unit: 1 }, { topic: 'hw-b2' }, { topic: 'a1-articles', focus: 'a/an · the' }, { topic: 'a1-be', focus: 'we/they · inkor va savol' },
    { topic: 'hw-b4' }, { topic: 'hw-b5' }, { topic: 'a1-present', focus: 'he/she/it' }, { topic: 'hw-b7' },
    { topic: 'a1-there', unit: 8 }, { topic: 'hw-b9' }, { topic: 'a2-past' }, { topic: 'a1-can' },
    { topic: 'hw-b12' }, { topic: 'a1-continuous' }, { topic: 'hw-b14' },
  ] },
  { id: 'elementary', title: 'Elementary', cefr: 'A1–A2', color: 'blue', about: 'Asosni mustahkamlash: hozirgi va o‘tgan zamon, miqdor, qiyoslash, Present Perfect’ga kirish.', lessons: [
    { topic: 'a1-be', unit: 1, focus: 'to be · egalik olmoshlari' }, { topic: 'a1-present', unit: 2, focus: 'Present Simple (1)' }, { topic: 'hw-e3', unit: 3 },
    { topic: 'a1-there', unit: 4 }, { topic: 'hw-e4', unit: 4 }, { topic: 'a1-can', unit: 5 }, { topic: 'hw-b9', unit: 5 },
    { topic: 'a2-past', unit: 6, focus: 'Past Simple (1)' }, { topic: 'hw-e7', unit: 7 }, { topic: 'a2-countable' }, { topic: 'hw-b12', focus: 'I’d like · ovqat buyurtma' },
    { topic: 'a2-compare' }, { topic: 'hw-e10' }, { topic: 'a2-future' }, { topic: 'hw-e11' }, { topic: 'b1-perfect', unit: 12, focus: 'ever/never' },
  ] },
  { id: 'pre-intermediate', title: 'Pre-Intermediate', cefr: 'A2–B1', color: 'violet', about: 'Zamonlarni bog‘lash: hikoya qilish, kelajak shakllari, modal fe’llar, passive va shart gaplar.', lessons: [
    { topic: 'hw-p1', unit: 1 }, { topic: 'hw-e10', unit: 2, focus: 'Simple vs Continuous · have/have got' }, { topic: 'a2-pastcont', unit: 3 },
    { topic: 'a2-countable', unit: 4, focus: 'Miqdor ifodalari' }, { topic: 'hw-p4', unit: 4 }, { topic: 'b1-gerund', unit: 5, focus: 'Verb patterns' }, { topic: 'a2-future', unit: 5, focus: 'Kelasi zamon shakllari' },
    { topic: 'a2-compare', focus: 'What’s it like? · qiyoslash' }, { topic: 'b1-perfect', focus: 'for/since' }, { topic: 'a2-should', unit: 8 },
    { topic: 'hw-p9', unit: 9 }, { topic: 'b1-passive', unit: 10 }, { topic: 'b2-perfectcont', focus: 'Present Perfect Continuous' }, { topic: 'b1-conditionals' },
  ] },
  { id: 'intermediate', title: 'Intermediate', cefr: 'B1–B2', color: 'orange', about: 'Murakkab savollar, zamonlar tizimi, kelajak shakllari, shart va o‘zlashtirma gaplar.', lessons: [
    { topic: 'hw-i1', unit: 1 }, { topic: 'hw-i2' }, { topic: 'hw-i3' }, { topic: 'hw-i4' }, { topic: 'hw-i5' }, { topic: 'hw-i6' },
    { topic: 'b2-perfectcont', focus: 'Present Perfect simple va continuous' }, { topic: 'b1-gerund', focus: 'Verb + -ing / to' }, { topic: 'hw-i9' },
    { topic: 'b2-modals-past', focus: 'Ehtimollik modallari' }, { topic: 'b1-relative' }, { topic: 'b1-reported' },
  ] },
  { id: 'upper-intermediate', title: 'Upper-Intermediate', cefr: 'B2', color: 'pink', about: 'IELTS 6–7 darajasi: yordamchi fe’llar, kelajak perfekt, odatlar, nisbiy gaplar, gipotetik gaplar.', lessons: [
    { topic: 'hw-u1' }, { topic: 'b2-perfectcont' }, { topic: 'hw-i3', focus: 'Narrative tenses' }, { topic: 'hw-u4' }, { topic: 'hw-u5' },
    { topic: 'hw-u6', unit: 6 }, { topic: 'hw-u7' }, { topic: 'b1-relative', unit: 8, focus: 'Relative clauses' }, { topic: 'c1-participle', unit: 8, focus: 'Participles' },
    { topic: 'b2-modals-past', focus: 'O‘tmishdagi taxmin' }, { topic: 'b2-wish', focus: 'wish · if only' }, { topic: 'b2-third' }, { topic: 'b2-linkers' }, { topic: 'hw-u12', unit: 12 },
  ] },
  { id: 'advanced', title: 'Advanced', cefr: 'C1', color: 'gold', about: 'IELTS 7+ va akademik ingliz tili: aspekt, ta’kid, inversiya, ehtiyotkor uslub, nutq bog‘lovchilari.', lessons: [
    { topic: 'hw-a1', unit: 1 }, { topic: 'hw-a2', unit: 2 }, { topic: 'hw-a3', unit: 3 }, { topic: 'b2-modals-past', unit: 4, focus: 'Modal fe’llar: taxmin' },
    { topic: 'hw-a5', focus: 'Takrordan qochish' }, { topic: 'c1-cleft', focus: 'Ta’kid' }, { topic: 'c1-inversion', focus: 'Ta’kid: inversiya' }, { topic: 'c1-subjunctive', focus: 'Real va unreal zamonlar' },
    { topic: 'c1-participle', focus: 'Relative clauses & participles' }, { topic: 'hw-a9' }, { topic: 'b2-passive-adv', focus: 'Distancing the facts' }, { topic: 'hw-a11' },
    { topic: 'c1-hedging' }, { topic: 'c1-collocations' },
  ] },
];

export const headwayLevel = (id: HeadwayLevelId) => headway.find(l => l.id === id)!;

export function levelItems(id: HeadwayLevelId): (GrammarItem & { topic: string })[] {
  const seen = new Set<string>();
  return headwayLevel(id).lessons.filter(l => !seen.has(l.topic) && seen.add(l.topic))
    .flatMap(l => topicById(l.topic).items.map(item => ({ ...item, topic: topicById(l.topic).title })));
}

/** Club level → the Headway book to start from. */
export function startingBook(level: 'beginner' | 'intermediate' | 'ielts'): HeadwayLevelId {
  return level === 'beginner' ? 'beginner' : level === 'intermediate' ? 'pre-intermediate' : 'upper-intermediate';
}
