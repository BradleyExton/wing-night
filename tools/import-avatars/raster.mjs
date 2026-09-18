// The two raster steps the importer cannot do in plain Node: decoding the
// JPEG/PNG Gemini returns into RGBA pixels, and encoding RGBA back into a
// PNG. Both run in the Playwright-managed Chromium the repo already carries,
// on a canvas, so no image dependency is added. Everything between them
// (the knockout and the crop) is pure and lives in lib.mjs.
import { chromium } from "@playwright/test";

// The bodies of the two page.evaluate callbacks below run inside the browser
// page, not in Node, so the DOM globals they use are real there.
/* global Image, ImageData, document */

export const withRaster = async (run) => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    return await run({
      decode: async ({ mimeType, base64 }) => {
        const raw = await page.evaluate(async ({ mimeType, base64 }) => {
          const img = new Image();
          img.src = `data:${mimeType};base64,${base64}`;
          await img.decode();
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const context = canvas.getContext("2d");
          context.drawImage(img, 0, 0);
          const { data } = context.getImageData(0, 0, img.width, img.height);
          let binary = "";
          for (let index = 0; index < data.length; index += 0x8000) {
            binary += String.fromCharCode.apply(null, data.subarray(index, index + 0x8000));
          }
          return { width: img.width, height: img.height, base64: btoa(binary) };
        }, { mimeType, base64 });
        return { width: raw.width, height: raw.height, pixels: new Uint8ClampedArray(Buffer.from(raw.base64, "base64")) };
      },
      encodePng: async ({ pixels, width, height, crop }) => {
        const dataUrl = await page.evaluate(({ base64, width, height, crop }) => {
          const bytes = Uint8ClampedArray.from(atob(base64), (char) => char.charCodeAt(0));
          const source = document.createElement("canvas");
          source.width = width;
          source.height = height;
          source.getContext("2d").putImageData(new ImageData(bytes, width, height), 0, 0);
          const out = document.createElement("canvas");
          out.width = crop.width;
          out.height = crop.height;
          out.getContext("2d").drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
          return out.toDataURL("image/png");
        }, { base64: Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength).toString("base64"), width, height, crop });
        return Buffer.from(dataUrl.split(",")[1], "base64");
      }
    });
  } finally {
    await browser.close();
  }
};
