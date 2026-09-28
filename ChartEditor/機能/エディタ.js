
/* =========================================================
   基本設定
========================================================= */
let pixelsPerSecond = 100;
let laneCount = 8;
let mode = "tap";
let selectedNoteIndex = -1;
let dragStart = null;

/* =========================================================
   譜面データ
========================================================= */

let chart = {
    songName: "MySong",
    bpm: 120,
    timeNumerator: 4,
    timeDenominator: 4,
    laneCount: 8,
    duration: 120,
    bpmChanges: [],
    notes: []
};

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
   HTML要素
========================================================= */

const timeline = document.getElementById("timeline");
const noteButtons = document.getElementById("noteButtons");
const laneCountInput = document.getElementById("laneCount");
const properties = document.getElementById("properties");

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
   時間変換（ソフラン対応）拍子・小節の計算
========================================================= */

function getTimeSignature() {
    const num = Number(document.getElementById("timeNumerator").value) || 4;
    const den = Number(document.getElementById("timeDenominator").value) || 4;
    return num * (4 / den);
}

function getBeatPerMeasure() {
    return getTimeSignature();
}

function getBpmChanges() {
    if (chart.bpmChanges && chart.bpmChanges.length > 0) {
        return [...chart.bpmChanges].sort((a, b) => a.time - b.time);
    }
    const currentBpm = Number(document.getElementById("bpm").value) || 120;
    return [{ time: 0, bpm: currentBpm }];
}

function timeToY(time) {
    let y = 30;
    let changes = getBpmChanges();
    if (changes[0].time > 0) {
        changes.unshift({ time: 0, bpm: changes[0].bpm });
    }

    let baseBpm = 120;
    let pps = pixelsPerSecond;

    for (let i = 0; i < changes.length; i++) {
        let start = changes[i].time;
        let bpm = changes[i].bpm;
        let end = (i < changes.length - 1) ? changes[i + 1].time : time;

        if (time <= start) break;

        let span = Math.min(time, end) - start;
        if (span > 0) {
            y += span * pps * (bpm / baseBpm);
        }
    }
    return y;
}

function yToTime(y) {
    if (y <= 30) return 0;
    let targetY = y - 30;
    let changes = getBpmChanges();
    if (changes[0].time > 0) {
        changes.unshift({ time: 0, bpm: changes[0].bpm });
    }

    let baseBpm = 120;
    let pps = pixelsPerSecond;
    let currentTime = 0;
    let currentY = 0;

    for (let i = 0; i < changes.length; i++) {
        let start = changes[i].time;
        let bpm = changes[i].bpm;
        let nextStart = (i < changes.length - 1) ? changes[i + 1].time : Infinity;
        
        let speed = pps * (bpm / baseBpm);
        let startTimeY = currentY;
        let maxSpan = nextStart === Infinity ? Infinity : (nextStart - start);
        let maxSegmentY = startTimeY + maxSpan * speed;

        if (targetY <= maxSegmentY) {
            let diffY = targetY - startTimeY;
            return start + (diffY / speed);
        } else {
            currentY = maxSegmentY;
            currentTime = nextStart;
        }
    }
    return currentTime;
}

/* =========================================================
   グリッドスナップ関数
========================================================= */

function snapTimeToGrid(time) {
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

/* =========================================================
   レーン取得
========================================================= */

function getLaneWidth() {
    if (laneCount <= 4) return 150;
    if (laneCount <= 6) return 120;
    if (laneCount <= 8) return 100;
    if (laneCount <= 12) return 75;
    return 60;
}

function getLane(x) {
    const width = getLaneWidth();
    return Math.floor(x / width);
}

function getMousePosition(event) {
    const rect = timeline.getBoundingClientRect();
    // scaleY(-1) がかかっているため、Y座標を反転させる
    const invertedY = rect.height - (event.clientY - rect.top);
    return {
        x: event.clientX - rect.left,
        y: invertedY
    };
}

/* =========================================================
   タイムライン イベント
========================================================= */

timeline.addEventListener("mousedown", event => {
    const pos = getMousePosition(event);
    const lane = getLane(pos.x);

    if (lane < 0 || lane >= laneCount) return;
    if (mode === "delete") return;

    const config = NOTE_TYPES[mode];
    if (!config) return;

    const snappedTime = snapTimeToGrid(yToTime(pos.y));

    if (config.placement === "single") {
        addSingleNote(mode, lane, snappedTime);
    }
    if (config.placement === "range" || config.placement === "slide") {
        dragStart = { lane: lane, time: snappedTime };
    }
});

timeline.addEventListener("mouseup", event => {
    if (dragStart === null) return;

    const pos = getMousePosition(event);
    const endLane = getLane(pos.x);
    const endTime = snapTimeToGrid(yToTime(pos.y));

    if (mode === "hold" && endTime > dragStart.time) {
        addHoldNote(dragStart.lane, dragStart.time, endTime);
    }
    if (mode === "slide" && endTime > dragStart.time && endLane >= 0 && endLane < laneCount) {
        addSlideNote(dragStart.lane, endLane, dragStart.time, endTime);
    }
    dragStart = null;
});

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
   BPM変更（ソフラン）追加
========================================================= */

function addBpmChangeAtCurrent() {
    const wrapper = document.getElementById("editorWrapper");
    // 上下反転しているため、スクロール位置に応じた目標Y座標を計算
    const targetY = timeline.offsetHeight - wrapper.scrollTop - wrapper.clientHeight + 40;
    const time = Math.round(yToTime(Math.max(0, targetY)) * 100) / 100;

    const newBpm = Number(document.getElementById("newBpmInput").value) || 180;

    const existing = chart.bpmChanges.find(b => Math.abs(b.time - time) < 0.05);
    if (existing) {
        existing.bpm = newBpm;
    } else {
        chart.bpmChanges.push({ time: time, bpm: newBpm });
        chart.bpmChanges.sort((a, b) => a.time - b.time);
    }

    renderChart();
}

/* =========================================================
   譜面描画
========================================================= */

function renderChart() {
    timeline.querySelectorAll(".note, .slide-line, .slide-point, .measureLine, .beatLine, .laneLine, .timeLabel, .bpmChangeLine, .bpmChangeLabel, .gridSubLine").forEach(el => el.remove());

    const laneWidth = getLaneWidth();
    const timelineWidth = laneWidth * laneCount;
    timeline.style.width = timelineWidth + "px";

    const minutes = Number(document.getElementById("songMinutes").value) || 0;
    const seconds = Number(document.getElementById("songSeconds").value) || 0;
    const totalSeconds = (minutes * 60) + seconds;
    const maxTime = Math.max(10, totalSeconds);

    timeline.style.height = timeToY(maxTime) + 50 + "px";

    for (let i = 0; i <= laneCount; i++) {
        const laneLine = document.createElement("div");
        laneLine.className = "laneLine";
        laneLine.style.left = (i * laneWidth) + "px";
        timeline.appendChild(laneLine);
    }

    const changes = getBpmChanges();
    if (changes[0].time > 0) changes.unshift({ time: 0, bpm: changes[0].bpm });

    const division = Number(document.getElementById("gridDivision").value) || 16;

    for (let i = 0; i < changes.length; i++) {
        let segStart = changes[i].time;
        let segBpm = changes[i].bpm;
        let segEnd = (i < changes.length - 1) ? changes[i + 1].time : maxTime;

        let secPerBeat = 60 / segBpm;
        let secPerMeasure = secPerBeat * getBeatPerMeasure();
        let gridInterval = secPerBeat * (4 / division);

        let t = segStart;
        while (t <= segEnd && t <= maxTime) {
            const y = timeToY(t);
            
            const isMeasureStart = Math.abs((t % secPerMeasure)) < 0.01 || Math.abs(t - segStart) < 0.001;
            const isBeatStart = Math.abs((t % secPerBeat)) < 0.01;

            const line = document.createElement("div");
            
            if (isMeasureStart) {
                line.className = "measureLine";
            } else if (isBeatStart) {
                line.className = "beatLine";
            } else {
                line.className = "gridSubLine";
            }

            line.style.top = y + "px";
            line.style.width = timelineWidth + "px";
            timeline.appendChild(line);

            if (isMeasureStart) {
                const label = document.createElement("div");
                label.className = "timeLabel";
                label.style.top = (y - 8) + "px";
                let measureNum = Math.round(t / secPerMeasure) + 1;
                label.textContent = `${measureNum}小節`;
                timeline.appendChild(label);
            }
            
            t += gridInterval;
        }
    }

    if (chart.bpmChanges && chart.bpmChanges.length > 0) {
        chart.bpmChanges.forEach((change) => {
            const y = timeToY(change.time);
            
            const bpmLine = document.createElement("div");
            bpmLine.className = "bpmChangeLine";
            bpmLine.style.top = y + "px";
            bpmLine.style.width = timelineWidth + "px";
            timeline.appendChild(bpmLine);

            const bpmLabel = document.createElement("div");
            bpmLabel.className = "bpmChangeLabel";
            bpmLabel.style.top = (y - 8) + "px";
            bpmLabel.textContent = `▶ BPM ${change.bpm} (${change.time.toFixed(1)}秒)`;
            
            bpmLabel.onclick = () => {
                if (confirm(`秒数 ${change.time.toFixed(1)} のBPM変更を削除しますか？`)) {
                    chart.bpmChanges = chart.bpmChanges.filter(b => b.time !== change.time);
                    renderChart();
                }
            };
            timeline.appendChild(bpmLabel);
        });
    }

    chart.notes.forEach((note, index) => {
        renderNote(note, index, laneWidth);
    });
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

/* =========================================================
   イベント・設定変更の紐付け
========================================================= */

laneCountInput.onchange = () => {
    laneCount = Number(laneCountInput.value);
    chart.laneCount = laneCount;
    renderChart();
};

document.getElementById("bpm").onchange = renderChart;
document.getElementById("timeNumerator").onchange = renderChart;
document.getElementById("timeDenominator").onchange = renderChart;
document.getElementById("songMinutes").onchange = renderChart;
document.getElementById("songSeconds").onchange = renderChart;
document.getElementById("gridDivision").onchange = renderChart;

/* =========================================================
   JSON保存・読み込み
========================================================= */

function saveJSON() {
    chart.songName = document.getElementById("songName").value;
    chart.bpm = Number(document.getElementById("bpm").value);
    chart.timeNumerator = Number(document.getElementById("timeNumerator").value) || 4;
    chart.timeDenominator = Number(document.getElementById("timeDenominator").value) || 4;
    chart.laneCount = laneCount;

    const minutes = Number(document.getElementById("songMinutes").value) || 0;
    const seconds = Number(document.getElementById("songSeconds").value) || 0;
    chart.duration = (minutes * 60) + seconds;

    const json = JSON.stringify(chart, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = chart.songName + ".json";
    a.click();
    URL.revokeObjectURL(url);
}

function loadJSON() {
    document.getElementById("fileInput").click();
}

document.getElementById("fileInput").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        chart = JSON.parse(reader.result);

        laneCount = chart.laneCount || 4;
        laneCountInput.value = laneCount;

        document.getElementById("songName").value = chart.songName || "MySong";
        document.getElementById("bpm").value = chart.bpm || 120;
        document.getElementById("timeNumerator").value = chart.timeNumerator || 4;
        document.getElementById("timeDenominator").value = chart.timeDenominator || 4;

        const totalSec = chart.duration || 120;
        document.getElementById("songMinutes").value = Math.floor(totalSec / 60);
        document.getElementById("songSeconds").value = totalSec % 60;

        renderChart();
    };
    reader.readAsText(file);
});

/* =========================================================
   初期化
========================================================= */

createNoteButtons();
renderChart();
setMode("tap");
