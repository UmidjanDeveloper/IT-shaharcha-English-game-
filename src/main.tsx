import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import Academy from './academy/Academy';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Academy />
  </StrictMode>,
);
