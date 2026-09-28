/* =========================================================
   ノーツ定義
========================================================= */

const NOTE_TYPES = {
    tap: { name: "通常", color: "#35a9ff", placement: "single" },
    ex: { name: "EX", color: "#ffd83d", placement: "single", defaults: { judgeWindow: 0.15, scoreMultiplierBonus: 0.5 } },
    flick: { name: "フリック", color: "#9d5cff", placement: "single", defaults: { direction: "right" } },
    drag: { name: "ドラッグ", color: "#39e68c", placement: "single" },
    hold: { name: "ホールド", color: "#ff4d91", placement: "range" },
    slide: { name: "スライド", color: "#ff9d3d", placement: "slide" },
    sky: { name: "スカイ", color: "#4de8ff", placement: "single", defaults: { x: 0, y: 0, z: 0 } }
};

/* =========================================================
   ノーツボタンを自動生成
========================================================= */

function createNoteButtons() {
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

function setMode(type) {
    mode = type;
    document.querySelectorAll("#noteButtons button").forEach(button => {
        button.classList.remove("active");
        if (button.dataset.type === type) {
            button.classList.add("active");
        }
    });
}

/* =========================================================
   ノーツ追加関数
========================================================= */

function addSingleNote(type, lane, time) {
    const config = NOTE_TYPES[type];
    const note = { type: type, lane: lane, time: time };
    if (config.defaults) Object.assign(note, config.defaults);
    chart.notes.push(note);
    renderChart();
}

function addHoldNote(lane, startTime, endTime) {
    chart.notes.push({ type: "hold", lane: lane, startTime: startTime, endTime: endTime });
    renderChart();
}

function addSlideNote(startLane, endLane, startTime, endTime) {
    chart.notes.push({ type: "slide", startLane: startLane, endLane: endLane, startTime: startTime, endTime: endTime });
    renderChart();
}

/* =========================================================
   ノーツ描画分岐
========================================================= */

function renderNote(note, index, laneWidth) {
    switch (note.type) {
        case "tap":
            createSingleVisual(note, index, laneWidth, "note-tap");
            break;
        case "ex":
            createSingleVisual(note, index, laneWidth, "note-ex");
            break;
        case "flick":
            createSingleVisual(note, index, laneWidth, "note-flick");
            break;
        case "drag":
            createSingleVisual(note, index, laneWidth, "note-drag");
            break;
        case "hold":
            createHoldVisual(note, index, laneWidth);
            break;
        case "slide":
            createSlideVisual(note, index, laneWidth);
            break;
        case "sky":
            createSkyVisual(note, index, laneWidth);
            break;
    }
}

function createSingleVisual(note, index, laneWidth, className) {
    const element = document.createElement("div");
    element.className = "note " + className;
    element.style.left = (note.lane * laneWidth + 10) + "px";
    element.style.top = timeToY(note.time) + "px";
    element.style.width = (laneWidth - 20) + "px";

    element.onclick = event => {
        event.stopPropagation();
        if (mode === "delete") {
            chart.notes.splice(index, 1);
            renderChart();
            return;
        }
        selectNote(index);
    };
    timeline.appendChild(element);
}

function createHoldVisual(note, index, laneWidth) {
    const element = document.createElement("div");
    element.className = "note note-hold";
    element.style.left = (note.lane * laneWidth + 20) + "px";
    element.style.top = timeToY(note.startTime) + "px";
    element.style.width = (laneWidth - 40) + "px";
    element.style.height = (timeToY(note.endTime) - timeToY(note.startTime)) + "px";

    element.onclick = event => {
        event.stopPropagation();
        if (mode === "delete") {
            chart.notes.splice(index, 1);
            renderChart();
            return;
        }
        selectNote(index);
    };
    timeline.appendChild(element);
}

function createSlideVisual(note, index, laneWidth) {
    const startX = note.startLane * laneWidth + laneWidth / 2;
    const endX = note.endLane * laneWidth + laneWidth / 2;
    const startY = timeToY(note.startTime);
    const endY = timeToY(note.endTime);

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    // 反転環境に合わせて角度の計算も調整
    const angle = -Math.atan2(dy, dx) * 180 / Math.PI;

    const line = document.createElement("div");
    line.className = "slide-line";
    line.style.left = startX + "px";
    line.style.top = startY + "px";
    line.style.width = length + "px";
    line.style.transform = `scaleY(-1) rotate(${angle}deg)`;

    line.onclick = event => {
        event.stopPropagation();
        if (mode === "delete") {
            chart.notes.splice(index, 1);
            renderChart();
        }
    };
    timeline.appendChild(line);

    createSlidePoint(startX, startY, "#ffffff");
    createSlidePoint(endX, endY, "#ff9d3d");
}

function createSlidePoint(x, y, color) {
    const point = document.createElement("div");
    point.className = "slide-point";
    point.style.left = (x - 11) + "px";
    point.style.top = (y - 11) + "px";
    point.style.background = color;
    timeline.appendChild(point);
}

function createSkyVisual(note, index, laneWidth) {
    const element = document.createElement("div");
    element.className = "note note-sky";
    element.style.left = (note.lane * laneWidth + 10) + "px";
    element.style.top = timeToY(note.time) + "px";
    element.style.width = (laneWidth - 20) + "px";

    element.onclick = event => {
        event.stopPropagation();
        if (mode === "delete") {
            chart.notes.splice(index, 1);
            renderChart();
            return;
        }
        selectNote(index);
    };
    timeline.appendChild(element);
}

/* =========================================================
   ノーツ選択・プロパティ
========================================================= */

function selectNote(index) {
    selectedNoteIndex = index;
    showProperties(chart.notes[index]);
}

function showProperties(note) {
    properties.innerHTML = "";
    Object.keys(note).forEach(key => {
        const wrapper = document.createElement("div");
        wrapper.className = "property";

        const label = document.createElement("label");
        label.textContent = key;

        const input = document.createElement("input");
        input.value = note[key];

        input.onchange = () => {
            let value = input.value;
            if (value !== "" && !isNaN(value)) {
                value = Number(value);
            }
            note[key] = value;
            renderChart();
        };

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        properties.appendChild(wrapper);
    });
}