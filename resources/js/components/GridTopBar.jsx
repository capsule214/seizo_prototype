export default function GridTopBar({
    tab,
    setTab,
    isDirty,
    onSave,
    onCancel,
    onOpenSettings,
    userName,
    onLogout,
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '2px solid #e5e7eb', padding: '0 12px', flexShrink: 0 }}>
            {[['device', '装置'], ['worker', '担当者'], ['location', '場所']].map(([key, label]) => (
                <button
                    key={key}
                    onClick={() => setTab(key)}
                    style={{
                        padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer',
                        fontWeight: tab === key ? 700 : 400, fontSize: 14,
                        borderBottom: tab === key ? '2px solid #2563eb' : '2px solid transparent',
                        marginBottom: -2, color: tab === key ? '#2563eb' : '#374151',
                    }}
                >
                    {label}
                </button>
            ))}
            <div style={{ flex: 1 }} />
            {isDirty && (
                <>
                    <button onClick={onSave} style={{ padding: '6px 14px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>保存</button>
                    <button onClick={onCancel} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13, marginLeft: 6 }}>キャンセル</button>
                    <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 8px' }} />
                </>
            )}
            <button onClick={onOpenSettings} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>表示設定</button>
            <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 4px' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{userName}</span>
            <button onClick={onLogout} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>ログアウト</button>
        </div>
    );
}
