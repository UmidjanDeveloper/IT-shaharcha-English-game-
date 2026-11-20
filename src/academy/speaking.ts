import type { Level } from './lessons';

type Prompt = {
  section: string;
  topic: string;
  question: string;
  cues: string[];
  model: string;
  goal: number;
  preparation?: number;
};

export const speakingPrompts: Record<Level, Prompt[]> = {
  beginner: [
    { section: 'A1–A2', topic: 'Your morning', question: 'What do you usually do before school?', cues: ['Say when you wake up.', 'Name two things you do.'], model: 'I wake up at seven. I eat breakfast and pack my bag before school.', goal: 12 },
    { section: 'A1–A2', topic: 'Food you like', question: 'What is your favourite food? When do you eat it?', cues: ['Start with “My favourite food is …”', 'Say when you eat it.'], model: 'My favourite food is plov. I usually eat it with my family on Sundays.', goal: 12 },
    { section: 'A1–A2', topic: 'A friend', question: 'Tell me about a friend. What do you do together?', cues: ['Describe your friend.', 'Talk about a game or activity.'], model: 'My friend is kind and funny. We play football together after school.', goal: 12 },
  ],
  intermediate: [
    { section: 'B1–B2', topic: 'A new skill', question: 'What skill have you recently learned, and how did you practise it?', cues: ['Describe what was difficult at first.', 'Explain what helped you improve.'], model: 'I recently learned how to edit short videos. At first, I found the software confusing, so I made one small clip each week. My classmates gave me feedback, which helped me notice mistakes and try new ideas.', goal: 26 },
    { section: 'B1–B2', topic: 'A better school day', question: 'If you could change one thing about your school day, what would you change?', cues: ['Use “I would …”', 'Give a reason and an example.'], model: 'I would add a longer break after lunch because students need time to move around. For example, our class could play a short game outside before the next lesson, which would help us concentrate.', goal: 26 },
    { section: 'B1–B2', topic: 'A useful mistake', question: 'Tell me about a mistake that taught you something useful.', cues: ['Explain what happened.', 'Say what you do differently now.'], model: 'Last year I forgot to back up a group presentation. We lost several slides and had to make them again. Since then, I have kept a second copy online and checked it before each presentation.', goal: 26 },
  ],
  ielts: [
    { section: 'Part 1', topic: 'Places to concentrate', question: 'Where do you prefer to study when you need to concentrate?', cues: ['Give a direct answer.', 'Explain what makes the place helpful.'], model: 'I prefer a quiet corner in our local library. There are fewer distractions than at home, and I can spread my notes across a large desk.', goal: 22 },
    { section: 'Part 1', topic: 'Evening routines', question: 'Have your evening habits changed since you were younger?', cues: ['Compare then and now.', 'Add a specific detail.'], model: 'Yes, they have. I used to watch cartoons straight after dinner. Now I tend to finish my homework first, then go for a short walk if I have time.', goal: 22 },
    { section: 'Part 2', topic: 'A project you finished', question: 'Describe a project you finished that was more difficult than you expected.', cues: ['What the project was', 'What made it difficult', 'How you solved one problem', 'What you would do differently next time'], model: 'Last term my group built a simple website about local history. The most difficult part was organising the photos because each student had saved files in a different place. I made a shared folder and asked everyone to label their pictures before uploading them. After that, we could finish the pages much faster. Next time, I would agree on a naming system before starting. The project taught me that good organisation can save as much time as good technical skills.', goal: 65, preparation: 60 },
    { section: 'Part 2', topic: 'A place that surprised you', question: 'Describe a place in your area that surprised you when you first visited it.', cues: ['Where it is', 'Why you went there', 'What was different from your expectations', 'Whether you would recommend it'], model: 'I visited a small craft workshop near the market while my family was shopping. From outside, it looked like an ordinary shop, but inside two people were teaching children to make clay bowls. I was surprised that visitors could join without booking. The teacher showed me how to keep the bowl steady while shaping it. I would recommend the workshop because it gives people a chance to learn something practical and meet neighbours at the same time.', goal: 65, preparation: 60 },
    { section: 'Part 3', topic: 'Practical education', question: 'What are the advantages and disadvantages of assessing students through practical projects?', cues: ['Explain one advantage.', 'Discuss a possible drawback.', 'Use an example to develop your view.'], model: 'Projects show how students apply knowledge, which a short written test may miss. For instance, building a simple model can show whether a student understands how parts work together. A drawback is that some students receive more help at home, so the final product may not reflect individual ability. Schools could address this by asking students to explain their decisions in class.', goal: 42 },
    { section: 'Part 3', topic: 'Community spaces', question: 'Should local governments invest more in places where young people can meet and learn?', cues: ['State your view.', 'Consider a different priority.', 'Explain who would benefit.'], model: 'I think it is worth investing in shared learning spaces, especially where families cannot afford private classes. A public centre can provide equipment, quiet study areas and opportunities to learn with others. Of course, a town also has to pay for basic services, so I would start by adapting existing buildings rather than constructing expensive new ones.', goal: 42 },
  ],
};

const grammar = [
  { pattern: /\bi (?:am|was) (?:agree|disagree)\b/gi, tip: '“I agree” yoki “I disagree” deng. Bu yerda “am” va “was” kerak bo‘lmaydi.' },
  { pattern: /\b(?:he|she) (?:don't|do not)\b/gi, tip: '“He” va “she” bilan “doesn’t” yoki “does not” ishlating.' },
  { pattern: /\bpeople is\b/gi, tip: '“People” odatda ko‘plikda, “people are” deng.' },
  { pattern: /\b(?:informations|homeworks|equipments)\b/gi, tip: 'Bu ot sanalmaydi. Odatda oxiriga “-s” qo‘shilmaydi.' },
  { pattern: /\b(?:more|most) better\b/gi, tip: '“Better” qiyosiy shakl. “More better” o‘rniga “better” deng.' },
  { pattern: /\bdid(?:n't| not) (?:went|saw|was|were)\b/gi, tip: '“Didn’t” dan keyin fe’lning asosiy shaklini ishlating. Masalan, “didn’t go”.' },
  { pattern: /\bi (?:go|am going) (?:there )?yesterday\b/gi, tip: '“Yesterday” o‘tgan vaqtni bildiradi. Masalan, “I went there yesterday”.' },
];

export function analyseSpeaking(text: string) {
  const normalized = text.replace(/[’‘]/g, "'");
  const words = normalized.match(/\b[a-z]+(?:['-][a-z]+)*\b/gi)?.length ?? 0;
  const fillers = normalized.match(/\b(?:um+|uh+|erm+)\b/gi)?.length ?? 0;
  const errors = grammar.flatMap(({ pattern, tip }) => {
    const match = normalized.match(pattern)?.[0];
    return match ? [{ phrase: match, tip }] : [];
  });
  return { words, fillers, errors };
}
