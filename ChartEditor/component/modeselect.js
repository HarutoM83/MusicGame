// modeselect.js
import { NOTE_TYPES } from "./constants.js";
import { state } from "./state.js";
import { dom } from "./DOM.js";

/* =========================================================
   初期化・モード切替
========================================================= */
export function createNoteButtons() {
  const container = dom.noteButtons || document.getElementById("noteButtons");
  if (!container) return;
  container.innerHTML = "";

  Object.keys(NOTE_TYPES).forEach((type) => {
    const config = NOTE_TYPES[type];
    const button = document.createElement("button");
    button.textContent = config.name;
    button.dataset.type = type;
    button.onclick = () => setMode(type);
    container.appendChild(button);
  });
}

export function setMode(type) {
  if (state.mode === type) {
    state.mode = null;
    document.querySelectorAll("#noteButtons button").forEach((button) => {
      button.classList.remove("active");
    });
    return;
  }

  state.mode = type;
  document.querySelectorAll("#noteButtons button").forEach((button) => {
    button.classList.remove("active");
    if (button.dataset.type === type) {
      button.classList.add("active");
    }
  });
}