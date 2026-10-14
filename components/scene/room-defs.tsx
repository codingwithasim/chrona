/** Gradients, patterns and filters shared by the room layer. */
export function RoomDefs() {
  return (
    <defs>
      <linearGradient id="rm-ceiling-shade" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="1" stopColor="#1e2633" stopOpacity="0.25" />
      </linearGradient>

      <linearGradient id="rm-left-shade" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="1" stopColor="#1e2633" stopOpacity="0.28" />
      </linearGradient>

      <linearGradient id="rm-right-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.04" />
        <stop offset="1" stopColor="#1e2633" stopOpacity="0.3" />
      </linearGradient>

      <radialGradient id="rm-back-light" cx="800" cy="360" r="640" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="rm-floor-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1e1410" stopOpacity="0.28" />
        <stop offset="0.5" stopColor="#1e1410" stopOpacity="0" />
        <stop offset="1" stopColor="#1e1410" stopOpacity="0.2" />
      </linearGradient>

      <linearGradient id="rm-contact-back" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1e2633" stopOpacity="0.35" />
        <stop offset="1" stopColor="#1e2633" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="rm-glass-fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.7" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
      </linearGradient>

      <radialGradient id="rm-frost" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.6" />
      </radialGradient>

      <linearGradient id="rm-sill-shadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1e2633" stopOpacity="0.3" />
        <stop offset="1" stopColor="#1e2633" stopOpacity="0" />
      </linearGradient>

      {/* Sheer curtains: soft vertical folds */}
      <linearGradient id="rm-sheer" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
        <stop offset="0.15" stopColor="#eef2f6" stopOpacity="0.42" />
        <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.68" />
        <stop offset="0.48" stopColor="#e6ecf2" stopOpacity="0.4" />
        <stop offset="0.64" stopColor="#ffffff" stopOpacity="0.66" />
        <stop offset="0.8" stopColor="#e9eef3" stopOpacity="0.44" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.6" />
      </linearGradient>

      <linearGradient id="rm-sheer-glow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--rm-glow)" stopOpacity="0.5" />
        <stop offset="1" stopColor="var(--rm-glow)" stopOpacity="0.15" />
      </linearGradient>

      <linearGradient id="rm-desk-top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1e1410" stopOpacity="0.12" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.12" />
      </linearGradient>

      <radialGradient id="rm-drop-shadow">
        <stop offset="0" stopColor="#141a26" stopOpacity="0.45" />
        <stop offset="1" stopColor="#141a26" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="rm-rug-shade" cx="0.5" cy="0.5" r="0.7">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.15" />
        <stop offset="1" stopColor="#3a2c1e" stopOpacity="0.15" />
      </radialGradient>

      <linearGradient id="rm-mug" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#86ad97" />
        <stop offset="0.25" stopColor="#d6ebdf" />
        <stop offset="0.4" stopColor="#9cc2ad" />
        <stop offset="0.85" stopColor="#86ad97" />
        <stop offset="1" stopColor="#5e8270" />
      </linearGradient>

      <linearGradient id="rm-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
      </linearGradient>

      {/* Used by Mochi */}
      <radialGradient id="sc-fur" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#4a3a3a" stopOpacity="0.14" />
      </radialGradient>

      <radialGradient id="sc-drop-shadow">
        <stop offset="0" stopColor="#141a26" stopOpacity="0.45" />
        <stop offset="1" stopColor="#141a26" stopOpacity="0" />
      </radialGradient>

      {/* Soft halo when hovering something clickable */}
      <filter id="sc-hover-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="thick" />
        <feGaussianBlur in="thick" stdDeviation="4" result="blur" />
        <feFlood floodColor="#fff4d6" floodOpacity="0.85" />
        <feComposite in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
