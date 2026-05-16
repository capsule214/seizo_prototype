import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import SpreadsheetGridClient from './components/SpreadsheetGridClient';
import LoginPage from './components/LoginPage';
import { initCsrf, apiFetch } from './lib/api';
import '../css/app.css';

function App() {
    const [user, setUser]       = useState(null);   // null = 未確認
    const [checked, setChecked] = useState(false);  // 認証確認済みフラグ

    // 初期表示時に認証済みセッションがあるか確認
    useEffect(() => {
        initCsrf().then(() =>
            apiFetch('/me', { method: 'GET' })
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data?.user) setUser(data.user);
                })
                .catch(() => {})
                .finally(() => setChecked(true))
        );
    }, []);

    if (!checked) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 14, color: '#6b7280' }}>
                読み込み中...
            </div>
        );
    }

    if (!user) {
        return <LoginPage onLogin={u => setUser(u)} />;
    }

    return <SpreadsheetGridClient user={user} onLogout={() => setUser(null)} />;
}

const root = createRoot(document.getElementById('app'));
root.render(<App />);
