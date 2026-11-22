// Resize one Atlas plate for the card (tools/fetch-atlas-plates.py calls this):
//   node scripts/resize-plate.mjs <input> <output.jpg>
// 560 px wide at most, JPEG, prints {"width","height"} of the result.
import sharp from 'sharp';

const [input, output] = process.argv.slice(2);
const img = sharp(input, { limitInputPixels: false }).rotate().resize({ width: 560, withoutEnlargement: true }).flatten({ background: '#f9f3dd' }).jpeg({ quality: 78, mozjpeg: true });
const info = await img.toFile(output);
process.stdout.write(JSON.stringify({ width: info.width, height: info.height }));
