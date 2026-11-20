import type { ReactNode } from 'react';
import { ArrowUpRight, BookOpen, GraduationCap, Mic, Gamepad2 } from 'lucide-react';
import Mentor from './Mentor';

export type WorldSection='grammar'|'ielts'|'speaking'|'games'|'teacher';
const rooms=[
  {id:'ielts',title:'IELTS markazi',icon:GraduationCap},
  {id:'grammar',title:'Grammatika',icon:BookOpen},
  {id:'speaking',title:'Speaking',icon:Mic},
  {id:'games',title:'O‘yinlar',icon:Gamepad2},
] as const;
export default function World3D({onSelect,children}:{onSelect:(section:WorldSection)=>void;children?:ReactNode}) {
  return <section className="atelier-home">
    <div className="atelier-cover"><Mentor pose="idle" view="cover"/>{children}</div>
    <nav className="atelier-rooms" aria-label="Akademiya bo‘limlari">
      {rooms.map(({id,title,icon:Icon})=><button key={id} onClick={()=>onSelect(id)}><Icon size={22}/><span>{title}</span><ArrowUpRight size={16}/></button>)}
    </nav>
  </section>;
}
