import { useLayoutEffect, useRef, useState } from 'react';

export default function DeviceHeaderTooltip({ detail, onClose }) {
    if (!detail) return null;
    const rootRef = useRef(null);
    const [pos, setPos] = useState({ left: 8, top: detail.y + 10, arrow: 'top' });

    useLayoutEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const margin = 8;
        const rect = el.getBoundingClientRect();
        const gap = 6;
        const maxTop = window.innerHeight - rect.height - margin;
        const nextLeft = margin;
        const anchorTop = detail.anchorRect?.top ?? detail.y;
        const anchorBottom = detail.anchorRect?.bottom ?? detail.y;

        const topCandidate = anchorTop - rect.height - gap;
        const bottomCandidate = anchorBottom + gap;

        let nextTop = bottomCandidate;
        let arrow = 'top';

        if (topCandidate >= margin) {
            nextTop = topCandidate;
            arrow = 'bottom';
        } else if (bottomCandidate <= maxTop) {
            nextTop = bottomCandidate;
            arrow = 'top';
        } else {
            const clampedTop = Math.min(Math.max(margin, bottomCandidate), Math.max(margin, maxTop));
            nextTop = clampedTop;
            arrow = clampedTop <= anchorTop ? 'bottom' : 'top';
        }

        setPos({ left: nextLeft, top: nextTop, arrow });
    }, [detail]);

    return (
        <div
            ref={rootRef}
            data-device-tooltip="1"
            style={{
                position: 'fixed',
                left: pos.left,
                top: pos.top,
                zIndex: 120,
                width: 280,
                background: 'rgba(255,255,255,0.86)',
                backdropFilter: 'blur(2px)',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                boxShadow: '0 10px 24px rgba(0,0,0,0.15)',
                padding: 10,
                fontSize: 12,
            }}
        >
            {pos.arrow === 'top' ? (
                <div
                    style={{
                        position: 'absolute',
                        left: 18,
                        top: -8,
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '8px solid rgba(255,255,255,0.86)',
                        filter: 'drop-shadow(0 -1px 0 #d1d5db)',
                    }}
                />
            ) : (
                <div
                    style={{
                        position: 'absolute',
                        left: 18,
                        bottom: -8,
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '8px solid rgba(255,255,255,0.86)',
                        filter: 'drop-shadow(0 1px 0 #d1d5db)',
                    }}
                />
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>装置詳細</div>
                <button
                    onClick={onClose}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1 }}
                >
                    ×
                </button>
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
                <div><span style={{ color: '#6b7280' }}>機種:</span> {detail.kisyuName || '-'}</div>
                <div><span style={{ color: '#6b7280' }}>製番:</span> {detail.serialNo || '-'}</div>
                <div><span style={{ color: '#6b7280' }}>表示予定件数:</span> {detail.planCount}</div>
                {detail.locationPlanCount != null && (
                    <div><span style={{ color: '#6b7280' }}>場所予定件数:</span> {detail.locationPlanCount}</div>
                )}
            </div>
        </div>
    );
}
