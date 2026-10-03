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
