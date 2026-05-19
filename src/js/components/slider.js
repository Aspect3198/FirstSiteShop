// =============================================================
// components/slider.js — Hero banner auto-play slider
// =============================================================
import { state } from '../state/state.js';

export function initSlider() {
  const track = document.getElementById('slidesTrack');
  if (!track) return;
  const total  = track.querySelectorAll('.slide').length;
  const dotsEl = document.getElementById('sliderDots');
  if (dotsEl) {
    dotsEl.innerHTML = Array.from({ length: total }, (_, i) =>
      `<span class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`,
    ).join('');
  }
  startSliderTimer();
}

export function goToSlide(idx) {
  const track = document.getElementById('slidesTrack');
  if (!track) return;
  const total = track.querySelectorAll('.slide').length;
  state.sliderIndex = ((idx % total) + total) % total;
  track.style.transform = `translateX(-${state.sliderIndex * 100}%)`;
  document.querySelectorAll('.dot')
    .forEach((d, i) => d.classList.toggle('active', i === state.sliderIndex));
}
window.goToSlide = goToSlide;

export function nextSlide() { goToSlide(state.sliderIndex + 1); }
export function prevSlide()  { goToSlide(state.sliderIndex - 1); }

export function startSliderTimer() {
  clearInterval(state.sliderTimer);
  state.sliderTimer = setInterval(nextSlide, 5000);
}
export function pauseSlider()  { clearInterval(state.sliderTimer); }