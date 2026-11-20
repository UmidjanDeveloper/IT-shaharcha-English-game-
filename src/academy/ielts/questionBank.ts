// IELTS question bank written in the exact style of the live test.
// Topics follow those candidates reported from real exams in 2025–2026 (unofficial: IELTS does not publish live papers).
// The "Fresh questions" button in the app adds the newest candidate-reported questions found on the web.

export type Part1Topic = { topic: string; questions: string[] };
export type CueCard = { topic: string; prompt: string; cues: string[]; rounding: string[]; part3: Part1Topic };
export type Task1 = { id: string; kind: 'bar' | 'line' | 'pie' | 'table'; prompt: string; unit: string; labels: string[]; series: { name: string; values: number[] }[] };
export type Task2 = { id: string; type: string; prompt: string };

export const openingTopics: Part1Topic[] = [
  { topic: 'Work or studies', questions: ['Do you work or are you a student?', 'What subject are you studying?', 'Why did you choose that subject?', 'What do you find most interesting about your studies?', 'Would you like to change anything about your school or university?'] },
  { topic: 'Hometown', questions: ['Where is your hometown?', 'What do you like most about it?', 'Has your hometown changed much in recent years?', 'Is it a good place for young people to live?'] },
  { topic: 'Home and accommodation', questions: ['Do you live in a house or a flat?', 'Which room do you spend the most time in?', 'What would you change about your home?', 'Would you like to live in the same place in the future?'] },
];

export const part1Topics: Part1Topic[] = [
  { topic: 'Weather', questions: ['What kind of weather do you like most?', 'Does the weather affect your mood?', 'What is the weather usually like in your country in spring?', 'Do you check the weather forecast every day?'] },
  { topic: 'Social media', questions: ['Which social media apps do you use most?', 'How much time do you spend on social media every day?', 'Do you think you spend too much time online?', 'Have you ever posted something you later regretted?'] },
  { topic: 'Bicycles', questions: ['Did you learn to ride a bike when you were a child?', 'Do people in your city often ride bicycles?', 'Is it safe to cycle where you live?', 'Would you like to cycle to school or work?'] },
  { topic: 'Plants', questions: ['Do you keep any plants at home?', 'Did you grow plants when you were younger?', 'Why do some people like to have plants indoors?', 'Is there a plant that is special in your country?'] },
  { topic: 'Music', questions: ['What kind of music do you enjoy?', 'Do you listen to music while you study?', 'Have you ever learned to play a musical instrument?', 'Has your taste in music changed since you were a child?'] },
  { topic: 'Sleep', questions: ['How many hours do you usually sleep?', 'Do you ever take naps during the day?', 'What do you do when you cannot fall asleep?', 'Do you think young people get enough sleep?'] },
  { topic: 'Gifts', questions: ['When do people give gifts in your country?', 'What was the last gift you received?', 'Do you prefer giving or receiving gifts?', 'Is it difficult for you to choose gifts for other people?'] },
  { topic: 'Public transport', questions: ['What kind of public transport do you use most?', 'Is public transport cheap in your city?', 'How could public transport be improved where you live?', 'Did you use public transport more when you were younger?'] },
  { topic: 'Patience', questions: ['Are you a patient person?', 'When do you find it hard to be patient?', 'Is it important to be patient at school or work?', 'Do you think people are less patient today than in the past?'] },
  { topic: 'Rain', questions: ['Does it rain a lot where you live?', 'How do you feel on rainy days?', 'What do you usually do when it rains?', 'Have you ever been caught in heavy rain?'] },
  { topic: 'Puzzles and games', questions: ['Did you play puzzles when you were a child?', 'Do you prefer puzzles you do alone or games with friends?', 'Do you think puzzles are good for the brain?', 'What is the most difficult puzzle you have ever solved?'] },
  { topic: 'Teamwork', questions: ['Do you prefer to work alone or in a team?', 'Have you ever had a problem when working in a group?', 'What makes someone a good team member?', 'Did your school give you many group projects?'] },
  { topic: 'History', questions: ['Did you like history lessons at school?', 'Do you prefer learning history from books or from films?', 'Have you visited any historical places recently?', 'Which period of history would you like to know more about?'] },
  { topic: 'Noise', questions: ['Is the area where you live noisy?', 'What kinds of noise annoy you?', 'Do you prefer studying in a quiet place?', 'Are cities becoming noisier?'] },
  { topic: 'Daily routine', questions: ['What is your daily routine like?', 'Which part of the day do you like most?', 'Is your routine different at the weekend?', 'Would you like to change your daily routine?'] },
  { topic: 'Robots and AI', questions: ['Have you ever used a robot or an AI tool?', 'Would you like a robot to help you at home?', 'Do you think robots will replace teachers?', 'Are you interested in learning how robots work?'] },
  { topic: 'Shopping', questions: ['Do you enjoy shopping?', 'Do you prefer shopping online or in shops?', 'What was the last thing you bought?', 'Do you usually plan what you buy before you go shopping?'] },
  { topic: 'Friends', questions: ['How often do you meet your friends?', 'What do you usually do together?', 'Do you prefer to have a few close friends or many friends?', 'Have you kept in touch with your childhood friends?'] },
  { topic: 'Mobile phones', questions: ['How often do you use your phone?', 'What do you use your phone for most?', 'Could you live without your phone for a week?', 'At what age should children get a mobile phone?'] },
  { topic: 'Sports', questions: ['Do you play any sports?', 'What sports are popular in your country?', 'Did you do more sport when you were a child?', 'Do you prefer watching sport or playing it?'] },
  { topic: 'Reading', questions: ['Do you like reading?', 'What kinds of books do you read?', 'Do you prefer paper books or e-books?', 'Did your parents read to you when you were a child?'] },
  { topic: 'Food and cooking', questions: ['What is your favourite food?', 'Can you cook?', 'Do you prefer eating at home or eating out?', 'Is there any food you did not like as a child but enjoy now?'] },
  { topic: 'Holidays', questions: ['What did you do during your last holiday?', 'Do you prefer holidays in the countryside or in a city?', 'Who do you usually go on holiday with?', 'Where would you like to go on your next holiday?'] },
  { topic: 'Mirrors', questions: ['How often do you look in the mirror?', 'Do you have many mirrors in your home?', 'Have you ever bought a mirror?', 'Why do some people like to have mirrors on the walls?'] },
];

const p3 = (topic: string, questions: string[]): Part1Topic => ({ topic, questions });

export const cueCards: CueCard[] = [
  { topic: 'Helping someone', prompt: 'Describe a time when you helped someone.', cues: ['who you helped', 'how you helped this person', 'why you helped them', 'and explain how you felt about it'], rounding: ['Do you often help other people?', 'Did the person thank you?'],
    part3: p3('Helping others', ['Why do some people enjoy helping others?', 'Should children be taught to help at home?', 'Do people help their neighbours less than in the past? Why?', 'Should companies encourage their employees to do volunteer work?']) },
  { topic: 'A good cook', prompt: 'Describe a person you know who is good at cooking.', cues: ['who this person is', 'how you know them', 'what they usually cook', 'and explain why you think they are good at cooking'], rounding: ['Would you like to learn to cook like this person?'],
    part3: p3('Cooking and food', ['Why do fewer young people cook at home nowadays?', 'Should cooking be taught at school?', 'How has fast food changed family life?', 'Do you think traditional dishes will disappear in the future?']) },
  { topic: 'Good news', prompt: 'Describe a piece of good news that you heard recently.', cues: ['what the news was', 'when and how you heard it', 'who told you', 'and explain why you think it was good news'], rounding: ['Did you share this news with anyone?'],
    part3: p3('News and media', ['Why do people pay more attention to bad news than good news?', 'How do young people get news today?', 'Should newspapers report more positive stories?', 'Can people trust news they read on social media?']) },
  { topic: 'A famous person', prompt: 'Describe a famous person you would like to meet.', cues: ['who this person is', 'how you know about them', 'what you would like to do with them', 'and explain why you would like to meet this person'], rounding: ['Do you think you will ever meet them?'],
    part3: p3('Fame', ['Why do young people want to become famous?', 'What are the disadvantages of being famous?', 'Do celebrities have a responsibility to be good role models?', 'How has the internet changed the way people become famous?']) },
  { topic: 'An interesting old person', prompt: 'Describe an interesting old person you have met.', cues: ['who this person is', 'how you met them', 'what you did together', 'and explain why you think this person is interesting'], rounding: ['Do you still keep in touch with this person?'],
    part3: p3('Old age', ['What can young people learn from older people?', 'Should elderly people live with their families or in care homes?', 'How do older people in your country spend their free time?', 'Will people work until an older age in the future?']) },
  { topic: 'Getting lost', prompt: 'Describe a time when you got lost.', cues: ['when and where it happened', 'how you got lost', 'what you did', 'and explain how you felt at that time'], rounding: ['Do you usually use maps on your phone?'],
    part3: p3('Navigation and technology', ['Why do some people have a poor sense of direction?', 'Have maps on phones made people worse at finding their way?', 'Should children learn to read paper maps?', 'What should tourists do to avoid getting lost?']) },
  { topic: 'A book', prompt: 'Describe a book you read recently that you found interesting.', cues: ['what the book was', 'when you read it', 'what it was about', 'and explain why you found it interesting'], rounding: ['Would you recommend it to your friends?'],
    part3: p3('Reading habits', ['Why do children read less than in the past?', 'Is it better to read books or watch films based on them?', 'Will paper books disappear in the future?', 'How can parents encourage children to read?']) },
  { topic: 'A useful app', prompt: 'Describe an app that you find useful.', cues: ['what the app is', 'how you found out about it', 'what you use it for', 'and explain why you think it is useful'], rounding: ['How often do you use it?'],
    part3: p3('Technology in daily life', ['What kinds of apps are popular among young people?', 'Do older people find it difficult to use apps?', 'Should parents control the apps their children use?', 'How will technology change education in the next twenty years?']) },
  { topic: 'A difficult skill', prompt: 'Describe a skill that took you a long time to learn.', cues: ['what the skill is', 'when you started to learn it', 'why it took a long time', 'and explain how you felt when you finally learned it'], rounding: ['Is it still useful to you today?'],
    part3: p3('Learning skills', ['Which skills are most important for young people today?', 'Is it better to learn skills from a teacher or online?', 'Why do some people give up learning new skills?', 'Should schools teach more practical skills?']) },
  { topic: 'A natural place', prompt: 'Describe a natural place you visited that you liked.', cues: ['where it is', 'when you went there', 'what you did there', 'and explain why you liked this place'], rounding: ['Would you like to go there again?'],
    part3: p3('Nature and environment', ['Why is it important for children to spend time in nature?', 'How does tourism damage natural places?', 'Should governments limit the number of visitors to national parks?', 'Do people in cities care less about nature?']) },
  { topic: 'Waiting', prompt: 'Describe a time when you had to wait for something special.', cues: ['what you waited for', 'how long you waited', 'why you had to wait', 'and explain how you felt while you were waiting'], rounding: ['Are you good at waiting?'],
    part3: p3('Patience and waiting', ['In what situations do people usually have to wait?', 'Why are people less patient nowadays?', 'How can businesses make waiting less boring for customers?', 'Is patience a skill that can be learned?']) },
  { topic: 'An important rule', prompt: 'Describe a rule at your school or home that you think is important.', cues: ['what the rule is', 'who made the rule', 'what happens if people break it', 'and explain why you think it is important'], rounding: ['Have you ever broken this rule?'],
    part3: p3('Rules and society', ['Why do children sometimes break rules?', 'Should schools have strict rules about uniforms?', 'What rules should parents set for teenagers?', 'Are there too many rules in modern society?']) },
  { topic: 'A crowded place', prompt: 'Describe a crowded place you have been to.', cues: ['where it was', 'when you went there', 'why it was crowded', 'and explain how you felt about being there'], rounding: ['Do you usually avoid crowded places?'],
    part3: p3('Cities and crowds', ['Why do people choose to live in crowded cities?', 'How can governments reduce crowding in big cities?', 'Are crowded places dangerous?', 'Will cities become more crowded in the future?']) },
  { topic: 'A decision', prompt: 'Describe an important decision you made.', cues: ['what the decision was', 'when you made it', 'who helped you decide', 'and explain why it was important'], rounding: ['Do you think you made the right decision?'],
    part3: p3('Decision making', ['Should parents make important decisions for their children?', 'Why do some people find it difficult to make decisions?', 'Is it better to decide quickly or slowly?', 'What kinds of decisions do teenagers make today?']) },
  { topic: 'Being late', prompt: 'Describe a time when you were late for something.', cues: ['what you were late for', 'why you were late', 'what happened as a result', 'and explain how you felt'], rounding: ['Are you usually on time?'],
    part3: p3('Punctuality', ['Is being on time important in your culture?', 'Why are some people always late?', 'Should students be punished for being late?', 'How has technology helped people manage their time?']) },
  { topic: 'An inspiring person', prompt: 'Describe a person who has inspired you.', cues: ['who this person is', 'how you know them', 'what they have done', 'and explain how they have inspired you'], rounding: ['Have you told them that they inspired you?'],
    part3: p3('Role models', ['Who are the role models for young people in your country?', 'Can teachers be good role models?', 'Do sports stars have a positive influence on children?', 'Is it necessary to have a role model to succeed?']) },
  { topic: 'A gift you gave', prompt: 'Describe a gift you gave to someone.', cues: ['what the gift was', 'who you gave it to', 'why you chose it', 'and explain how the person felt about it'], rounding: ['Do you enjoy choosing gifts?'],
    part3: p3('Gifts and celebrations', ['Why do people give gifts?', 'Is money a good gift?', 'Do people spend too much money on celebrations?', 'How have traditions of giving gifts changed in your country?']) },
  { topic: 'An advertisement', prompt: 'Describe an advertisement you remember well.', cues: ['what it was for', 'where you saw it', 'what it showed', 'and explain why you remember it'], rounding: ['Did you buy the product?'],
    part3: p3('Advertising', ['Should advertising aimed at children be banned?', 'Why are online adverts so effective?', 'Do adverts give people false information?', 'How will advertising change in the future?']) },
  { topic: 'A historical building', prompt: 'Describe a historical building you have visited.', cues: ['what it is', 'where it is', 'what you learned there', 'and explain how you felt about visiting it'], rounding: ['Do many tourists go there?'],
    part3: p3('Heritage', ['Why is it important to protect old buildings?', 'Who should pay to look after historical sites?', 'Should old buildings be replaced by modern ones in city centres?', 'How can museums attract more young visitors?']) },
  { topic: 'A power cut', prompt: 'Describe a time when the electricity went off.', cues: ['when it happened', 'where you were', 'what you did', 'and explain how you felt about it'], rounding: ['How long did it last?'],
    part3: p3('Energy', ['How can people save energy at home?', 'Should governments invest more in solar energy?', 'How would life change without electricity for a week?', 'Do people today depend too much on technology?']) },
  { topic: 'A sports event', prompt: 'Describe a sports event you watched.', cues: ['what event it was', 'where and when you watched it', 'who you watched it with', 'and explain why you enjoyed it'], rounding: ['Do you often watch sports?'],
    part3: p3('Sport in society', ['Why are big sports events so popular?', 'Are professional athletes paid too much?', 'Should schools spend more time on sport?', 'Is it good for a country to host international events?']) },
  { topic: 'A place to relax', prompt: 'Describe a place where you like to relax.', cues: ['where it is', 'how often you go there', 'what you do there', 'and explain why it helps you relax'], rounding: ['Do you go there alone?'],
    part3: p3('Stress and leisure', ['Why do students feel stressed nowadays?', 'Do people have less free time than in the past?', 'Is it better to relax at home or outdoors?', 'Should employers provide places for workers to relax?']) },
  { topic: 'A disappointing purchase', prompt: 'Describe something you bought that you were not satisfied with.', cues: ['what you bought', 'where you bought it', 'why you were not satisfied', 'and explain what you did about it'], rounding: ['Have you bought anything similar since then?'],
    part3: p3('Consumers', ['Why do people buy things they do not need?', 'Is it easy to return products in your country?', 'Do online reviews help people shop better?', 'Should companies be punished for selling poor products?']) },
  { topic: 'A teacher', prompt: 'Describe a teacher who helped you a lot.', cues: ['who this teacher is', 'what subject they taught', 'how they helped you', 'and explain why you remember them'], rounding: ['Are you still in contact with this teacher?'],
    part3: p3('Education', ['What makes a good teacher?', 'Will AI tutors replace teachers in the future?', 'Should teachers be paid more?', 'Is it better to study in large or small classes?']) },
];

export const task2: Task2[] = [
  { id: 't2-1', type: 'Opinion', prompt: 'Some people think that schools should teach children how to manage money, while others believe this is the responsibility of parents. Discuss both views and give your own opinion.' },
  { id: 't2-2', type: 'Agree / disagree', prompt: 'Artificial intelligence tools will soon make it unnecessary for students to learn foreign languages. To what extent do you agree or disagree?' },
  { id: 't2-3', type: 'Problem / solution', prompt: 'In many cities, young people spend less time outdoors than previous generations. What are the causes of this, and what can be done to solve this problem?' },
  { id: 't2-4', type: 'Advantages / disadvantages', prompt: 'More and more students are choosing to take courses online rather than attending classes in person. Do the advantages of this outweigh the disadvantages?' },
  { id: 't2-5', type: 'Two-part question', prompt: 'Many people today prefer to buy fast fashion clothes that are cheap and quickly replaced. Why is this the case? Is it a positive or negative development?' },
  { id: 't2-6', type: 'Discuss both views', prompt: 'Some people believe that famous sports stars earn too much money. Others think their high salaries are fair. Discuss both views and give your opinion.' },
  { id: 't2-7', type: 'Agree / disagree', prompt: 'Governments should spend money on public transport rather than on building new roads. To what extent do you agree or disagree?' },
  { id: 't2-8', type: 'Problem / solution', prompt: 'Many historical buildings are being replaced by modern ones in city centres. What problems does this cause, and how can they be solved?' },
  { id: 't2-9', type: 'Positive / negative', prompt: 'In some countries, people are choosing to work from home instead of going to an office. Is this a positive or negative development?' },
  { id: 't2-10', type: 'Opinion', prompt: 'Some people say that the best way to improve public health is to increase the number of sports facilities. Others think other measures are more effective. Discuss both views and give your opinion.' },
  { id: 't2-11', type: 'Agree / disagree', prompt: 'Children should not be allowed to own a smartphone until they are at least sixteen years old. To what extent do you agree or disagree?' },
  { id: 't2-12', type: 'Advantages / disadvantages', prompt: 'Tourism brings many visitors to small towns and villages. Do the advantages of this outweigh the disadvantages for local people?' },
];

export const task1: Task1[] = [
  { id: 't1-1', kind: 'bar', unit: '% of households', prompt: 'The chart below shows the percentage of households in three countries that owned a laptop, a tablet and a smart speaker in 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    labels: ['Laptop', 'Tablet', 'Smart speaker'], series: [{ name: 'Country A', values: [82, 54, 31] }, { name: 'Country B', values: [67, 61, 12] }, { name: 'Country C', values: [45, 38, 6] }] },
  { id: 't1-2', kind: 'line', unit: 'millions of passengers', prompt: 'The graph below shows the number of passengers using three types of public transport in a city between 2000 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    labels: ['2000', '2005', '2010', '2015', '2020', '2025'], series: [{ name: 'Bus', values: [52, 50, 47, 44, 30, 41] }, { name: 'Metro', values: [20, 26, 35, 46, 33, 58] }, { name: 'Tram', values: [12, 11, 9, 8, 5, 7] }] },
  { id: 't1-3', kind: 'pie', unit: '% of weekly free time', prompt: 'The chart below shows how teenagers in one country spent their free time in a typical week in 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    labels: ['Social media', 'Sport', 'Gaming', 'Reading', 'Other'], series: [{ name: '2025', values: [34, 18, 24, 9, 15] }] },
  { id: 't1-4', kind: 'table', unit: 'tonnes per year', prompt: 'The table below shows the amount of waste recycled in four cities in 2015 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    labels: ['Paper', 'Plastic', 'Glass', 'Metal'], series: [{ name: 'City W 2015', values: [420, 180, 150, 60] }, { name: 'City W 2025', values: [510, 340, 160, 95] }, { name: 'City X 2015', values: [300, 90, 200, 40] }, { name: 'City X 2025', values: [280, 210, 190, 70] }] },
  { id: 't1-5', kind: 'bar', unit: 'average hours per week', prompt: 'The chart below shows the average number of hours students in four age groups spent studying online and in libraries in 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    labels: ['12–14', '15–17', '18–20', '21–24'], series: [{ name: 'Online', values: [5, 9, 14, 17] }, { name: 'Library', values: [4, 6, 7, 4] }] },
  { id: 't1-6', kind: 'line', unit: '°C', prompt: 'The graph below shows the average monthly temperature in two cities over one year. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'], series: [{ name: 'Tashkent', values: [2, 10, 22, 28, 21, 8] }, { name: 'London', values: [5, 8, 13, 19, 16, 8] }] },
];

/** Builds a full mock in the real order: ID check, Part 1 (opening topic + 2 topics), Part 2 cue card, Part 3. */
export function buildSpeakingTest(seed = Math.random()) {
  const rand = mulberry(Math.floor(seed * 2 ** 31));
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const opening = pick(openingTopics);
  const pool = [...part1Topics];
  const first = pool.splice(Math.floor(rand() * pool.length), 1)[0];
  const second = pool.splice(Math.floor(rand() * pool.length), 1)[0];
  const card = pick(cueCards);
  return { opening: { ...opening, questions: opening.questions.slice(0, 4) }, part1: [first, second].map(t => ({ ...t, questions: t.questions.slice(0, 3) })), card };
}

function mulberry(a: number) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function roundBand(value: number) {
  return Math.round(Math.max(0, Math.min(9, value)) * 2) / 2;
}

/** Overall speaking band: mean of the four criteria, rounded to the nearest half band (IELTS convention). */
export function overallBand(criteria: number[]) {
  const mean = criteria.reduce((a, b) => a + b, 0) / criteria.length;
  const floor = Math.floor(mean), part = mean - floor;
  return part < 0.25 ? floor : part < 0.75 ? floor + 0.5 : floor + 1;
}
