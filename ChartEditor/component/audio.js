//audio.js

import { state,chart } from "./state.js";
import { renderChart } from "./render.js";

/* =========================================================
   音声ファイル読み込み
========================================================= */
export function bindAudioEvents(onRender) {
  const audioFileInput = document.getElementById("audioFileInput");
  const bgmPlayer = document.getElementById("bgmPlayer");
  const songMinutesInput = document.getElementById("songMinutes");
  const songSecondsInput = document.getElementById("songSeconds");

if (!audioFileInput || !bgmPlayer) return;

  audioFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileURL = URL.createObjectURL(file);
    bgmPlayer.src = fileURL;

    const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    const songNameInput = document.getElementById("songName");
    if (songNameInput) {
      songNameInput.value = baseName;
      chart.songName = baseName;
    }
  });

    bgmPlayer.addEventListener("loadedmetadata", () => {
        const totalSeconds = bgmPlayer.duration;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.round(totalSeconds % 60);

        if (songMinutesInput) songMinutesInput.value = minutes;
        if (songSecondsInput) songSecondsInput.value = seconds;

        chart.duration = totalSeconds;
        renderChart();
    });
}