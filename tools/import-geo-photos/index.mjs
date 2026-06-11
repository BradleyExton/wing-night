#!/usr/bin/env node
// Imports GPS-tagged photos as GEO minigame prompts:
//   pnpm import:geo <photo-folder>
// For each *.jpg/*.jpeg with EXIF GPS data it writes a resized,
// metadata-stripped copy to apps/client/public/local-assets/geo/ and appends
// a prompt (answer = the photo's GPS position) to
// content/local/minigames/geo.json. Titles default to the filename — edit
// them (and add hints) in the JSON afterwards.
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const assetsDir = join(repoRootDir, "apps/client/public/local-assets/geo");
const contentFilePath = join(repoRootDir, "content/local/minigames/geo.json");
const MAX_IMAGE_DIMENSION_PX = 1600;

const parseTiffGps = (tiff) => {
  const isLittleEndian = tiff.toString("ascii", 0, 2) === "II";
  const readU16 = (offset) =>
    isLittleEndian ? tiff.readUInt16LE(offset) : tiff.readUInt16BE(offset);
  const readU32 = (offset) =>
    isLittleEndian ? tiff.readUInt32LE(offset) : tiff.readUInt32BE(offset);

  const findIfdEntry = (ifdOffset, wantedTag) => {
    if (ifdOffset + 2 > tiff.length) {
      return null;
    }

    const entryCount = readU16(ifdOffset);

    for (let index = 0; index < entryCount; index += 1) {
      const entryOffset = ifdOffset + 2 + index * 12;

      if (entryOffset + 12 > tiff.length) {
        return null;
      }

      if (readU16(entryOffset) === wantedTag) {
        return entryOffset;
      }
    }

    return null;
  };

  const readAsciiRef = (gpsIfdOffset, tag) => {
    const entryOffset = findIfdEntry(gpsIfdOffset, tag);

    if (entryOffset === null) {
      return null;
    }

    return String.fromCharCode(tiff[entryOffset + 8]);
  };

  const readDegrees = (gpsIfdOffset, tag) => {
    const entryOffset = findIfdEntry(gpsIfdOffset, tag);

    if (entryOffset === null) {
      return null;
    }

    const componentCount = readU32(entryOffset + 4);
    const valueOffset = readU32(entryOffset + 8);
    let degrees = 0;

    for (let index = 0; index < Math.min(componentCount, 3); index += 1) {
      const numerator = readU32(valueOffset + index * 8);
      const denominator = readU32(valueOffset + index * 8 + 4);

      if (denominator === 0) {
        return null;
      }

      degrees += numerator / denominator / 60 ** index;
    }

    return degrees;
  };

  const gpsPointerEntry = findIfdEntry(readU32(4), 0x8825);

  if (gpsPointerEntry === null) {
    return null;
  }

  const gpsIfdOffset = readU32(gpsPointerEntry + 8);
  const latitudeRef = readAsciiRef(gpsIfdOffset, 0x0001);
  const latitude = readDegrees(gpsIfdOffset, 0x0002);
  const longitudeRef = readAsciiRef(gpsIfdOffset, 0x0003);
  const longitude = readDegrees(gpsIfdOffset, 0x0004);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    lat: latitudeRef === "S" ? -latitude : latitude,
    lng: longitudeRef === "W" ? -longitude : longitude
  };
};

const readJpegGps = (buffer) => {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      return null;
    }

    const marker = buffer[offset + 1];

    if (marker === 0xda || marker === 0xd9) {
      return null;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);

    if (
      marker === 0xe1 &&
      buffer.toString("ascii", offset + 4, offset + 10) === "Exif\0\0"
    ) {
      return parseTiffGps(buffer.subarray(offset + 10, offset + 2 + segmentLength));
    }

    offset += 2 + segmentLength;
  }

  return null;
};

// Drops APP1-APP15 and comment segments (EXIF/GPS, XMP, etc.) so the served
// image cannot leak the answer coordinates; keeps APP0 and the image data.
const stripJpegMetadata = (buffer) => {
  const keptSegments = [buffer.subarray(0, 2)];
  let offset = 2;

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      break;
    }

    const marker = buffer[offset + 1];

    if (marker === 0xda) {
      keptSegments.push(buffer.subarray(offset));
      break;
    }

    const segmentEnd = offset + 2 + buffer.readUInt16BE(offset + 2);
    const isMetadataSegment = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;

    if (!isMetadataSegment) {
      keptSegments.push(buffer.subarray(offset, segmentEnd));
    }

    offset = segmentEnd;
  }

  return Buffer.concat(keptSegments);
};

const toSlug = (fileName) => {
  return basename(fileName, extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const toTitle = (slug) => {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const isValidCoordinate = (position) => {
  return (
    Number.isFinite(position.lat) &&
    Number.isFinite(position.lng) &&
    Math.abs(position.lat) <= 90 &&
    Math.abs(position.lng) <= 180
  );
};

const photoFolder = process.argv[2];

if (photoFolder === undefined || !existsSync(photoFolder)) {
  console.error("Usage: pnpm import:geo <photo-folder>");
  process.exit(1);
}

const photoFileNames = readdirSync(photoFolder).filter((fileName) =>
  /\.jpe?g$/i.test(fileName)
);

if (photoFileNames.length === 0) {
  console.error(`No .jpg/.jpeg photos found in ${photoFolder}.`);
  console.error("(HEIC is not supported — export/shoot as JPEG.)");
  process.exit(1);
}

const existingContent = existsSync(contentFilePath)
  ? JSON.parse(readFileSync(contentFilePath, "utf8"))
  : { prompts: [] };
const existingIds = new Set(existingContent.prompts.map((prompt) => prompt.id));
const tempDir = mkdtempSync(join(tmpdir(), "geo-import-"));
const importedPrompts = [];
const skippedFileNames = [];

mkdirSync(assetsDir, { recursive: true });

for (const fileName of photoFileNames) {
  const sourcePath = join(photoFolder, fileName);
  const gpsPosition = readJpegGps(readFileSync(sourcePath));

  if (gpsPosition === null || !isValidCoordinate(gpsPosition)) {
    skippedFileNames.push(fileName);
    continue;
  }

  const slug = toSlug(fileName);
  const promptId = `geo-${slug}`;

  if (existingIds.has(promptId)) {
    console.log(`= ${fileName} already imported (${promptId}); skipping.`);
    continue;
  }

  const resizedPath = join(tempDir, `${slug}.jpg`);
  execFileSync("/usr/bin/sips", [
    "-Z",
    String(MAX_IMAGE_DIMENSION_PX),
    "-s",
    "format",
    "jpeg",
    sourcePath,
    "--out",
    resizedPath
  ], { stdio: "ignore" });

  writeFileSync(
    join(assetsDir, `${slug}.jpg`),
    stripJpegMetadata(readFileSync(resizedPath))
  );

  importedPrompts.push({
    id: promptId,
    title: toTitle(slug),
    imageSrc: `/local-assets/geo/${slug}.jpg`,
    answer: {
      lat: Number(gpsPosition.lat.toFixed(6)),
      lng: Number(gpsPosition.lng.toFixed(6))
    }
  });
  existingIds.add(promptId);
  console.log(
    `+ ${fileName} -> ${promptId} (${gpsPosition.lat.toFixed(5)}, ${gpsPosition.lng.toFixed(5)})`
  );
}

rmSync(tempDir, { recursive: true, force: true });

if (importedPrompts.length > 0) {
  mkdirSync(join(repoRootDir, "content/local/minigames"), { recursive: true });
  writeFileSync(
    contentFilePath,
    `${JSON.stringify(
      { prompts: [...existingContent.prompts, ...importedPrompts] },
      null,
      2
    )}\n`
  );
}

for (const fileName of skippedFileNames) {
  console.log(`! ${fileName} has no GPS data; skipped.`);
}

console.log(
  `\nImported ${importedPrompts.length} prompt(s) into content/local/minigames/geo.json.`
);

if (importedPrompts.length > 0) {
  console.log("Edit the titles (and add hints) there before game night.");
  console.log("Restart the server to pick up the new content.");
}
