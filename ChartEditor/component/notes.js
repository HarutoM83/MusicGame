import { NOTE_TYPES } from "./constants.js";
import { state,chart } from "./state.js";
import { dom } from "./dom.js";
import { yToTime } from "./timecalculator.js";
import { renderChart } from "./render.js";

/* =========================================================
   ノーツ追加関数
========================================================= */
export function addSingleNote(type, lane, time) {
    const config = NOTE_TYPES[type];
    const note = { type: type, lane: lane, time: time };
    if (config.defaults) Object.assign(note, config.defaults);
    chart.notes.push(note);
    renderChart();
}

export function addHoldNote(lane, startTime, endTime) {
    chart.notes.push({ type: "hold", lane: lane, startTime: startTime, endTime: endTime });
    renderChart();
}

export function addSlideNote(startLane, endLane, startTime, endTime) {
    chart.notes.push({ type: "slide", startLane: startLane, endLane: endLane, startTime: startTime, endTime: endTime });
    renderChart();
}

export function addBpmChangeAtCurrent() {
    const wrapper = document.getElementById("editorWrapper");
    const viewCenterFromTop = wrapper.scrollTop + (wrapper.clientHeight / 2);
    const targetY = timeline.offsetHeight - viewCenterFromTop;
    
    const time = Math.round(yToTime(Math.max(0, targetY)) * 100) / 100;
    const newBpm = Number(document.getElementById("newBpmInput").value) || 180;

    if (!chart.bpmChanges) chart.bpmChanges = [];
    const existing = chart.bpmChanges.find(b => Math.abs(b.time - time) < 0.05);
    if (existing) {
        existing.bpm = newBpm;
    } else {
        chart.bpmChanges.push({ time: time, bpm: newBpm });
        chart.bpmChanges.sort((a, b) => a.time - b.time);
    }

    renderChart();
}