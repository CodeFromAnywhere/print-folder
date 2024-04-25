import { textFilesToPdf } from "./textFilesToPdf.js";

textFilesToPdf({
  absoluteFolderPath: "/Users/king/Desktop/github/print-folder",
  destinationFolderPath: "/Users/king/Desktop/github/print-folder/assets",
}).then(console.log);
