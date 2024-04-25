#!/usr/bin/env node

import { textFilesToPdf } from "./textFilesToPdf.js";
import path from "node:path";
// import { fileURLToPath } from "node:url";
// const __filename = fileURLToPath(import.meta.url);

const [basePath, options] = process.argv.slice(2);

const realBasePath =
  !basePath || basePath.startsWith(".")
    ? path.join(process.cwd(), basePath || ".")
    : basePath;

textFilesToPdf({
  absoluteFolderPath: realBasePath,
  destinationFolderPath: process.cwd(),
}).then(console.log);
