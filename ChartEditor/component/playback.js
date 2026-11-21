//playback.js

import { dom } from "./DOM.js";
import { timeToY } from "./timecalculator.js";

/* =========================================================
   音声再生・同期（requestAnimationFrame による高精度・滑らかスクロール）
========================================================= */
let animationFrameId = null;

function getPlayer() {
  return document.getElementById("bgmPlayer");
}

export function togglePlay() {
  const bgmPlayer = getPlayer();
  if (!bgmPlayer || !bgmPlayer.src || bgmPlayer.src === window.location.href) {
    alert("先に音源ファイルを選択してください！");
    return;
  }

  if (bgmPlayer.paused) {
    bgmPlayer.play();
  } else {
    bgmPlayer.pause();
  }
}

export function stopAudio() {
  const bgmPlayer = getPlayer();
  if (!bgmPlayer) return;
  bgmPlayer.pause();
  bgmPlayer.currentTime = 0;
  updateScrollAndDisplay();
}

function loopAnimation() {
  const bgmPlayer = getPlayer();
  if (!bgmPlayer || bgmPlayer.paused || bgmPlayer.ended) return;

  updateScrollAndDisplay();
  animationFrameId = requestAnimationFrame(loopAnimation);
}

export function updateScrollAndDisplay() {
  const bgmPlayer = getPlayer();
  if (!bgmPlayer) return;

  const currentTime = bgmPlayer.currentTime;
  const duration = bgmPlayer.duration || 0;

  const timeDisplay = document.getElementById("audioTimeDisplay");
  if (timeDisplay) {
    timeDisplay.textContent = `${currentTime.toFixed(2)} / ${duration.toFixed(2)}`;
  }

  const wrapper = document.getElementById("editorWrapper");
  if (wrapper && dom.timeline) {
    const targetY = timeToY(currentTime);
    const timelineHeight = dom.timeline.clientHeight;
    const wrapperHeight = wrapper.clientHeight;
    const startLineBottom = 80;

    const scrollTopTarget = timelineHeight - targetY - wrapperHeight + startLineBottom;
    wrapper.scrollTop = Math.max(0, scrollTopTarget);
  }
}

export function bindPlaybackEvents() {
  const bgmPlayer = getPlayer();
  if (!bgmPlayer) return;

  bgmPlayer.addEventListener("play", () => {
    loopAnimation();
  });

  bgmPlayer.addEventListener("pause", () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    updateScrollAndDisplay();
  });

  bgmPlayer.addEventListener("ended", () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    updateScrollAndDisplay();
  });
}

// 【補足】もしタイムライン上のスクロールバーを手動でぐりぐり動かしたときに
// 音声の再生位置を合わせたい（シークしたい）場合の拡張もここに追加できます。
