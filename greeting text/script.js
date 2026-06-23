const strokes = Array.from(document.querySelectorAll(".mask-stroke"));
    const tipGroup = document.querySelector("#tipMaskPaths");
    const topRowFill = document.querySelector("#topRowFill");
    const bottomRowFill = document.querySelector("#bottomRowFill");
    const replay = document.querySelector(".replay");

    const rhythm = [
      1.02, 0.78, 0.86, 0.72, 1.02, 0.66, 0.9,
      1.12, 0.86, 0.7,
      1.04, 0.78, 0.66, 0.98,
      1.02, 0.72, 1.06, 0.7, 0.98, 0.66, 0.92,
      1.18, 0.94, 0.66,
      0.92, 0.68, 0.84, 0.62, 0.98,
      1.12, 0.72, 0.88, 1.04
    ];

    const syllableEnds = new Set([6, 9, 13, 20, 23, 28]);
    const rowEnds = new Map([[13, topRowFill], [32, bottomRowFill]]);
    const motionCurves = [
      "cubic-bezier(.34,.02,.12,1)",
      "cubic-bezier(.2,.84,.14,1)",
      "cubic-bezier(.42,.01,.16,1)",
      "cubic-bezier(.18,.76,.1,1)"
    ];

    const tips = strokes.map((path) => {
      const clone = path.cloneNode(false);
      clone.classList.remove("mask-stroke");
      clone.classList.add("tip-stroke");
      tipGroup.appendChild(clone);
      return clone;
    });

    function prepareStroke(path) {
      const length = path.getTotalLength();
      path.style.setProperty("--dash", length);
      path.style.strokeDashoffset = length;
      path.style.opacity = 0;
      path.style.transition = "none";
      return length;
    }

    function prepareTip(path) {
      const length = path.getTotalLength();
      const tip = Math.max(40, Math.min(104, length * 0.52));
      path.style.strokeDasharray = `${tip} ${length + tip}`;
      path.style.strokeDashoffset = tip;
      path.style.opacity = 0;
      path.style.transition = "none";
      return { length, tip };
    }

    let frameId = 0;

    function stickyEase(t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      const accelerated = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const softened = t * t * (3 - 2 * t);
      return accelerated * 0.72 + softened * 0.28;
    }

    function eraseEase(t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      const pull = t < 0.42
        ? 2.9 * t * t
        : 1 - Math.pow(1 - t, 2.6);
      const smooth = t * t * (3 - 2 * t);
      return pull * 0.68 + smooth * 0.32;
    }

    function fadeTip(t) {
      if (t <= 0.06) return t / 0.06;
      if (t >= 0.88) return Math.max(0, (1 - t) / 0.12);
      return 1;
    }

    function clamp01(value) {
      return Math.max(0, Math.min(1, value));
    }

    function play() {
      cancelAnimationFrame(frameId);
      const lengths = strokes.map(prepareStroke);
      const tipData = tips.map(prepareTip);
      topRowFill.style.opacity = 0;
      bottomRowFill.style.opacity = 0;

      let cursor = 120;
      const timeline = strokes.map((path, index) => {
        const length = lengths[index];
        const beat = rhythm[index] || 0.85;
        const duration = Math.max(240, Math.min(760, length * 2.18 * beat));
        const overlap = syllableEnds.has(index) ? 0.54 : 0.63;
        const start = cursor;
        const end = start + duration;
        cursor += duration * overlap + (syllableEnds.has(index) ? 42 : -10);
        return { start, end, duration, length };
      });

      const topFillAt = timeline[13].end - 30;
      const bottomFillAt = timeline[32].end - 30;
      const writeEnd = cursor + 360;
      const holdAfterWrite = 760;

      let eraseCursor = writeEnd + holdAfterWrite;
      const eraseTimeline = timeline.map((item, index) => ({
        ...item,
        index,
        duration: Math.max(230, item.duration * 0.74 * (index % 4 === 1 ? 0.86 : 1))
      })).reverse().map((item, reverseIndex) => {
        const start = eraseCursor;
        const end = start + item.duration;
        const atSyllableEdge = syllableEnds.has(item.index - 1) || reverseIndex === 0;
        eraseCursor += item.duration * (atSyllableEdge ? 0.54 : 0.42) + (atSyllableEdge ? 34 : -24);
        return { ...item, start, end };
      });

      const loopEnd = eraseCursor + 520;
      const startTime = performance.now();

      function render(now) {
        const elapsed = (now - startTime) % loopEnd;

        timeline.forEach((item, index) => {
          const eraseItem = eraseTimeline.find((entry) => entry.index === index);
          const writeProgress = clamp01((elapsed - item.start) / item.duration);
          const eraseProgress = eraseItem ? clamp01((elapsed - eraseItem.start) / eraseItem.duration) : 0;
          const writeAmount = stickyEase(writeProgress);
          const eraseAmount = eraseEase(eraseProgress);
          const amount = eraseProgress > 0 ? 1 - eraseAmount : writeAmount;
          const progress = clamp01(amount);
          const tip = tips[index];
          const tipInfo = tipData[index];
          const activeWrite = writeProgress > 0 && writeProgress < 1;
          const activeErase = eraseProgress > 0 && eraseProgress < 1;

          strokes[index].style.opacity = progress > 0 ? 1 : 0;
          strokes[index].style.strokeDashoffset = item.length * (1 - progress);

          tip.style.opacity = (activeWrite || activeErase) ? fadeTip(activeWrite ? writeProgress : eraseProgress) * 0.7 : 0;
          tip.style.strokeDashoffset = activeErase
            ? -item.length + (item.length + tipInfo.tip) * eraseAmount
            : tipInfo.tip - (item.length + tipInfo.tip) * writeAmount;
        });

        const eraseStarted = elapsed > writeEnd + holdAfterWrite - 80;
        topRowFill.style.opacity = eraseStarted
          ? Math.max(0, 1 - (elapsed - (writeEnd + holdAfterWrite - 80)) / 260)
          : elapsed > topFillAt ? Math.min(1, (elapsed - topFillAt) / 360) : 0;
        bottomRowFill.style.opacity = eraseStarted
          ? Math.max(0, 1 - (elapsed - (writeEnd + holdAfterWrite - 80)) / 260)
          : elapsed > bottomFillAt ? Math.min(1, (elapsed - bottomFillAt) / 360) : 0;

        frameId = requestAnimationFrame(render);
      }

      frameId = requestAnimationFrame(render);
    }

    replay.addEventListener("click", play);
    play();

