import { useRef, useEffect } from 'react';
import { CELL_SIZE, SLOT_COUNT } from '../lib/spreadsheet';

/**
 * 背景セル・グリッド線・グループ区切り線を Canvas 1枚で描画する。
 * DOM 要素を生成しないため、装置/担当者/場所が数万件あってもメモリ使用量が増加しない。
 * 予定バーと選択枠は呼び出し元で React 要素として描画する。
 */
export default function SpreadsheetGridCanvas({
    width,
    height,
    scrollLeft,
    scrollTop,
    visColStart,
    visColEnd,
    visRowStart,
    visRowEnd,
    colW,
    dateColumns,
    viewMode,
    layoutGroups,
    locationRowAbsSet,
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || width <= 0 || height <= 0) return;

        // HiDPI 対応: 物理ピクセルで描画して CSS ピクセルにフィット
        const dpr = window.devicePixelRatio || 1;
        const pw = Math.round(width * dpr);
        const ph = Math.round(height * dpr);
        if (canvas.width !== pw) canvas.width = pw;
        if (canvas.height !== ph) canvas.height = ph;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // 列ごとの背景色を事前計算（休日・土日・平日）
        const colBg = new Array(visColEnd - visColStart + 1);
        for (let col = visColStart; col <= visColEnd; col++) {
            const dayIdx = viewMode === 'day' ? col : Math.floor(col / SLOT_COUNT);
            const dc = dateColumns[dayIdx];
            colBg[col - visColStart] =
                dc && (dc.type === 'holiday' || dc.type === 'sunday' || dc.type === 'saturday')
                    ? '#e5e7eb'
                    : '#f9fafb';
        }

        // セル背景塗りつぶし
        for (let col = visColStart; col <= visColEnd; col++) {
            const x = col * colW - scrollLeft;
            const base = colBg[col - visColStart];
            for (let row = visRowStart; row <= visRowEnd; row++) {
                const y = row * CELL_SIZE - scrollTop;
                const bg = locationRowAbsSet.has(row)
                    ? (base === '#e5e7eb' ? '#cfe2f3' : '#dbeafe')
                    : base;
                ctx.fillStyle = bg;
                ctx.fillRect(x, y, colW, CELL_SIZE);
            }
        }

        // グリッド線（列・行の区切り）
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let col = visColStart; col <= visColEnd + 1; col++) {
            const x = Math.round(col * colW - scrollLeft) + 0.5;
            if (x < -1 || x > width + 1) continue;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let row = visRowStart; row <= visRowEnd + 1; row++) {
            const y = Math.round(row * CELL_SIZE - scrollTop) + 0.5;
            if (y < -1 || y > height + 1) continue;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // グループ区切り線（グリッド線より太く/濃く上書き）
        for (const g of layoutGroups) {
            const lineY = g.startRow * CELL_SIZE - scrollTop;
            if (lineY >= -1 && lineY <= height + 1) {
                ctx.fillStyle = '#9ca3af';
                ctx.fillRect(0, Math.round(lineY), width, 1);
            }
            if (g.locationRowIdx >= 0) {
                const locY = (g.startRow + g.locationRowIdx) * CELL_SIZE - scrollTop;
                if (locY >= -1 && locY <= height + 1) {
                    ctx.fillStyle = '#93c5fd';
                    ctx.fillRect(0, Math.round(locY), width, 1);
                }
            }
        }
    }, [
        width, height,
        scrollLeft, scrollTop,
        visColStart, visColEnd, visRowStart, visRowEnd,
        colW, dateColumns, viewMode,
        layoutGroups, locationRowAbsSet,
    ]);

    return <canvas ref={canvasRef} style={{ display: 'block', pointerEvents: 'none' }} />;
}
