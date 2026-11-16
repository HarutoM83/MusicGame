// main.js（最小限の変更でつなぐイメージ）
import { state } from "./state.js";
import { createNoteButtons, setMode } from "./mode.js";
import { renderChart } from "./render.js";
import { showProperties } from "./properties.js";
import { bindEvents } from "./event.js";
import { bindNoteDragEvents } from "./drag.js";
import { bindAudioEvents } from "./audio.js";
import { bindStorageEvents, saveJSON, loadJSON } from "./storage.js";
import { bindPlaybackEvents, togglePlay, stopAudio } from "./playback.js";
import { addBpmChangeAtCurrent } from "./notes.js";

function redraw() {
  renderChart({
    onSelectNote: (index) => {
      state.selectedNoteIndex = index;
      const note = state.chart.notes?.[index];
      if (note) showProperties(note, redraw);
    },
    onDeleteNote: (index) => {
      state.chart.notes?.splice(index, 1);
      if (state.selectedNoteIndex === index) state.selectedNoteIndex = -1;
      redraw();
    },
    onStartDragNote: (index) => {
      state.draggingNoteIndex = index;
    },
    onChartMutate: redraw
  });
}

// 既存のHTMLの onclick="..." をそのまま動かすための登録
window.addBpmChangeAtCurrent = () => addBpmChangeAtCurrent(redraw);
window.setMode = setMode;
window.saveJSON = saveJSON;
window.loadJSON = loadJSON;
window.togglePlay = togglePlay;
window.stopAudio = stopAudio;

/* =========================================================
   initial execution
========================================================= */
createNoteButtons();
bindEvents(redraw);
bindNoteDragEvents(redraw);
bindAudioEvents(redraw);
bindStorageEvents(redraw);
bindPlaybackEvents();
redraw();
setMode("tap");