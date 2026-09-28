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
