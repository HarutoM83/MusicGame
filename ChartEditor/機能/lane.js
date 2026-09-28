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