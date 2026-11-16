import { NOTE_TYPES } from "./constants.js";
import { state,chart} from "./state.js";
import { dom } from "./dom.js";
import { getLane, getMousePosition, snapTimeToGrid, yToTime } from "./timecalculator.js";
import { addSingleNote, addHoldNote, addSlideNote } from "./notes.js";
import { renderChart } from "./render.js";

/* =========================================================
   タイムライン イベント（ホールド・スライドの直感的な配置対応）
========================================================= */

export function bindEvents(renderChart) {
    if (dom.timeline) {
        dom.timeline.addEventListener("mousedown", event => {
            if (!mode || mode === "delete") return;

            const pos = getMousePosition(event);
            const lane = getLane(pos.x);
            if (lane < 0 || lane >= laneCount) return;

            const config = NOTE_TYPES[mode];
            if (!config) return;

            const snappedTime = snapTimeToGrid(yToTime(pos.y));

            if (config.placement === "single") {
                addSingleNote(mode, lane, snappedTime);
            } else if (config.placement === "range" || config.placement === "slide") {
                // ホールドやスライドの場合、押した瞬間をドラッグ開始地点として保持
                dragStart = { lane: lane, time: snappedTime };
            }
        });

        dom.timeline.addEventListener("mouseup", event => {
            if (!mode || mode === "delete") return;
            if (dragStart === null) return;

            const pos = getMousePosition(event);
            const endLane = getLane(pos.x);
            const endTime = snapTimeToGrid(yToTime(pos.y));

            // 終了時間が開始時間より後ろ（または同じ）の場合に生成
            if (endTime >= dragStart.time) {
                if (mode === "hold") {
                    // ホールドは同じレーン内、または最低限の長さがある場合
                    const targetLane = endLane >= 0 && endLane < laneCount ? endLane : dragStart.lane;
                    // 通常ホールドは同じレーンで作る場合が多いので dragStart.lane に固定するか、endLaneを使うか
                    addHoldNote(dragStart.lane, dragStart.time, endTime > dragStart.time ? endTime : dragStart.time + 0.5);
                } 
                else if (mode === "slide") {
                    // スライドの場合：開始レーンと終了レーンが別でもOK！
                    const validEndLane = (endLane >= 0 && endLane < laneCount) ? endLane : dragStart.lane;
                    const validEndTime = endTime > dragStart.time ? endTime : dragStart.time + 0.5;
                
                    addSlideNote(dragStart.lane, validEndLane, dragStart.time, validEndTime);
                }
            }
            state.dragStart = null;
        });
    }
    if (dom.laneCountInput) {
    dom.laneCountInput.onchange = () => {
      state.laneCount = Number(dom.laneCountInput.value);
      state.chart.laneCount = state.laneCount;
      renderChart();
        };
    }

    ["bpm", "timeNumerator", "timeDenominator", "songMinutes", "songSeconds", "gridDivision"].forEach(
        (id) => {
        const el = document.getElementById(id);
        if (el) el.onchange = () => renderChart();
        }
    );
}