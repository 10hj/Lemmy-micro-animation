const canvas = document.querySelector("#stage");
const ctx = canvas.getContext("2d");

const W = 1280;
const H = 1920;
const wakeStartMs = 900;
const colors = {
  electricBlue: "56, 114, 237",
  blue: "83, 143, 253",
  violet: "137, 116, 238",
  deep: "13, 31, 99",
  nightBlue: "22, 61, 168",
  softEdge: "78, 133, 238"
};

let startedAt = performance.now();

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOutExpo(t) {
  const n = clamp(t);
  return n === 1 ? 1 : 1 - Math.pow(2, -10 * n);
}

function drawBase() {
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#050914");
  base.addColorStop(0.42, "#071023");
  base.addColorStop(1, "#050914");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
}

function fillBlob(x, y, radius, scaleX, scaleY, stops, alpha, blur, rotation = 0) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.filter = `blur(${blur}px)`;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scaleX, scaleY);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  stops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLivingVolume(cx, cy, energy, breathe, driftA, driftB, driftC) {
  const flow = performance.now() * 0.0005;
  const slow = performance.now() * 0.00022;
  const blobs = [
    {
      x: -170 + Math.sin(flow * 1.1) * 88,
      y: -92 + Math.cos(flow * 0.82) * 74,
      r: 360,
      sx: 1.42,
      sy: 0.86,
      rot: -0.2,
      stops: [
        [0, `rgba(${colors.electricBlue}, ${0.76 * energy})`],
        [0.46, `rgba(${colors.blue}, ${0.46 * energy})`],
        [1, "rgba(56, 114, 237, 0)"]
      ],
      blur: 96
    },
    {
      x: 124 + Math.cos(flow * 0.9 + 0.7) * 104,
      y: -16 + Math.sin(flow * 0.74 + 1.2) * 82,
      r: 410,
      sx: 1.24,
      sy: 0.98,
      rot: 0.16,
      stops: [
        [0, `rgba(${colors.electricBlue}, ${0.64 * energy})`],
        [0.42, `rgba(${colors.violet}, ${0.32 * energy})`],
        [1, "rgba(137, 116, 238, 0)"]
      ],
      blur: 108
    },
    {
      x: 8 + Math.sin(flow * 0.68 + 2.1) * 76,
      y: 150 + Math.cos(flow * 0.92 + 0.4) * 70,
      r: 430,
      sx: 1.36,
      sy: 0.64,
      rot: 0.06,
      stops: [
        [0, `rgba(${colors.electricBlue}, ${0.54 * energy})`],
        [0.48, `rgba(${colors.violet}, ${0.28 * energy})`],
        [1, "rgba(56, 114, 237, 0)"]
      ],
      blur: 124
    },
    {
      x: -34 + Math.cos(flow * 1.22 + 2.6) * 62,
      y: -190 + Math.sin(flow * 0.76) * 58,
      r: 260,
      sx: 1.18,
      sy: 0.82,
      rot: -0.08,
      stops: [
        [0, `rgba(${colors.softEdge}, ${0.3 * energy})`],
        [0.5, `rgba(${colors.electricBlue}, ${0.28 * energy})`],
        [1, "rgba(78, 133, 238, 0)"]
      ],
      blur: 126
    },
    {
      x: 56 + Math.sin(flow * 0.84 + 4.3) * 118,
      y: 28 + Math.cos(flow * 1.05 + 2.1) * 92,
      r: 520,
      sx: 1.2,
      sy: 0.8,
      rot: 0.1,
      stops: [
        [0, `rgba(${colors.deep}, ${0.34 * energy})`],
        [0.48, `rgba(${colors.nightBlue}, ${0.32 * energy})`],
        [1, "rgba(13, 31, 99, 0)"]
      ],
      blur: 150
    }
  ];

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(cx + driftA * 52, cy + driftB * 42);
  ctx.scale(0.98 + breathe * 0.08, 0.96 + Math.cos(slow) * 0.055);
  ctx.rotate(driftC * 0.035);

  blobs.forEach((blob, index) => {
    fillBlob(
      blob.x + Math.sin(slow + index) * 28,
      blob.y + Math.cos(slow * 1.18 + index) * 24,
      blob.r + breathe * 26,
      blob.sx + Math.sin(flow + index * 0.7) * 0.08,
      blob.sy + Math.cos(flow * 0.86 + index) * 0.07,
      blob.stops,
      1,
      blob.blur,
      blob.rot + Math.sin(flow * 0.72 + index) * 0.12
    );
  });

  ctx.restore();
}

function drawLightGlimmer(cx, cy, energy, breathe, driftA, driftB, driftC) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(cx + driftA * 58, cy + driftB * 44);
  ctx.rotate(driftC * 0.045);

  fillBlob(
    -86 + driftB * 34,
    -76 + driftA * 28,
    150 + breathe * 14,
    1.42,
    0.42,
    [
      [0, `rgba(255, 255, 255, ${0.18 * energy})`],
      [0.32, `rgba(170, 210, 255, ${0.1 * energy})`],
      [1, "rgba(255, 255, 255, 0)"]
    ],
    1,
    46,
    -0.2 + driftC * 0.08
  );

  fillBlob(
    96 + driftA * 30,
    34 + driftB * 24,
    118 + breathe * 10,
    1.28,
    0.38,
    [
      [0, `rgba(255, 255, 255, ${0.1 * energy})`],
      [0.42, `rgba(160, 198, 255, ${0.055 * energy})`],
      [1, "rgba(255, 255, 255, 0)"]
    ],
    1,
    54,
    0.18 + driftA * 0.08
  );

  ctx.restore();
}

function drawSoftGradient(now, age) {
  const appear = easeOutExpo(age / 1050);
  const sustain = 0.94 + Math.sin(now * 0.00055) * 0.035;
  const breathe = Math.sin(now * 0.00115) * 0.5 + 0.5;
  const driftA = Math.sin(now * 0.00072);
  const driftB = Math.cos(now * 0.00061);
  const driftC = Math.sin(now * 0.00049 + 1.8);
  const driftD = Math.cos(now * 0.00082 + 0.7);
  const energy = appear * sustain;
  const cx = W * 0.5 + driftA * 82 + driftD * 34;
  const cy = H * 0.45 + driftB * 62 + driftC * 26;
  const rise = (1 - appear) * 34;

  ctx.save();
  ctx.translate(0, rise);
  drawLivingVolume(cx, cy, energy, breathe, driftA, driftB, driftC);
  drawLightGlimmer(cx, cy, energy, breathe, driftA, driftB, driftC);
  ctx.restore();
}

function draw(now) {
  const elapsed = now - startedAt;
  const age = Math.max(0, elapsed - wakeStartMs);

  drawBase();
  drawSoftGradient(now, age);
  requestAnimationFrame(draw);
}

window.addEventListener("pointerdown", () => {
  startedAt = performance.now();
});

requestAnimationFrame(draw);
