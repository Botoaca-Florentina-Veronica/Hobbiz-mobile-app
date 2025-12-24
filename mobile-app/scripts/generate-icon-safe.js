const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const assetsDir = path.join(__dirname, '..', 'assets', 'images');
    const srcPath = path.join(assetsDir, 'puzzle.png');
    if (!fs.existsSync(srcPath)) {
      console.error('Source puzzle.png not found at', srcPath);
      process.exit(1);
    }

    // Create a square canvas (1024x1024) with transparent background
    const size = 1024;
    const destPath = path.join(assetsDir, 'puzzle_safe.png');

    const srcImage = await Jimp.read(srcPath);

    // Resize source image to fit within ~48% of canvas while preserving aspect
    // Slightly larger than before so the foreground appears a bit bigger but still framed
    const maxContent = Math.floor(size * 0.48);
    srcImage.contain(maxContent, maxContent, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);

    // Create canvas
    const canvas = new Jimp(size, size, 0x00000000);

    // Compute position to center the source
    const x = Math.floor((size - srcImage.bitmap.width) / 2);
    const y = Math.floor((size - srcImage.bitmap.height) / 2);

    canvas.composite(srcImage, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 1,
    });

    // Optionally add subtle padding/shadow (skipped to keep icon clean)

    // Backup previous generated icon if exists
    if (fs.existsSync(destPath)) {
      const bak = path.join(assetsDir, 'puzzle_safe.bak.png');
      try { fs.copyFileSync(destPath, bak); console.log('Backed up previous icon to', bak); } catch (e) { /* ignore */ }
    }

    await canvas.writeAsync(destPath);
    console.log('Generated', destPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();