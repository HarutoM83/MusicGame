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