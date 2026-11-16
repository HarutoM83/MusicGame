/* =========================================================
   ノーツ定義
========================================================= */
export const NOTE_TYPES = {
    tap: { name: "通常", placement: "single" },
    flick: { name: "フリック", placement: "single"},
    drag: { name: "ドラッグ", placement: "single" },
    hold: { name: "ホールド", placement: "range" },
    slide: { name: "スライド", placement: "slide" },
    sky: { name: "スカイ",placement: "single", defaults: { x: 0, y: 0, z: 0 } },
    jump: { name: "ジャンプ",placement: "single", defaults: { direction: "up" } }
};