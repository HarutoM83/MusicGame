//timecalculator.js

import { state,chart} from "./state.js";
import { dom } from "./DOM.js";

/* =========================================================
   時間変換・ソフラン計算
========================================================= */
export function getTimeSignature() {
    const num = Number(document.getElementById("timeNumerator").value) || 4;
    const den = Number(document.getElementById("timeDenominator").value) || 4;
    return num * (4 / den);
}

export function getBeatPerMeasure() {
    return getTimeSignature();
}

export function getBpmChanges() {
    let baseBpm = Number(document.getElementById("bpm").value) || 120;
    let changes = chart.bpmChanges ? [...chart.bpmChanges] : [];
    
    if (!changes.some(b => Math.abs(b.time) < 0.001)) {
        changes.unshift({ time: 0, bpm: baseBpm });
    }
    return changes.sort((a, b) => a.time - b.time);
}

export function timeToY(time) {
    let y = 0; // 0秒のときを最下部（y=0）にする
    const changes = getBpmChanges();
    const  baseBpm = Number(document.getElementById("bpm").value) || 120;
    const pps = pixelsPerSecond;

    for (let i = 0; i < changes.length; i++) {
        const segStart = changes[i].time;
        const segBpm = changes[i].bpm;
        const segEnd = (i < changes.length - 1) ? changes[i + 1].time : time;

        if (time <= segStart) break;

        const validEnd = Math.min(time, segEnd);
        const durationInSegment = validEnd - segStart;

        if (durationInSegment > 0) {
            const speed = pps * (segBpm / baseBpm);
            y += durationInSegment * speed;
        }

        if (time <= segEnd) break;
    }
    return y;
}

export function yToTime(y) {
    if (y <= 0) return 0;
    const targetY = y; // オフセット分の引き算をなくす
    const changes = getBpmChanges();
    const baseBpm = Number(document.getElementById("bpm").value) || 120;
    const pps = pixelsPerSecond;
    let accumulatedY = 0;

    for (let i = 0; i < changes.length; i++) {
        const segStart = changes[i].time;
        const segBpm = changes[i].bpm;
        const nextStart = (i < changes.length - 1) ? changes[i + 1].time : Infinity;
        
        const speed = pps * (segBpm / baseBpm);
        const segmentDuration = (nextStart === Infinity) ? Infinity : (nextStart - segStart);
        const segmentHeight = (nextStart === Infinity) ? Infinity : (segmentDuration * speed);

        if (targetY <= accumulatedY + segmentHeight || nextStart === Infinity) {
            const diffY = targetY - accumulatedY;
            return segStart + (diffY / speed);
        } else {
            accumulatedY += segmentHeight;
        }
    }
    return 0;
}

export function getMousePosition(event) {
    const rect = timeline.getBoundingClientRect();
    const yFromBottom = rect.height - (event.clientY - rect.top);
    return {
        x: event.clientX - rect.left,
        y: yFromBottom
    };
}

export function snapTimeToGrid(time) {
    const changes = getBpmChanges();
    let currentBpm = 120;
    for (let i = 0; i < changes.length; i++) {
        if (time >= changes[i].time) {
            currentBpm = changes[i].bpm;
        }
    }

    const secPerBeat = 60 / currentBpm;
    const division = Number(document.getElementById("gridDivision").value) || 16;
    const gridInterval = secPerBeat * (4 / division);

    const snappedTime = Math.round(time / gridInterval) * gridInterval;
    return Math.max(0, snappedTime);
}

export function getLaneWidth() {
    if (laneCount <= 4) return 150;
    if (laneCount <= 6) return 120;
    if (laneCount <= 8) return 100;
    if (laneCount <= 12) return 75;
    return 60;
}

export function getLane(x) {
    const width = getLaneWidth();
    return Math.floor(x / width);
}