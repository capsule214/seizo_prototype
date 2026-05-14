import { createRoot } from 'react-dom/client';
import SpreadsheetGridClient from './components/SpreadsheetGridClient';
import '../css/app.css';

const root = createRoot(document.getElementById('app'));
root.render(<SpreadsheetGridClient />);
