import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
export const addPageNumbers = async (
  absolutePath: string,
  outputPath: string,
) => {
  const document = await PDFDocument.load(fs.readFileSync(absolutePath));

  const courierBoldFont = await document.embedFont(StandardFonts.Courier);
  const pageIndices = document.getPageIndices();

  for (const pageIndex of pageIndices) {
    const page = document.getPage(pageIndex);

    page.drawText(`${pageIndex} of ${pageIndices.length - 1}`, {
      x: page.getWidth() / 2,
      y: 50,
      font: courierBoldFont,
      size: 18,
    });
  }

  fs.writeFileSync(outputPath, await document.save());
};
