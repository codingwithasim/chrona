const cache = new Map<string, HTMLAudioElement>();

export const SOUNDS = {
  alarm: "/sounds/aud_01.wav",
  chime: "/sounds/aud_02.mp3",
} as const;

export function playAlarm(src: string = SOUNDS.alarm) {
  let audio = cache.get(src);

  if (!audio) {
    audio = new Audio(src);
    cache.set(src, audio);
  }

  audio.currentTime = 0;
  audio.play().catch(() => {
    // Browser may block playback if there hasn't been user interaction
  });
}
