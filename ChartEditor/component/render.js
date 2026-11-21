// render.js
import { state, chart } from "./state.js";
import { dom } from "./DOM.js";
import {
  getBeatPerMeasure,
  getBpmChanges,
  getLaneWidth,
  timeToY,
} from "./timecalculator.js";

/* =========================================================
   譜面描画（誤差蓄積を完全排除した小節・グリッド描画版）
========================================================= */
export function renderChart(handlers = {}) {
  const timelineEl = dom.timeline || document.getElementById("timeline");
  if (!timelineEl) return;

  const {
    onSelectNote,
    onDeleteNote,
    onStartDragNote,
    onChartMutate,
  } = handlers;

  const mutateAndRedraw = () => {
    if (onChartMutate) {
      onChartMutate();
    } else {
      renderChart(handlers);
    }
  };

  timelineEl
    .querySelectorAll(
      ".note, .slide-line, .slide-point, .measureLine, .beatLine, .laneLine, .timeLabel, .bpmChangeLine, .bpmChangeLabel, .gridSubLine"
    )
    .forEach((el) => el.remove());

  const laneWidth = getLaneWidth();
  const timelineWidth = laneWidth * state.laneCount;
  timelineEl.style.width = timelineWidth + "px";

  const minutes = Number(document.getElementById("songMinutes")?.value) || 2;
  const seconds = Number(document.getElementById("songSeconds")?.value) || 0;
  const totalSeconds = minutes * 60 + seconds;
  const maxTime = Math.max(30, totalSeconds);

  const maxTimeY = timeToY(maxTime);
  const wrapperEl = document.getElementById("editorWrapper");
  const wrapperHeight = wrapperEl ? wrapperEl.clientHeight : 600;

  const startLineBottom = 80;
  const calculatedHeight = maxTimeY + wrapperHeight - startLineBottom;

  const MAX_SAFE_HEIGHT = 28000;
  timelineEl.style.height = Math.min(calculatedHeight, MAX_SAFE_HEIGHT) + "px";

  // レーン線の描画
  for (let i = 0; i <= state.laneCount; i++) {
    const laneLine = document.createElement("div");
    laneLine.className = "laneLine";
    laneLine.style.left = i * laneWidth + "px";
    timelineEl.appendChild(laneLine);
  }

  const changes = getBpmChanges();
  const division = Number(document.getElementById("gridDivision")?.value) || 16;
  const beatsPerMeasure = getBeatPerMeasure();

  // 各BPMセグメントごとに処理
  for (let i = 0; i < changes.length; i++) {
    let segStart = changes[i].time;
    let segBpm = changes[i].bpm;
    let segEnd = i < changes.length - 1 ? changes[i + 1].time : maxTime;

    let secPerBeat = 60 / segBpm;
    let secPerMeasure = secPerBeat * beatsPerMeasure;
    let subInterval = secPerBeat * (4 / division);
    let subsPerMeasure = Math.round(secPerMeasure / subInterval);

    let startMeasure = Math.floor(segStart / secPerMeasure);
    let endMeasure = Math.ceil(segEnd / secPerMeasure);

    for (let m = startMeasure; m <= endMeasure; m++) {
      let measureStartTime = m * secPerMeasure;

      for (let sub = 0; sub < subsPerMeasure; sub++) {
        let t = measureStartTime + sub * subInterval;

        if (t >= segStart - 0.0001 && t < segEnd && t <= maxTime) {
          const y = timeToY(t);

          let isMeasureStart = sub === 0;
          let isBeatStart = sub % (division / 4) === 0;

          if (isMeasureStart) {
            const measureLine = document.createElement("div");
            measureLine.className = "measureLine";
            measureLine.style.bottom = y + "px";
            measureLine.style.width = timelineWidth + "px";
            timelineEl.appendChild(measureLine);

            const label = document.createElement("div");
            label.className = "timeLabel";
            label.style.bottom = y - 8 + "px";
            label.textContent = `${m + 1}小節`;
            timelineEl.appendChild(label);
          } else if (isBeatStart) {
            const beatLine = document.createElement("div");
            beatLine.className = "beatLine";
            beatLine.style.bottom = y + "px";
            beatLine.style.width = timelineWidth + "px";
            timelineEl.appendChild(beatLine);
          } else {
            const subLine = document.createElement("div");
            subLine.className = "gridSubLine";
            subLine.style.bottom = y + "px";
            subLine.style.width = timelineWidth + "px";
            timelineEl.appendChild(subLine);
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
      timelineEl.appendChild(bpmLine);

      const bpmLabel = document.createElement("div");
      bpmLabel.className = "bpmChangeLabel";
      bpmLabel.style.bottom = y - 8 + "px";
      bpmLabel.textContent = `▶ BPM ${change.bpm} (${change.time.toFixed(1)}秒)`;

      bpmLabel.onclick = () => {
        if (confirm(`秒数 ${change.time.toFixed(1)} のBPM変更を削除しますか？`)) {
          chart.bpmChanges = chart.bpmChanges.filter((b) => b.time !== change.time);
          mutateAndRedraw();
        }
      };
      timelineEl.appendChild(bpmLabel);
    });
  }

  // ノーツの描画
  if (chart.notes && chart.notes.length > 0) {
    chart.notes.forEach((note, index) => {
      renderNote(note, index, laneWidth, timelineEl, {
        onSelectNote,
        onDeleteNote,
        onStartDragNote,
        mutateAndRedraw,
      });
    });
  }
}

/* =========================================================
   ノーツ描画分岐
========================================================= */
function renderNote(note, index, laneWidth, timelineEl, ctx) {
  switch (note.type) {
    case "tap":
      createSingleVisual(note, index, laneWidth, "note-tap", timelineEl, ctx);
      break;
    case "ex":
      createSingleVisual(note, index, laneWidth, "note-ex", timelineEl, ctx);
      break;
    case "flick":
      createSingleVisual(note, index, laneWidth, "note-flick", timelineEl, ctx);
      break;
    case "drag":
      createSingleVisual(note, index, laneWidth, "note-drag", timelineEl, ctx);
      break;
    case "hold":
      createHoldVisual(note, index, laneWidth, timelineEl, ctx);
      break;
    case "slide":
      createSlideVisual(note, index, laneWidth, timelineEl, ctx);
      break;
    case "sky":
      createSingleVisual(note, index, laneWidth, "note-sky", timelineEl, ctx);
      break;
    case "jump":
      createJumpVisual(note, index, laneWidth, timelineEl, ctx);
      break;
  }
}

function handleNoteSelectOrDelete(index, ctx) {
  if (state.mode === "delete") {
    if (ctx.onDeleteNote) {
      ctx.onDeleteNote(index);
    } else {
      chart.notes.splice(index, 1);
      ctx.mutateAndRedraw();
    }
    return true;
  }
  ctx.onSelectNote?.(index);
  return false;
}

function createSingleVisual(note, index, laneWidth, className, timelineEl, ctx) {
  const element = document.createElement("div");
  element.className = "note " + className;
  element.style.left = note.lane * laneWidth + 10 + "px";
  element.style.bottom = timeToY(note.time) + "px";
  element.style.width = laneWidth - 20 + "px";

  if (note.isEx) {
    element.style.background = "#ffd83d";
    element.style.border = "2px solid #fff";
    element.style.boxShadow = "0 0 8px #ffd83d";
  }

  element.onmousedown = (event) => {
    event.stopPropagation();
    if (handleNoteSelectOrDelete(index, ctx)) return;
    state.draggingNoteIndex = index;
    ctx.onStartDragNote?.(index);
  };

  element.onclick = (event) => {
    event.stopPropagation();
    if (state.mode === "delete") {
      handleNoteSelectOrDelete(index, ctx);
      return;
    }
    ctx.onSelectNote?.(index);
  };

  timelineEl.appendChild(element);
}

function createHoldVisual(note, index, laneWidth, timelineEl, ctx) {
  const element = document.createElement("div");
  element.className = "note note-hold";
  element.style.left = note.lane * laneWidth + 10 + "px";
  element.style.bottom = timeToY(note.startTime) + "px";
  element.style.width = laneWidth - 20 + "px";
  element.style.height = timeToY(note.endTime) - timeToY(note.startTime) + "px";

  if (note.isEx) {
    element.style.background = "#ffd83d";
    element.style.border = "2px solid #fff";
    element.style.boxShadow = "0 0 10px #ffd83d";
  }

  if (note.hasEndJudge) {
    element.style.borderTop = "3px dashed #fff";
  }

  if (note.endType === "jump") {
    const arrows = {
      up: "↑",
      upleft: "↖",
      upright: "↗",
      down: "↓",
      downleft: "↙",
      downright: "↘",
    };
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

  element.onmousedown = (event) => {
    event.stopPropagation();
    if (handleNoteSelectOrDelete(index, ctx)) return;
    state.draggingNoteIndex = index;
    ctx.onStartDragNote?.(index);
  };

  element.onclick = (event) => {
    event.stopPropagation();
    if (state.mode === "delete") {
      handleNoteSelectOrDelete(index, ctx);
      return;
    }
    ctx.onSelectNote?.(index);
  };

  timelineEl.appendChild(element);
}

function createSlideVisual(note, index, laneWidth, timelineEl, ctx) {
  if (note.startLane === undefined || note.endLane === undefined) return;

  const startX = note.startLane * laneWidth + 10;
  const endX = note.endLane * laneWidth + 10;
  const startY = timeToY(note.startTime || 0);
  const endY = timeToY(note.endTime || 0);

  const line = document.createElement("div");
  line.className = "slide-line";
  line.style.left = Math.min(startX, endX) + "px";
  line.style.bottom = Math.min(startY, endY) + "px";

  const widthSpan =
    Math.abs(note.endLane - note.startLane) * laneWidth + (laneWidth - 20);
  const heightSpan = Math.abs(endY - startY);

  line.style.width = widthSpan + "px";
  line.style.height = Math.max(10, heightSpan) + "px";
  line.style.borderRadius = "8px";

  if (note.isEx) {
    line.style.background = "#ffd83d";
    line.style.border = "2px solid #fff";
    line.style.boxShadow = "0 0 10px #ffd83d";
  }

  line.onmousedown = (event) => {
    event.stopPropagation();
    if (handleNoteSelectOrDelete(index, ctx)) return;
    state.draggingNoteIndex = index;
    ctx.onStartDragNote?.(index);
  };

  line.onclick = (event) => {
    event.stopPropagation();
    if (state.mode === "delete") {
      handleNoteSelectOrDelete(index, ctx);
      return;
    }
    ctx.onSelectNote?.(index);
  };

  timelineEl.appendChild(line);

  createSafeSlidePoint(note.startLane, note.startTime, note, index, timelineEl, ctx);

  if (note.endType === "jump") {
    createSafeJumpVisual(
      note.endLane,
      note.endTime,
      note.endDirection,
      note,
      index,
      timelineEl,
      ctx
    );
  } else {
    createSafeSlidePoint(note.endLane, note.endTime, note, index, timelineEl, ctx);
  }
}

function createSafeSlidePoint(lane, time, note, index, timelineEl, ctx) {
  const laneWidth = getLaneWidth();
  const point = document.createElement("div");
  point.className = "note note-tap";
  point.style.left = lane * laneWidth + 10 + "px";
  point.style.bottom = timeToY(time || 0) + "px";
  point.style.width = laneWidth - 20 + "px";

  if (note.isEx) {
    point.style.background = "#ffd83d";
    point.style.border = "2px solid #fff";
  }

  point.onclick = (event) => {
    event.stopPropagation();
    if (state.mode === "delete") {
      handleNoteSelectOrDelete(index, ctx);
      return;
    }
    ctx.onSelectNote?.(index);
  };

  timelineEl.appendChild(point);
}

function createSafeJumpVisual(lane, time, direction, note, index, timelineEl, ctx) {
  const laneWidth = getLaneWidth();
  const element = document.createElement("div");
  element.className = `note note-jump jump-${direction || "up"}`;
  element.style.left = lane * laneWidth + 10 + "px";
  element.style.bottom = timeToY(time || 0) + "px";
  element.style.width = laneWidth - 20 + "px";

  const arrows = {
    up: "↑",
    upleft: "↖",
    upright: "↗",
    down: "↓",
    downleft: "↙",
    downright: "↘",
  };
  element.textContent = arrows[direction || "up"] || "↑";

  element.onclick = (event) => {
    event.stopPropagation();
    if (state.mode === "delete") {
      handleNoteSelectOrDelete(index, ctx);
      return;
    }
    ctx.onSelectNote?.(index);
  };

  timelineEl.appendChild(element);
}

function createJumpVisual(note, index, laneWidth, timelineEl, ctx) {
  const element = document.createElement("div");
  element.className = `note note-jump jump-${note.direction || "up"}`;
  element.style.left = note.lane * laneWidth + 10 + "px";
  element.style.bottom = timeToY(note.time) + "px";
  element.style.width = laneWidth - 20 + "px";

  const arrows = {
    up: "↑",
    upleft: "↖",
    upright: "↗",
    down: "↓",
    downleft: "↙",
    downright: "↘",
  };
  element.textContent = arrows[note.direction] || "↑";

  if (note.isEx) {
    element.style.background = "#ffd83d";
    element.style.border = "2px solid #fff";
    element.style.boxShadow = "0 0 8px #ffd83d";
  }

  element.onmousedown = (event) => {
    event.stopPropagation();
    if (handleNoteSelectOrDelete(index, ctx)) return;
    state.draggingNoteIndex = index;
    ctx.onStartDragNote?.(index);
  };

  element.onclick = (event) => {
    event.stopPropagation();
    if (state.mode === "delete") {
      handleNoteSelectOrDelete(index, ctx);
      return;
    }
    ctx.onSelectNote?.(index);
  };

  timelineEl.appendChild(element);
}