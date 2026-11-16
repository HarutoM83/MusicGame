import { state,chart } from "./state.js";
import { dom } from "./dom.js";
import { 
  getBeatPerMeasure,
  getBpmChanges,
  getLaneWidth,
  timeToY 
        } from "./timecalculator.js";

/* =========================================================
   譜面描画（誤差蓄積を完全排除した小節・グリッド描画版）
========================================================= */
export function renderChart() {
    if (!timeline) return;
    timeline.querySelectorAll(".note, .slide-line, .slide-point, .measureLine, .beatLine, .laneLine, .timeLabel, .bpmChangeLine, .bpmChangeLabel, .gridSubLine").forEach(el => el.remove());

    const laneWidth = getLaneWidth();
    const timelineWidth = laneWidth * laneCount;
    timeline.style.width = timelineWidth + "px";

   const minutes = Number(document.getElementById("songMinutes").value) || 2;
    const seconds = Number(document.getElementById("songSeconds").value) || 0;
    const totalSeconds = (minutes * 60) + seconds;
    const maxTime = Math.max(30, totalSeconds);

    // 0秒がスタートラインにぴったり来たり、maxTimeが綺麗に収まるように高さを設定
    // タイムラインの高さ ＝ (maxTimeまでのY座標) ＋ (画面上部の余白)
    // maxTime が終了したときにちょうどスタートラインに届くよう、高さを計算
    const maxTimeY = timeToY(maxTime);
    const wrapperHeight = document.getElementById("editorWrapper").clientHeight;
    
    // maxTime が終了したときにちょうどスタートラインに届くよう、高さを計算
    // maxTime に到達したとき、最後のノーツがスタートラインの位置にぴったりピタリと来るようにする
    const startLineBottom = 80; // CSSの #startLine の bottom と合わせる
    const calculatedHeight = maxTimeY + wrapperHeight - startLineBottom;

    // Firefoxなどの描画制限（約30,000px）を超えて要素が消えないよう上限を設定
    const MAX_SAFE_HEIGHT = 28000;
    timeline.style.height = Math.min(calculatedHeight, MAX_SAFE_HEIGHT) + "px";

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
            createSingleVisual(note, index, laneWidth, "note-sky");
            break;
        case "jump":
            createJumpVisual(note, index, laneWidth);
            break;
    }
}

//単体ノーツ(タップ・フリック・ドラッグ・スカイなど)
function createSingleVisual(note, index, laneWidth, className) {
    const element = document.createElement("div");
    element.className = "note " + className;
    element.style.left = (note.lane * laneWidth + 10) + "px";
    element.style.bottom = timeToY(note.time) + "px";
    element.style.width = (laneWidth - 20) + "px";
    
    element.onmousedown = event => {
        // 削除モードのときは削除を優先
        if (mode === "delete") {
            event.stopPropagation();
            chart.notes.splice(index, 1);
            renderChart();
            return;
        }
    
    // 通常モードのときは「掴んでドラッグ移動」を開始
    event.stopPropagation();
    draggingNoteIndex = index;
    selectNote(index);
};

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

// ホールドノーツ描画の拡張
function createHoldVisual(note, index, laneWidth) {
    const element = document.createElement("div");
    element.className = "note note-hold";
    element.style.left = (note.lane * laneWidth + 10) + "px";
    element.style.bottom = timeToY(note.startTime) + "px";
    element.style.width = (laneWidth - 20) + "px";
    element.style.height = (timeToY(note.endTime) - timeToY(note.startTime)) + "px";

    element.onmousedown = event => {
    // 削除モードのときは削除を優先
    if (mode === "delete") {
        event.stopPropagation();
        chart.notes.splice(index, 1);
        renderChart();
        return;
    }
    
    // 通常モードのときは「掴んでドラッグ移動」を開始
    event.stopPropagation();
    draggingNoteIndex = index;
    selectNote(index);
    };

    // EX属性（始点側、または全体）の適用
    if (note.isEx) {
        element.style.background = "#ffd83d";
        element.style.border = "2px solid #fff";
        element.style.boxShadow = "0 0 10px #ffd83d";
    }

    // 終点判定がある場合の視覚的演出（例：上部に枠線を付けるなど）
    if (note.hasEndJudge) {
        element.style.borderTop = "3px dashed #fff";
    }

    // 終点がジャンプの場合の表示
    if (note.endType === "jump") {
        const arrows = { up: "↑", upleft: "↖", upright: "↗", down: "↓", downleft: "↙", downright: "↘" };
        const jumpBadge = document.createElement("div");
        jumpBadge.textContent = arrows[note.endDirection || "up"] || "↑";
        jumpBadge.style.position = "absolute";
        jumpBadge.style.top = "0";
        jumpBadge.style.left = "50%";
        jumpBadge.style.transform = "translateX(-50%)";
        jumpBadge.style.fontSize = "14px";
        jumpBadge.style.fontWeight = "bold";
        jumpBadge.style.color = "#fff";
        element.appendChild(jumpBadge);
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

// スライドノーツ（複雑な回転をやめ、レーン基準で確実に配置する）
function createSlideVisual(note, index, laneWidth) {
    // データの安全チェック（エラー防止）
    if (note.startLane === undefined || note.endLane === undefined) return;

    const startX = note.startLane * laneWidth + 10;
    const endX = note.endLane * laneWidth + 10;
    const startY = timeToY(note.startTime || 0);
    const endY = timeToY(note.endTime || 0);

    const line = document.createElement("div");
    line.className = "slide-line";
    line.style.left = Math.min(startX, endX) + "px"; // 左右の端のどちらか低い方から
    line.style.bottom = Math.min(startY, endY) + "px";
    
    // 横幅は「またいだレーン分の幅」、高さは「時間の長さ（Yの差）」にする
    const widthSpan = Math.abs(note.endLane - note.startLane) * laneWidth + (laneWidth - 20);
    const heightSpan = Math.abs(endY - startY);

    line.style.width = widthSpan + "px";
    line.style.height = Math.max(10, heightSpan) + "px";
    line.style.borderRadius = "8px";

    // ──────────────────────────────────────────────
    // スライドを掴んで動かす / 削除する処理
    // ──────────────────────────────────────────────
    line.onmousedown = event => {
        event.stopPropagation();
        if (mode === "delete") {
            chart.notes.splice(index, 1);
            renderChart();
            return;
        }
        // ドラッグ移動を開始
        draggingNoteIndex = index;
        selectNote(index);
    };
    // ──────────────────────────────────────────────

    timeline.appendChild(line);

    // EX属性の適用
    if (note.isEx) {
        line.style.background = "#ffd83d";
        line.style.border = "2px solid #fff";
        line.style.boxShadow = "0 0 10px #ffd83d";
    }

    line.onclick = event => {
        event.stopPropagation();
        if (mode === "delete") {
            chart.notes.splice(index, 1);
            renderChart();
            return;
        }
        selectNote(index);
    };

    timeline.appendChild(line);

    // 始点と終点の描画（エラーが出ない安全な関数を呼び出す）
    createSafeSlidePoint(note.startLane, note.startTime, note, index);
    
    if (note.endType === "jump") {
        createSafeJumpVisual(note.endLane, note.endTime, note.endDirection, note, index);
    } else {
        createSafeSlidePoint(note.endLane, note.endTime, note, index);
    }
}

function createSafeSlidePoint(lane, time, note, index) {
    const laneWidth = getLaneWidth();
    const point = document.createElement("div");
    point.className = "note note-tap";
    point.style.left = (lane * laneWidth + 10) + "px";
    point.style.bottom = timeToY(time || 0) + "px";
    point.style.width = (laneWidth - 20) + "px";

    if (note.isEx) {
        point.style.background = "#ffd83d";
        point.style.border = "2px solid #fff";
    }

    point.onclick = event => {
        event.stopPropagation();
        if (mode === "delete") {
            chart.notes.splice(index, 1);
            renderChart();
            return;
        }
        selectNote(index);
    };

    timeline.appendChild(point);
}

// 終点専用のジャンプノーツ描画用ヘルパー
function createSafeJumpVisual(lane, time, direction, note, index) {
    const laneWidth = getLaneWidth();
    const element = document.createElement("div");
    element.className = `note note-jump jump-${direction || "up"}`;
    element.style.left = (lane * laneWidth + 10) + "px";
    element.style.bottom = timeToY(time || 0) + "px";
    element.style.width = (laneWidth - 20) + "px";

    const arrows = { up: "↑", upleft: "↖", upright: "↗", down: "↓", downleft: "↙", downright: "↘" };
    element.textContent = arrows[direction || "up"] || "↑";

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

//ジャンプノーツ
function createJumpVisual(note, index, laneWidth) {
    const element = document.createElement("div");
    // CSSクラスでベーススタイルと方向ごとの色・光彩を適用
    element.className = `note note-jump jump-${note.direction || "up"}`;
    
    element.style.left = (note.lane * laneWidth + 10) + "px";
    element.style.bottom = timeToY(note.time) + "px";
    element.style.width = (laneWidth - 20) + "px";

    // 方向ごとの矢印設定
    const arrows = {
        up: "↑", upleft: "↖", upright: "↗",
        down: "↓", downleft: "↙", downright: "↘",
    };

    element.textContent = arrows[note.direction] || "↑";

    if (note.isEx) {
        element.style.background = "#ffd83d";
        element.style.border = "2px solid #fff";
        element.style.boxShadow = "0 0 8px #ffd83d";
    }

    // 単体ノーツの生成時
    element.onmousedown = event => {
        // 削除モードのときは削除を優先
        if (mode === "delete") {
            event.stopPropagation();
            chart.notes.splice(index, 1);
            renderChart();
            return;
        }
    
    // 通常モードのときは「掴んでドラッグ移動」を開始
    event.stopPropagation();
    draggingNoteIndex = index;
    selectNote(index);
};

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
