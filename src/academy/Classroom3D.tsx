import type { ReactNode } from 'react';
import Mentor from './Mentor';

export default function Classroom3D({title,text,pose,children}:{title:string;text:string;pose:string;children?:ReactNode}) {
  return <div className="classroom3d atelier-class">
    <div className="atelier-instructor"><Mentor pose={pose} view="classroom"/></div>
    {(title || text) && <article className="atelier-board" tabIndex={0} aria-label="Dars doskasi">
      <h2>{title || 'Dars doskasi'}</h2><p>{text}</p>
    </article>}
    {children}
  </div>;
}
