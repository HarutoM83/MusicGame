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
    flick: { name: "フリック", color: "#9d5cff", placement: "single", defaults: { direction: "right" } },
    drag: { name: "ドラッグ", color: "#39e68c", placement: "single" },
    hold: { name: "ホールド", color: "#ff4d91", placement: "range" },
    slide: { name: "スライド", color: "#ff9d3d", placement: "slide" },
    sky: { name: "スカイ", color: "#4de8ff", placement: "single", defaults: { x: 0, y: 0, z: 0 } },
    jump: { name: "ジャンプ", color: "#ff2a85", placement: "single", defaults: { direction: "up" } }
};

/* =========================================================
   HTML要素
========================================================= */
const timeline = document.getElementById("timeline");
const noteButtons = document.getElementById("noteButtons");
const laneCountInput = document.getElementById("laneCount");
const properties = document.getElementById("properties");

/* =========================================================
   初期化・モード切替
========================================================= */
function createNoteButtons() {
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

function setMode(type) {
    // 【追加】もし「すでに選択されているモード」をもう一度クリックした場合は解除（キャンセル）する
    if (mode === type) {
        mode = null; // または "none" など、配置できないモードにする
        document.querySelectorAll("#noteButtons button").forEach(button => {
            button.classList.remove("active");
        });
        return;
    }

    mode = type;
    document.querySelectorAll("#noteButtons button").forEach(button => {
        button.classList.remove("active");
        if (button.dataset.type === type) {
            button.classList.add("active");
        }
    });
}

/* =========================================================
   時間変換・ソフラン計算
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
    let baseBpm = Number(document.getElementById("bpm").value) || 120;
    let changes = chart.bpmChanges ? [...chart.bpmChanges] : [];
    
    if (!changes.some(b => Math.abs(b.time) < 0.001)) {
        changes.unshift({ time: 0, bpm: baseBpm });
    }
    return changes.sort((a, b) => a.time - b.time);
}

function timeToY(time) {
    let y = 30; // 下部余白
    let changes = getBpmChanges();
    let baseBpm = Number(document.getElementById("bpm").value) || 120;
    let pps = pixelsPerSecond;

    for (let i = 0; i < changes.length; i++) {
        let segStart = changes[i].time;
        let segBpm = changes[i].bpm;
        let segEnd = (i < changes.length - 1) ? changes[i + 1].time : time;

        if (time <= segStart) break;

        let validEnd = Math.min(time, segEnd);
        let durationInSegment = validEnd - segStart;

        if (durationInSegment > 0) {
            let speed = pps * (segBpm / baseBpm);
            y += durationInSegment * speed;
        }

        if (time <= segEnd) break;
    }
    return y;
}

function yToTime(y) {
    if (y <= 30) return 0;
    let targetY = y - 30;
    let changes = getBpmChanges();
    let baseBpm = Number(document.getElementById("bpm").value) || 120;
    let pps = pixelsPerSecond;
    let accumulatedY = 0;

    for (let i = 0; i < changes.length; i++) {
        let segStart = changes[i].time;
        let segBpm = changes[i].bpm;
        let nextStart = (i < changes.length - 1) ? changes[i + 1].time : Infinity;
        
        let speed = pps * (segBpm / baseBpm);
        let segmentDuration = (nextStart === Infinity) ? Infinity : (nextStart - segStart);
        let segmentHeight = (nextStart === Infinity) ? Infinity : (segmentDuration * speed);

        if (targetY <= accumulatedY + segmentHeight || nextStart === Infinity) {
            let diffY = targetY - accumulatedY;
            return segStart + (diffY / speed);
        } else {
            accumulatedY += segmentHeight;
        }
    }
    return 0;
}

function getMousePosition(event) {
    const rect = timeline.getBoundingClientRect();
    const yFromBottom = rect.height - (event.clientY - rect.top);
    return {
        x: event.clientX - rect.left,
        y: yFromBottom
    };
}

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

/* =========================================================
   タイムライン イベント
========================================================= */
if (timeline) {
    // タイムラインの mousedown イベント内
    timeline.addEventListener("mousedown", event => {
        // 【重要】modeがnull、または "delete" のときはノーツを新しく配置しない
        if (!mode || mode === "delete") return;

        const pos = getMousePosition(event);
        const lane = getLane(pos.x);

        if (lane < 0 || lane >= laneCount) return;

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

    // タイムラインの mouseup イベント内
    timeline.addEventListener("mouseup", event => {
        // 【追加】モードが解除されている（null）か、削除モードなら何もしない
        if (!mode || mode === "delete") return;
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

function addBpmChangeAtCurrent() {
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

/* =========================================================
   譜面描画（誤差蓄積を完全排除した小節・グリッド描画版）
========================================================= */
function renderChart() {
    if (!timeline) return;
    timeline.querySelectorAll(".note, .slide-line, .slide-point, .measureLine, .beatLine, .laneLine, .timeLabel, .bpmChangeLine, .bpmChangeLabel, .gridSubLine").forEach(el => el.remove());

    const laneWidth = getLaneWidth();
    const timelineWidth = laneWidth * laneCount;
    timeline.style.width = timelineWidth + "px";

    const minutes = Number(document.getElementById("songMinutes").value) || 2;
    const seconds = Number(document.getElementById("songSeconds").value) || 0;
    const totalSeconds = (minutes * 60) + seconds;
    const maxTime = Math.max(30, totalSeconds);

    timeline.style.height = timeToY(maxTime) + 100 + "px";

    // レーン線の描画
    for (let i = 0; i <= laneCount; i++) {
        const laneLine = document.createElement("div");
        laneLine.className = "laneLine";
        laneLine.style.left = (i * laneWidth) + "px";
        timeline.appendChild(laneLine);
    }

    const changes = getBpmChanges();
    const division = Number(document.getElementById("gridDivision").value) || 16;
    const beatsPerMeasure = getBeatPerMeasure();

    // 各BPMセグメントごとに処理
    for (let i = 0; i < changes.length; i++) {
        let segStart = changes[i].time;
        let segBpm = changes[i].bpm;
        let segEnd = (i < changes.length - 1) ? changes[i + 1].time : maxTime;

        let secPerBeat = 60 / segBpm;
        let secPerMeasure = secPerBeat * beatsPerMeasure;
        let subInterval = secPerBeat * (4 / division);
        let subsPerMeasure = Math.round(secPerMeasure / subInterval);

        // このセグメントが含まれる小節の範囲を算出
        let startMeasure = Math.floor(segStart / secPerMeasure);
        let endMeasure = Math.ceil(segEnd / secPerMeasure);

        for (let m = startMeasure; m <= endMeasure; m++) {
            let measureStartTime = m * secPerMeasure;

            // この小節内の各グリッド位置を整数倍で計算（誤差を出さない）
            for (let sub = 0; sub < subsPerMeasure; sub++) {
                let t = measureStartTime + (sub * subInterval);

                // セグメントの範囲内、かつ maxTime 以内であれば描画
                if (t >= segStart - 0.0001 && t < segEnd && t <= maxTime) {
                    const y = timeToY(t);

                    let isMeasureStart = (sub === 0);
                    let isBeatStart = (sub % (division / 4) === 0);

                    if (isMeasureStart) {
                        const measureLine = document.createElement("div");
                        measureLine.className = "measureLine";
                        measureLine.style.bottom = y + "px";
                        measureLine.style.width = timelineWidth + "px";
                        timeline.appendChild(measureLine);

                        const label = document.createElement("div");
                        label.className = "timeLabel";
                        label.style.bottom = (y - 8) + "px";
                        label.textContent = `${m + 1}小節`;
                        timeline.appendChild(label);
                    } else if (isBeatStart) {
                        const beatLine = document.createElement("div");
                        beatLine.className = "beatLine";
                        beatLine.style.bottom = y + "px";
                        beatLine.style.width = timelineWidth + "px";
                        timeline.appendChild(beatLine);
                    } else {
                        const subLine = document.createElement("div");
                        subLine.className = "gridSubLine";
                        subLine.style.bottom = y + "px";
                        subLine.style.width = timelineWidth + "px";
                        timeline.appendChild(subLine);
                    }
                }
            }
        }
    }

    // BPM変更ラインの描画
    if (chart.bpmChanges && chart.bpmChanges.length > 0) {
        chart.bpmChanges.forEach((change) => {
            const y = timeToY(change.time);
            
            const bpmLine = document.createElement("div");
            bpmLine.className = "bpmChangeLine";
            bpmLine.style.bottom = y + "px";
            bpmLine.style.width = timelineWidth + "px";
            timeline.appendChild(bpmLine);

            const bpmLabel = document.createElement("div");
            bpmLabel.className = "bpmChangeLabel";
            bpmLabel.style.bottom = (y - 8) + "px";
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

    // ノーツの描画
    if (chart.notes && chart.notes.length > 0) {
        chart.notes.forEach((note, index) => {
            renderNote(note, index, laneWidth);
        });
    }
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
            createDirectionalVisual(note, index, laneWidth, "note-flick");
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
        case "jump":
            createJumpVisual(note, index, laneWidth);
            break;
    }
}

function createSingleVisual(note, index, laneWidth, className) {
    const element = document.createElement("div");
    element.className = "note " + className;
    element.style.left = (note.lane * laneWidth + 10) + "px";
    element.style.bottom = timeToY(note.time) + "px";
    element.style.width = (laneWidth - 20) + "px";
    
    // 【追加】isExがtrueの場合、見た目をEX風（金色・光沢）に上書きする
    if (note.isEx) {
        element.style.background = "#ffd83d";
        element.style.border = "2px solid #fff";
        element.style.boxShadow = "0 0 8px #ffd83d";
    }

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
    element.style.bottom = timeToY(note.startTime) + "px";
    element.style.width = (laneWidth - 40) + "px";
    element.style.height = (timeToY(note.endTime) - timeToY(note.startTime)) + "px";

    if (note.isEx) {
        element.style.background = "#ffd83d";
        element.style.border = "2px solid #fff";
        element.style.boxShadow = "0 0 8px #ffd83d";
    }

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
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const line = document.createElement("div");
    line.className = "slide-line";
    line.style.left = startX + "px";
    line.style.bottom = startY + "px";
    line.style.width = length + "px";
    line.style.transformOrigin = "0 50%";
    line.style.transform = `rotate(${angle}deg)`;

    if (note.isEx) {
            element.style.background = "#ffd83d";
            element.style.border = "2px solid #fff";
            element.style.boxShadow = "0 0 8px #ffd83d";
        }


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
    point.style.bottom = (y - 11) + "px";
    point.style.background = color;
    timeline.appendChild(point);
}

function createSkyVisual(note, index, laneWidth) {
    const element = document.createElement("div");
    element.className = "note note-sky";
    element.style.left = (note.lane * laneWidth + 10) + "px";
    element.style.bottom = timeToY(note.time) + "px";
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

function createJumpVisual(note, index, laneWidth) {
    const element = document.createElement("div");
    element.className = "note";
    element.style.left = (note.lane * laneWidth + 10) + "px";
    element.style.bottom = timeToY(note.time) + "px";
    element.style.width = (laneWidth - 20) + "px";
    
    element.style.height = "24px";
    element.style.borderRadius = "5px";
    element.style.border = "2px solid white";

    // 【追加】方向ごとの色と矢印の設定
    let arrow = "↑";
    let noteColor = "#39ff14"; 
    let glowColor = "#39ff14";

    switch (note.direction) {
        //上方向
        case "up":
            arrow = "↑";
            noteColor = "#39ff14"; 
            glowColor = "#39ff14";
            break;
        case "upleft":
            arrow = "↖";
            noteColor = "#39ff14"; 
            glowColor = "#39ff14";
            break;
        case "upright":
            arrow = "↗";
            noteColor = "#39ff14"; 
            glowColor = "#39ff14";
            break;
        //下方向
        case "down":
            arrow = "↓";
            noteColor = "#ff2a85";
            glowColor = "#ff2a85";
            break;
        case "downleft":
            arrow = "↙";
            noteColor = "#ff2a85";
            glowColor = "#ff2a85";
            break;
        case "downright":
            arrow = "↘";
            noteColor = "#ff2a85";
            glowColor = "#ff2a85";
            break;
        //左右
        case "left":
            arrow = "←";
            noteColor = "#00e1ff";
            glowColor = "#00e1ff";
            break;
        case "right":
            arrow = "→";
            noteColor = "#ff9d3d";
            glowColor = "#ff9d3d";
            break;
    }

    // 決定した色を適用
    element.style.background = noteColor;
    element.style.boxShadow = `0 0 10px ${glowColor}, 0 0 20px ${glowColor}`;

    element.textContent = arrow;
    element.style.textAlign = "center";
    element.style.lineHeight = "20px";
    element.style.fontWeight = "bold";
    element.style.color = "white";

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
   プロパティ設定
========================================================= */
function selectNote(index) {
    selectedNoteIndex = index;
    showProperties(chart.notes[index]);
}

function showProperties(note) {
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

    // 【追加】方向指定を持つノーツ（ジャンプノーツなど）の場合のセレクトボックス
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
            { value: "downright", label: "右下 (DOWN-RIGHT)" },
            { value: "left", label: "左 (LEFT)" },
            { value: "right", label: "右 (RIGHT)" }
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

    // フリック・スカイ・ジャンプ以外の場合のEX属性切り替えチェックボックス
    if (note.type !== "flick" && note.type !== "sky" && note.type !== "jump" && note.type !== "hold" && note.type !== "slide") {
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
function addPropertyInput(labelText, value, callback, step = "1") {
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

/* =========================================================
   イベントリスナー紐付け
========================================================= */
if (laneCountInput) {
    laneCountInput.onchange = () => {
        laneCount = Number(laneCountInput.value);
        chart.laneCount = laneCount;
        renderChart();
    };
}

["bpm", "timeNumerator", "timeDenominator", "songMinutes", "songSeconds", "gridDivision"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onchange = renderChart;
});

/* =========================================================
   音声ファイル読み込み
========================================================= */
const audioFileInput = document.getElementById("audioFileInput");
const bgmPlayer = document.getElementById("bgmPlayer");
const songMinutesInput = document.getElementById("songMinutes");
const songSecondsInput = document.getElementById("songSeconds");

if (audioFileInput && bgmPlayer) {
    audioFileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const fileURL = URL.createObjectURL(file);
        bgmPlayer.src = fileURL;

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
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

function loadJSON() {
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.click();
}

const fileInputEl = document.getElementById("fileInput");
if (fileInputEl) {
    fileInputEl.addEventListener("change", event => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            chart = JSON.parse(reader.result);
            laneCount = chart.laneCount || 4;
            if (laneCountInput) laneCountInput.value = laneCount;

            document.getElementById("songName").value = chart.songName || "MySong";
            document.getElementById("bpm").value = chart.bpm || 120;
            document.getElementById("timeNumerator").value = chart.timeNumerator || 4;
            document.getElementById("timeDenominator").value = chart.timeDenominator || 4;

            const totalSec = chart.duration || 120;
            if (songMinutesInput) songMinutesInput.value = Math.floor(totalSec / 60);
            if (songSecondsInput) songSecondsInput.value = totalSec % 60;

            renderChart();
        };
        reader.readAsText(file);
    });
}

/* =========================================================
   音声再生・同期
========================================================= */
function togglePlay() {
    if (!bgmPlayer || !bgmPlayer.src || bgmPlayer.src === window.location.href) {
        alert("先に音源ファイルを選択してください！");
        return;
    }

    if (bgmPlayer.paused) {
        bgmPlayer.play();
    } else {
        bgmPlayer.pause();
    }
}

function stopAudio() {
    if (!bgmPlayer) return;
    bgmPlayer.pause();
    bgmPlayer.currentTime = 0;
}

if (bgmPlayer) {
    bgmPlayer.addEventListener("timeupdate", () => {
        const currentTime = bgmPlayer.currentTime;
        const duration = bgmPlayer.duration || 0;

        const timeDisplay = document.getElementById("audioTimeDisplay");
        if (timeDisplay) {
            timeDisplay.textContent = `${currentTime.toFixed(2)} / ${duration.toFixed(2)}`;
        }

        if (!bgmPlayer.paused) {
            const wrapper = document.getElementById("editorWrapper");
            if (wrapper) {
                const targetY = timeToY(currentTime);
                const scrollTopTarget = timeline.scrollHeight - targetY - (wrapper.clientHeight / 2);
                wrapper.scrollTop = Math.max(0, scrollTopTarget);
            }
        }
    });
}

/* =========================================================
   initial execution
========================================================= */
createNoteButtons();
renderChart();
setMode("tap");