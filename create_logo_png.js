import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, "public", "assets", "manthan360-logo.svg");
const pngPath = path.join(__dirname, "public", "assets", "manthan360-logo.png");

if (fs.existsSync(svgPath)) {
  fs.copyFileSync(svgPath, pngPath);
  console.log("Logo created successfully at:", pngPath);
}
