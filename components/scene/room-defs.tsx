/** Gradients, patterns and filters shared by the room layer. */
export function RoomDefs() {
  return (
    <defs>
      <linearGradient id="sc-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--sc-wall-1)" />
        <stop offset="1" stopColor="var(--sc-wall-2)" />
      </linearGradient>

      <pattern id="sc-stripes" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="20" height="40" fill="var(--sc-stripe)" />
        <circle cx="30" cy="10" r="1.2" fill="var(--sc-stripe)" />
        <circle cx="30" cy="30" r="1.2" fill="var(--sc-stripe)" />
      </pattern>

      <radialGradient id="sc-window-light" cx="800" cy="380" r="620" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="var(--sc-wall-light)" />
        <stop offset="1" stopColor="var(--sc-wall-light)" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="sc-corner-left" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="var(--sc-shadow)" />
        <stop offset="1" stopColor="var(--sc-shadow)" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="sc-corner-right" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="var(--sc-shadow)" />
        <stop offset="1" stopColor="var(--sc-shadow)" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="sc-ceiling" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--sc-shadow)" />
        <stop offset="1" stopColor="var(--sc-shadow)" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="sc-wood" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--sc-frame-light)" />
        <stop offset="0.5" stopColor="var(--sc-frame)" />
        <stop offset="1" stopColor="var(--sc-frame-dark)" />
      </linearGradient>

      <linearGradient id="sc-plank" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--sc-desk-2)" />
        <stop offset="1" stopColor="var(--sc-desk-1)" />
      </linearGradient>

      <linearGradient id="sc-curtain" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="var(--sc-curtain-2)" />
        <stop offset="0.16" stopColor="var(--sc-curtain-1)" />
        <stop offset="0.3" stopColor="var(--sc-curtain-2)" />
        <stop offset="0.46" stopColor="var(--sc-curtain-3)" />
        <stop offset="0.6" stopColor="var(--sc-curtain-1)" />
        <stop offset="0.78" stopColor="var(--sc-curtain-2)" />
        <stop offset="0.9" stopColor="var(--sc-curtain-1)" />
        <stop offset="1" stopColor="var(--sc-curtain-3)" />
      </linearGradient>

      <linearGradient id="sc-curtain-glow" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="var(--sc-ray-color)" stopOpacity="0.55" />
        <stop offset="0.5" stopColor="var(--sc-ray-color)" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="sc-desk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--sc-desk-1)" />
        <stop offset="1" stopColor="var(--sc-desk-2)" />
      </linearGradient>

      <linearGradient id="sc-desk-edge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--sc-desk-2)" />
        <stop offset="0.25" stopColor="var(--sc-desk-edge)" />
        <stop offset="1" stopColor="var(--sc-desk-front)" />
      </linearGradient>

      <linearGradient id="sc-fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.7" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
      </linearGradient>

      <linearGradient id="sc-glass-inner" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000000" stopOpacity="0.25" />
        <stop offset="1" stopColor="#000000" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="sc-contact" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--sc-shadow)" stopOpacity="0" />
        <stop offset="1" stopColor="var(--sc-shadow)" />
      </linearGradient>

      <radialGradient id="sc-drop-shadow">
        <stop offset="0" stopColor="var(--sc-shadow)" />
        <stop offset="1" stopColor="var(--sc-shadow)" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="sc-lamp-glow" cx="440" cy="760" r="430" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffc983" stopOpacity="0.55" />
        <stop offset="0.45" stopColor="#ffb36b" stopOpacity="0.18" />
        <stop offset="1" stopColor="#ffb36b" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="sc-lamp-cone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe2a8" stopOpacity="0.5" />
        <stop offset="1" stopColor="#ffe2a8" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="sc-beam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--sc-ray-color)" stopOpacity="0" />
        <stop offset="0.35" stopColor="var(--sc-ray-color)" stopOpacity="0.32" />
        <stop offset="0.75" stopColor="var(--sc-ray-color)" stopOpacity="0.16" />
        <stop offset="1" stopColor="var(--sc-ray-color)" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="sc-sunpatch" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--sc-sunpatch)" stopOpacity="0.9" />
        <stop offset="1" stopColor="var(--sc-sunpatch)" stopOpacity="0.15" />
      </linearGradient>

      <radialGradient id="sc-bloom" cx="800" cy="380" r="560" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="var(--sc-ray-color)" stopOpacity="0.55" />
        <stop offset="1" stopColor="var(--sc-ray-color)" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="sc-frost" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.6" />
      </radialGradient>

      {/* Ceramic cylinder shading for the mug */}
      <linearGradient id="sc-mug-body" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="var(--sc-mug)" />
        <stop offset="0.22" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="0.34" stopColor="var(--sc-mug)" />
        <stop offset="0.85" stopColor="var(--sc-mug)" />
        <stop offset="1" stopColor="#7a4a5c" />
      </linearGradient>

      <radialGradient id="sc-tea" cx="0.4" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#c48a5c" />
        <stop offset="1" stopColor="var(--sc-tea)" />
      </radialGradient>

      <linearGradient id="sc-metal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.2" />
      </linearGradient>

      <linearGradient id="sc-page-left" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="var(--sc-paper)" />
        <stop offset="0.85" stopColor="var(--sc-paper)" />
        <stop offset="1" stopColor="#c9b8a8" />
      </linearGradient>

      <linearGradient id="sc-page-right" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="var(--sc-paper)" />
        <stop offset="0.85" stopColor="var(--sc-paper)" />
        <stop offset="1" stopColor="#c9b8a8" />
      </linearGradient>

      <radialGradient id="sc-fur" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#5a3a3a" stopOpacity="0.14" />
      </radialGradient>

      <radialGradient id="sc-glass-ball" cx="0.3" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
      </radialGradient>

      {/* Soft halo when hovering something clickable */}
      <filter id="sc-hover-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="thick" />
        <feGaussianBlur in="thick" stdDeviation="5" result="blur" />
        <feFlood floodColor="#fff1c2" floodOpacity="0.85" />
        <feComposite in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
