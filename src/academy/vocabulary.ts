import type { Level } from './lessons';

export const vocabulary: Record<Level, [english: string, uzbek: string][][]> = {
  beginner: [
    [['window', 'deraza'], ['chair', 'stul'], ['garden', 'bog‘'], ['bread', 'non'], ['pencil', 'qalam']],
    [['morning', 'ertalab'], ['rain', 'yomg‘ir'], ['teacher', 'o‘qituvchi'], ['river', 'daryo'], ['friend', 'do‘st']],
  ],
  intermediate: [
    [['improve', 'yaxshilamoq'], ['borrow', 'olib turmoq'], ['challenge', 'sinov'], ['reliable', 'ishonchli'], ['support', 'qo‘llab-quvvatlamoq']],
    [['affordable', 'hamyonbop'], ['avoid', 'chetlab o‘tmoq'], ['advantage', 'afzallik'], ['suggest', 'taklif qilmoq'], ['available', 'mavjud']],
  ],
  ielts: [
    [['decline', 'pasayish'], ['evidence', 'dalil'], ['significant', 'sezilarli'], ['fluctuate', 'o‘zgarib turmoq'], ['proportion', 'ulush']],
    [['sustainable', 'barqaror'], ['allocate', 'ajratmoq'], ['mitigate', 'salbiy ta’sirni kamaytirmoq'], ['substantial', 'katta miqdordagi'], ['consequence', 'oqibat']],
  ],
};
