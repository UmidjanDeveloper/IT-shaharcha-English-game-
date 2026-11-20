// Offline estimate used only when the AI examiner is not configured. Clearly labelled as rough in the UI.
import { analyseSpeaking } from '../speaking';
import { overallBand, roundBand } from './questionBank';

export type AnswerEvidence = { part: string; question: string; transcript: string; seconds: number; pauses: number; longestPause: number; unclear: string[] };

export function wordsPerMinute(transcript: string, seconds: number) {
  const words = transcript.match(/\b[\p{L}']+\b/gu)?.length ?? 0;
  return seconds > 0 ? Math.round(words / (seconds / 60)) : 0;
}

export function estimateBands(answers: AnswerEvidence[]) {
  const spoken = answers.filter(a => a.transcript.trim());
  if (!spoken.length) return { fluency: 0, lexical: 0, grammar: 0, pronunciation: 0, overall: 0 };
  const text = spoken.map(a => a.transcript).join(' ');
  const words: string[] = text.toLowerCase().match(/\b[a-z']+\b/g) ?? [];
  const seconds = spoken.reduce((s, a) => s + a.seconds, 0) || 1;
  const wpm = words.length / (seconds / 60);
  const pausesPerMin = spoken.reduce((s, a) => s + a.pauses, 0) / (seconds / 60);
  const { errors, fillers } = analyseSpeaking(text);
  const variety = new Set(words.filter(w => w.length > 3)).size / Math.max(1, Math.sqrt(words.length));
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length || 1;
  const avgLength = words.length / sentences;
  const linkers = (text.match(/\b(because|although|however|for example|for instance|on the other hand|whereas|which|while|unless|since|therefore)\b/gi) ?? []).length;
  const perAnswer = words.length / spoken.length;
  const unclearRate = spoken.reduce((s, a) => s + a.unclear.length, 0) / Math.max(1, words.length);

  const fluency = roundBand(3 + Math.min(2.5, wpm / 50) + Math.min(1.5, perAnswer / 25) + Math.min(1, linkers / spoken.length) - Math.min(1.5, pausesPerMin / 6) - Math.min(1, fillers / 8));
  const lexical = roundBand(3 + Math.min(3.5, variety / 1.4) + Math.min(1, perAnswer / 40));
  const grammar = roundBand(3 + Math.min(2.5, avgLength / 7) + Math.min(1.5, linkers / spoken.length * 1.5) - Math.min(2, errors.length * 0.5));
  const pronunciation = roundBand(Math.min(fluency + 0.5, 7.5 - Math.min(2.5, unclearRate * 40)));
  return { fluency, lexical, grammar, pronunciation, overall: overallBand([fluency, lexical, grammar, pronunciation]) };
}
