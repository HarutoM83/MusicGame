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