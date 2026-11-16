/* =========================================================
   基本設定
========================================================= */
export const state = {
pixelsPerSecond = 100,
laneCount = 8,
mode = "tap",
selectedNoteIndex = -1,
dragStart = null,
}

/* =========================================================
   譜面データ
========================================================= */
export const chart = {
    songName: "MySong",
    bpm: 120,
    timeNumerator: 4,
    timeDenominator: 4,
    laneCount: 8,
    duration: 120,
    bpmChanges: [],
    notes: []
};
