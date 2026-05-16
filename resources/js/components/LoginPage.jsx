import { useState } from 'react';
import { initCsrf, apiFetch } from '../lib/api';

export default function LoginPage({ onLogin }) {
    const [loginId, setLoginId]   = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await initCsrf();
            const res = await apiFetch('/login', {
                method: 'POST',
                body: JSON.stringify({ loginId, password }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message ?? 'ログインに失敗しました');
                return;
            }
            const data = await res.json();
            onLogin(data.user);
        } catch {
            setError('サーバーに接続できませんでした');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: '#f3f4f6',
        }}>
            <div style={{
                background: '#fff', borderRadius: 12, padding: '40px 36px',
                width: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: '#111827' }}>
                    製造スケジュール管理
                </h1>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>
                    ログインしてください
                </p>

                <form onSubmit={handleSubmit}>
                    <label style={{ display: 'block', marginBottom: 16 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>ID</span>
                        <input
                            type="text"
                            value={loginId}
                            onChange={e => setLoginId(e.target.value)}
                            autoComplete="username"
                            required
                            style={{
                                display: 'block', width: '100%', marginTop: 6,
                                padding: '9px 12px', border: '1px solid #d1d5db',
                                borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
                                outline: 'none',
                            }}
                        />
                    </label>

                    <label style={{ display: 'block', marginBottom: 24 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>パスワード</span>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            style={{
                                display: 'block', width: '100%', marginTop: 6,
                                padding: '9px 12px', border: '1px solid #d1d5db',
                                borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
                                outline: 'none',
                            }}
                        />
                    </label>

                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fca5a5',
                            borderRadius: 6, padding: '8px 12px', marginBottom: 16,
                            fontSize: 13, color: '#b91c1c',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '10px 0',
                            background: loading ? '#93c5fd' : '#2563eb',
                            color: '#fff', border: 'none', borderRadius: 6,
                            fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>
            </div>
        </div>
    );
}
