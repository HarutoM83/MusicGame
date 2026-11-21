//drag.js

import { state,chart } from "./state.js";
import { dom } from "./DOM.js";
import { getLane, 
    getMousePosition, 
    snapTimeToGrid, 
    yToTime } from "./timecalculator.js";
import { renderChart } from "./render.js";

/* =========================================================
   ノーツのドラッグ移動（掴んで動かす）機能
========================================================= */

export function bindNoteDragEvents(renderChart) {
  if (!dom.timeline) return;

  dom.timeline.addEventListener("mousemove", (event) => {
    if (state.draggingNoteIndex === null || state.draggingNoteIndex < 0) return;

    const pos = getMousePosition(event);
    const currentLane = getLane(pos.x);
    const currentTime = snapTimeToGrid(yToTime(pos.y));

    const note = state.chart.notes[state.draggingNoteIndex];
    if (!note) return;
    // ノーツの種類や掴んでいる場所に応じた移動処理
    if (
      note.type === "tap" ||
      note.type === "ex" ||
      note.type === "flick" ||
      note.type === "drag" ||
      note.type === "sky" ||
      note.type === "jump"
    ) {
      if (currentLane >= 0 && currentLane < state.laneCount) {
        note.lane = currentLane;
      }
      note.time = Math.max(0, currentTime);
      
// ホールドの場合のドラッグ移動（簡易的に全体を移動、または長さを維持）
    } else if (note.type === "hold") {
      const duration = note.endTime - note.startTime;
      if (currentLane >= 0 && currentLane < state.laneCount) {
        note.lane = currentLane;
      }
      note.startTime = Math.max(0, currentTime);
      note.endTime = note.startTime + Math.max(0.2, duration);
    } 
    // スライドの場合：全体を丸ごと移動するか、始点・終点を動かす
    else if (note.type === "slide") {
      const timeSpan = note.endTime - note.startTime;
      if (currentLane >= 0 && currentLane < state.laneCount) {
        const laneDiff = currentLane - note.startLane;
        note.startLane = Math.max(0, Math.min(state.laneCount - 1, note.startLane + laneDiff));
        note.endLane = Math.max(0, Math.min(state.laneCount - 1, note.endLane + laneDiff));
      }
      note.startTime = Math.max(0, currentTime);
      note.endTime = note.startTime + Math.max(0.2, timeSpan);
    }

    // ドラッグ中にリアルタイム再描画
    renderChart();
  });

  window.addEventListener("mouseup", () => {
    if (state.draggingNoteIndex !== null && state.draggingNoteIndex >= 0) {
      state.draggingNoteIndex = null;
      renderChart();
    }
  });
}




