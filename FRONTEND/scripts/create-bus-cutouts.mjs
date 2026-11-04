import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processCutouts() {
  const dayInputPath = '/Users/dsceimaclab01/.gemini/antigravity-ide/brain/309160e8-6028-4bd2-9c08-ce697225f5cb/bus_cutout_day_1791527449399.jpg';
  const nightInputPath = '/Users/dsceimaclab01/.gemini/antigravity-ide/brain/309160e8-6028-4bd2-9c08-ce697225f5cb/bus_cutout_night_1791527486093.jpg';

  const outDirPub = '/Users/dsceimaclab01/SMART RORUTE/FRONTEND/public/assets';
  const outDirSrc = '/Users/dsceimaclab01/SMART RORUTE/FRONTEND/src/assets';

  // 1. Process Day Bus (flood fill from borders for white/near-white)
  console.log('Processing Day Bus...');
  const dayImg = sharp(dayInputPath);
  const dayMeta = await dayImg.metadata();
  const { width: dW, height: dH } = dayMeta;
  const dayRaw = await dayImg.ensureAlpha().raw().toBuffer();

  // Flood fill from borders
  const visitedDay = new Uint8Array(dW * dH);
  const queueDay = [];

  const isDayBg = (idx) => {
    const r = dayRaw[idx * 4];
    const g = dayRaw[idx * 4 + 1];
    const b = dayRaw[idx * 4 + 2];
    return r > 240 && g > 240 && b > 240;
  };

  // Add all 4 borders to queue
  for (let x = 0; x < dW; x++) {
    queueDay.push(x, 0); // top border
    queueDay.push(x, dH - 1); // bottom border
  }
  for (let y = 0; y < dH; y++) {
    queueDay.push(0, y); // left border
    queueDay.push(dW - 1, y); // right border
  }

  let head = 0;
  while (head < queueDay.length) {
    const x = queueDay[head++];
    const y = queueDay[head++];
    const idx = y * dW + x;

    if (visitedDay[idx]) continue;
    visitedDay[idx] = 1;

    if (isDayBg(idx)) {
      // mark alpha transparent
      dayRaw[idx * 4 + 3] = 0;

      // check neighbors
      if (x > 0 && !visitedDay[idx - 1] && isDayBg(idx - 1)) queueDay.push(x - 1, y);
      if (x < dW - 1 && !visitedDay[idx + 1] && isDayBg(idx + 1)) queueDay.push(x + 1, y);
      if (y > 0 && !visitedDay[idx - dW] && isDayBg(idx - dW)) queueDay.push(x, y - 1);
      if (y < dH - 1 && !visitedDay[idx + dW] && isDayBg(idx + dW)) queueDay.push(x, y + 1);
    }
  }

  // Smooth edge pixels (1-pixel anti-aliasing)
  for (let y = 1; y < dH - 1; y++) {
    for (let x = 1; x < dW - 1; x++) {
      const idx = y * dW + x;
      if (dayRaw[idx * 4 + 3] !== 0) {
        // if neighbor is transparent and this pixel is bright, soften alpha
        const r = dayRaw[idx * 4];
        const g = dayRaw[idx * 4 + 1];
        const b = dayRaw[idx * 4 + 2];
        const hasTransparentNeighbor =
          dayRaw[(idx - 1) * 4 + 3] === 0 ||
          dayRaw[(idx + 1) * 4 + 3] === 0 ||
          dayRaw[(idx - dW) * 4 + 3] === 0 ||
          dayRaw[(idx + dW) * 4 + 3] === 0;

        if (hasTransparentNeighbor && r > 220 && g > 220 && b > 220) {
          const brightness = (r + g + b) / 3;
          const alpha = Math.max(0, Math.min(255, Math.round((255 - brightness) * 4)));
          dayRaw[idx * 4 + 3] = alpha;
        }
      }
    }
  }

  const dayPngBuffer = await sharp(dayRaw, {
    raw: { width: dW, height: dH, channels: 4 }
  }).png().toBuffer();

  fs.writeFileSync(path.join(outDirPub, 'bus-cutout-day.png'), dayPngBuffer);
  fs.writeFileSync(path.join(outDirSrc, 'bus-cutout-day.png'), dayPngBuffer);
  console.log('Saved bus-cutout-day.png successfully!');

  // 2. Process Night Bus (flood fill from borders for black/near-black)
  console.log('Processing Night Bus...');
  const nightImg = sharp(nightInputPath);
  const nightMeta = await nightImg.metadata();
  const { width: nW, height: nH } = nightMeta;
  const nightRaw = await nightImg.ensureAlpha().raw().toBuffer();

  const visitedNight = new Uint8Array(nW * nH);
  const queueNight = [];

  const isNightBg = (idx) => {
    const r = nightRaw[idx * 4];
    const g = nightRaw[idx * 4 + 1];
    const b = nightRaw[idx * 4 + 2];
    return r < 18 && g < 18 && b < 18;
  };

  for (let x = 0; x < nW; x++) {
    queueNight.push(x, 0);
    queueNight.push(x, nH - 1);
  }
  for (let y = 0; y < nH; y++) {
    queueNight.push(0, y);
    queueNight.push(nW - 1, y);
  }

  head = 0;
  while (head < queueNight.length) {
    const x = queueNight[head++];
    const y = queueNight[head++];
    const idx = y * nW + x;

    if (visitedNight[idx]) continue;
    visitedNight[idx] = 1;

    if (isNightBg(idx)) {
      nightRaw[idx * 4 + 3] = 0;

      if (x > 0 && !visitedNight[idx - 1] && isNightBg(idx - 1)) queueNight.push(x - 1, y);
      if (x < nW - 1 && !visitedNight[idx + 1] && isNightBg(idx + 1)) queueNight.push(x + 1, y);
      if (y > 0 && !visitedNight[idx - nW] && isNightBg(idx - nW)) queueNight.push(x, y - 1);
      if (y < nH - 1 && !visitedNight[idx + nW] && isNightBg(idx + nW)) queueNight.push(x, y + 1);
    }
  }

  // Soften glow on edge pixels for realistic night contour
  for (let y = 1; y < nH - 1; y++) {
    for (let x = 1; x < nW - 1; x++) {
      const idx = y * nW + x;
      if (nightRaw[idx * 4 + 3] !== 0) {
        const r = nightRaw[idx * 4];
        const g = nightRaw[idx * 4 + 1];
        const b = nightRaw[idx * 4 + 2];
        const hasTransparentNeighbor =
          nightRaw[(idx - 1) * 4 + 3] === 0 ||
          nightRaw[(idx + 1) * 4 + 3] === 0 ||
          nightRaw[(idx - nW) * 4 + 3] === 0 ||
          nightRaw[(idx + nW) * 4 + 3] === 0;

        if (hasTransparentNeighbor && r < 35 && g < 35 && b < 35) {
          const darkness = (r + g + b) / 3;
          const alpha = Math.max(0, Math.min(255, Math.round(darkness * 4)));
          nightRaw[idx * 4 + 3] = alpha;
        }
      }
    }
  }

  const nightPngBuffer = await sharp(nightRaw, {
    raw: { width: nW, height: nH, channels: 4 }
  }).png().toBuffer();

  fs.writeFileSync(path.join(outDirPub, 'bus-cutout-night.png'), nightPngBuffer);
  fs.writeFileSync(path.join(outDirSrc, 'bus-cutout-night.png'), nightPngBuffer);
  console.log('Saved bus-cutout-night.png successfully!');
}

processCutouts().catch(err => {
  console.error(err);
  process.exit(1);
});
