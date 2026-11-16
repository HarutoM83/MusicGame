import { NOTE_TYPES } from "./constants.js";
import { state,chart } from "./state.js";
import { dom } from "./dom.js";

/* =========================================================
   初期化・モード切替
========================================================= */
export function createNoteButtons() {
    if (!noteButtons) return;
    noteButtons.innerHTML = "";
    Object.keys(NOTE_TYPES).forEach(type => {
        const config = NOTE_TYPES[type];
        const button = document.createElement("button");
        button.textContent = config.name;
        button.dataset.type = type;
        button.onclick = () => setMode(type);
        noteButtons.appendChild(button);
    });
}

export function setMode(type) {
    //「すでに選択されているモード」をもう一度クリックした場合は解除（キャンセル）する
    if (state.mode === type) {
        state.mode = null; // または "none" など、配置できないモードにする
        document.querySelectorAll("#noteButtons button").forEach(button => {
            button.classList.remove("active");
        });
        return;
    }

    state.mode = type;
    document.querySelectorAll("#noteButtons button").forEach(button => {
        button.classList.remove("active");
        if (button.dataset.type === type) {
            button.classList.add("active");
        }
    });
}