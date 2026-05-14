import { useState, useRef, useEffect, useCallback } from 'react';

const ROW_HEIGHT = 36;

export default function VirtualList({ items, renderItem, height }) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef(null);

    const visibleStart = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 4);
    const visibleEnd   = Math.min(items.length - 1, Math.ceil((scrollTop + height) / ROW_HEIGHT) + 4);

    const onScroll = useCallback(e => setScrollTop(e.currentTarget.scrollTop), []);

    return (
        <div
            ref={containerRef}
            style={{ height, overflowY: 'auto', position: 'relative' }}
            onScroll={onScroll}
        >
            <div style={{ height: items.length * ROW_HEIGHT, position: 'relative' }}>
                {items.slice(visibleStart, visibleEnd + 1).map((item, idx) => (
                    <div
                        key={item.id ?? (visibleStart + idx)}
                        style={{ position: 'absolute', top: (visibleStart + idx) * ROW_HEIGHT, left: 0, right: 0, height: ROW_HEIGHT }}
                    >
                        {renderItem(item, visibleStart + idx)}
                    </div>
                ))}
            </div>
        </div>
    );
}
