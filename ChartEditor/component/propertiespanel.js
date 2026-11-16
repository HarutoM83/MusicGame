import { state,chart } from "./state.js";
import { dom } from "./dom.js";
import { renderChart } from "./render.js";

/* =========================================================
   プロパティ設定
========================================================= */
export function selectNote(index) {
    selectedNoteIndex = index;
    showProperties(chart.notes[index]);
}

export function showProperties(note) {
    if (!properties) return;
    properties.innerHTML = `<h3>ノーツ設定 (${note.type.toUpperCase()})</h3>`;

    // 共通項目：レーン（単体・ホールド・ジャンプなど）
    if (note.lane !== undefined) {
        addPropertyInput("レーン (0〜)", note.lane, (val) => {
            let laneVal = Number(val);
            if (!isNaN(laneVal) && laneVal >= 0 && laneVal < laneCount) {
                note.lane = laneVal;
                renderChart();
            }
        });
    }

    // スライド専用：開始レーン・終了レーン
    if (note.startLane !== undefined) {
        addPropertyInput("開始レーン", note.startLane, (val) => {
            let v = Number(val);
            if (!isNaN(v) && v >= 0 && v < laneCount) {
                note.startLane = v;
                renderChart();
            }
        });
    }
    if (note.endLane !== undefined) {
        addPropertyInput("終了レーン", note.endLane, (val) => {
            let v = Number(val);
            if (!isNaN(v) && v >= 0 && v < laneCount) {
                note.endLane = v;
                renderChart();
            }
        });
    }

    // 時間項目：単体ノーツ (time)
    if (note.time !== undefined) {
        addPropertyInput("時間 (秒)", note.time, (val) => {
            let t = Number(val);
            if (!isNaN(t) && t >= 0) {
                note.time = t;
                renderChart();
            }
        }, "0.001");
    }

    // 時間項目：ホールド・スライドなど (startTime / endTime)
    if (note.startTime !== undefined) {
        addPropertyInput("開始時間 (秒)", note.startTime, (val) => {
            let t = Number(val);
            if (!isNaN(t) && t >= 0) {
                note.startTime = t;
                renderChart();
            }
        }, "0.001");
    }
    if (note.endTime !== undefined) {
        addPropertyInput("終了時間 (秒)", note.endTime, (val) => {
            let t = Number(val);
            if (!isNaN(t) && t >= 0) {
                note.endTime = t;
                renderChart();
            }
        }, "0.001");
    }

    // ホールドやスライドの「終点判定の有無」設定
    if (note.type === "hold" || note.type === "slide") {
        const endJudgeWrapper = document.createElement("div");
        endJudgeWrapper.className = "property";

        const label = document.createElement("label");
        label.textContent = "終点判定あり";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.style.width = "auto";
        checkbox.checked = !!note.hasEndJudge;

        checkbox.onchange = () => {
            note.hasEndJudge = checkbox.checked;
            renderChart();
        };

        endJudgeWrapper.appendChild(label);
        endJudgeWrapper.appendChild(checkbox);
        properties.appendChild(endJudgeWrapper);

        // 終点をジャンプノーツにするかどうかの設定
        const endTypeWrapper = document.createElement("div");
        endTypeWrapper.className = "property";

        const endTypeLabel = document.createElement("label");
        endTypeLabel.textContent = "終点タイプ (通常 / ジャンプ)";

        const endTypeSelect = document.createElement("select");
        endTypeSelect.style.width = "100%";
        endTypeSelect.style.background = "#333";
        endTypeSelect.style.color = "white";
        endTypeSelect.style.border = "1px solid #555";
        endTypeSelect.style.padding = "7px";

        const endTypes = [
            { value: "normal", label: "通常終点" },
            { value: "jump", label: "ジャンプ終点" }
        ];

        endTypes.forEach(et => {
            const opt = document.createElement("option");
            opt.value = et.value;
            opt.textContent = et.label;
            if ((note.endType || "normal") === et.value) opt.selected = true;
            endTypeSelect.appendChild(opt);
        });

        endTypeSelect.onchange = () => {
            note.endType = endTypeSelect.value;
            if (note.endType === "jump" && !note.endDirection) {
                note.endDirection = "up"; // デフォルトのジャンプ方向
            }
            renderChart();
        };

        endTypeWrapper.appendChild(endTypeLabel);
        endTypeWrapper.appendChild(endTypeSelect);
        properties.appendChild(endTypeWrapper);

        // もし終点がジャンプの場合、方向のセレクトボックスも表示
        if (note.endType === "jump") {
            const dirWrapper = document.createElement("div");
            dirWrapper.className = "property";
            dirWrapper.innerHTML = `<label>終点ジャンプ方向</label>`;
            
            const dirSelect = document.createElement("select");
            dirSelect.style.width = "100%";
            dirSelect.style.background = "#333";
            dirSelect.style.color = "white";
            dirSelect.style.border = "1px solid #555";
            dirSelect.style.padding = "7px";

            const directions = [
                { value: "up", label: "上 (UP)" },
                { value: "upleft", label: "左上 (UP-LEFT)" },
                { value: "upright", label: "右上 (UP-RIGHT)" },
                { value: "down", label: "下 (DOWN)" },
                { value: "downleft", label: "左下 (DOWN-LEFT)" },
                { value: "downright", label: "右下 (DOWN-RIGHT)" }
            ];

            directions.forEach(dir => {
                const opt = document.createElement("option");
                opt.value = dir.value;
                opt.textContent = dir.label;
                if ((note.endDirection || "up") === dir.value) opt.selected = true;
                dirSelect.appendChild(opt);
            });

            dirSelect.onchange = () => {
                note.endDirection = dirSelect.value;
                renderChart();
            };

            dirWrapper.appendChild(dirSelect);
            properties.appendChild(dirWrapper);
        }
    }

    // 方向指定を持つノーツ（ジャンプノーツなど）の場合のセレクトボックス
    if (note.direction !== undefined) {
        const wrapper = document.createElement("div");
        wrapper.className = "property";

        const label = document.createElement("label");
        label.textContent = "方向 (direction)";

        const select = document.createElement("select");
        select.style.width = "100%";
        select.style.background = "#333";
        select.style.color = "white";
        select.style.border = "1px solid #555";
        select.style.padding = "7px";

        const directions = [
            { value: "up", label: "上 (UP)" },
            { value: "upleft", label: "左上 (UP-LEFT)" },
            { value: "upright", label: "右上 (UP-RIGHT)" },
            { value: "down", label: "下 (DOWN)" },
            { value: "downleft", label: "左下 (DOWN-LEFT)" },
            { value: "downright", label: "右下 (DOWN-RIGHT)" }
        ];

        directions.forEach(dir => {
            const option = document.createElement("option");
            option.value = dir.value;
            option.textContent = dir.label;
            if (note.direction === dir.value) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.onchange = () => {
            note.direction = select.value;
            renderChart(); // 変更時にタイムラインの矢印を即座に再描画
        };

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        properties.appendChild(wrapper);
    }

    // フリック・スカイの場合のEX属性切り替えチェックボックス
    if (note.type !== "flick" && note.type !== "sky" && note.type !== "hold" && note.type !== "slide") {
        const exWrapper = document.createElement("div");
        exWrapper.className = "property";

        const exLabel = document.createElement("label");
        exLabel.textContent = "EX属性";

        const exCheckbox = document.createElement("input");
        exCheckbox.type = "checkbox";
        exCheckbox.style.width = "auto";
        exCheckbox.checked = !!note.isEx;

        exCheckbox.onchange = () => {
            note.isEx = exCheckbox.checked;
            renderChart();
        };

        exWrapper.appendChild(exLabel);
        exWrapper.appendChild(exCheckbox);
        properties.appendChild(exWrapper);
    }
}

// プロパティ用の入力欄を簡単に追加するヘルパー関数（既存にある場合は不要）
export function addPropertyInput(labelText, value, callback, step = "1") {
    const wrapper = document.createElement("div");
    wrapper.className = "property";

    const label = document.createElement("label");
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = "number";
    input.step = step;
    input.value = value;

    input.onchange = () => {
        callback(input.value);
    };

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    properties.appendChild(wrapper);
}