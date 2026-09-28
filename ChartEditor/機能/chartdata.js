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