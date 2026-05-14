import { useEffect, useRef } from 'react';

export default function ContextMenu({ x, y, items, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const adjX = Math.min(x, window.innerWidth - 180);
    const adjY = Math.min(y, window.innerHeight - items.length * 32 - 8);

    return (
        <div
            ref={ref}
            style={{
                position: 'fixed', left: adjX, top: adjY, zIndex: 9999,
                background: '#fff', border: '1px solid #d1d5db', borderRadius: 6,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)', padding: '4px 0', minWidth: 160,
            }}
        >
            {items.map((item, i) =>
                item === 'separator' ? (
                    <div key={i} style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
                ) : (
                    <div
                        key={i}
                        style={{
                            padding: '6px 16px', fontSize: 13, cursor: item.disabled ? 'default' : 'pointer',
                            color: item.danger ? '#ef4444' : item.disabled ? '#9ca3af' : '#111',
                        }}
                        onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = '#f3f4f6'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        onClick={() => { if (!item.disabled) { item.onClick(); onClose(); } }}
                    >
                        {item.label}
                    </div>
                )
            )}
        </div>
    );
}
