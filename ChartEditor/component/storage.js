//storage.js

import { state,chart } from "./state.js";
import { dom } from "./DOM.js";
import { renderChart } from "./render.js";

/* =========================================================
   JSON保存・読み込み
========================================================= */
export function saveJSON() {
    chart.songName = document.getElementById("songName").value;
    chart.bpm = Number(document.getElementById("bpm").value);
    chart.timeNumerator = Number(document.getElementById("timeNumerator").value) || 4;
    chart.timeDenominator = Number(document.getElementById("timeDenominator").value) || 4;
    chart.laneCount = laneCount;

    const minutes = Number(document.getElementById("songMinutes").value) || 0;
    const seconds = Number(document.getElementById("songSeconds").value) || 0;
    chart.duration = (minutes * 60) + seconds;
    chart.maxPossibleCombo = chart.notes.length;

    const json = JSON.stringify(chart, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = chart.songName + ".json";
    a.click();
    URL.revokeObjectURL(url);
}

export function loadJSON() {
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.click();
}

export function bindStorageEvents(renderChartr) {
  const fileInputEl = document.getElementById("fileInput");
  const songMinutesInput = document.getElementById("songMinutes");
  const songSecondsInput = document.getElementById("songSeconds");
    if (!fileInputEl) return;

        fileInputEl.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
        const parsed = JSON.parse(reader.result);
        state.chart = parsed;
        state.laneCount = parsed.laneCount || 4;
        if (dom.laneCountInput) dom.laneCountInput.value = state.laneCount;

        const songNameEl = document.getElementById("songName");
        const bpmEl = document.getElementById("bpm");
        const numEl = document.getElementById("timeNumerator");
        const denEl = document.getElementById("timeDenominator");

        if (songNameEl) songNameEl.value = parsed.songName || "MySong";
        if (bpmEl) bpmEl.value = parsed.bpm || 120;
        if (numEl) numEl.value = parsed.timeNumerator || 4;
        if (denEl) denEl.value = parsed.timeDenominator || 4;

        const totalSec = parsed.duration || 120;
        if (songMinutesInput) songMinutesInput.value = Math.floor(totalSec / 60);
        if (songSecondsInput) songSecondsInput.value = totalSec % 60;

        renderChart();
        };
        reader.readAsText(file);
    });
}