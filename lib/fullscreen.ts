/** Toggle the browser's full screen for the whole page. */
export function toggleFullscreen() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen?.().catch(() => {});
  }
}
