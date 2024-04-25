import { explore } from "from-anywhere/node";
import fsPromises from "node:fs/promises";
// import puppeteer from "puppeteer";
import chromium from "chrome-aws-lambda";
import playwright from "playwright-core";
import { PDFDocument } from "pdf-lib";
import PDFMerger from "pdf-merger-js";
import { notEmpty, oneByOne, sum } from "from-anywhere";
import { mapMany } from "from-anywhere";
import { withoutExtension } from "from-anywhere";
import path from "node:path";
import { mdToHtml } from "./mdToHtml.js";
import { addPageNumbers } from "./addPageNumbers.js";
/**
Prints all documents found into a PDF ready for printing. This is the main overarching function that determines the whole process, and should be comprised of a set of smaller functions that are also usable standalone.

If I have this I can print my entire codebase to read in the sun. It'll also be easier to print things like website articles and eventually, social posts from friends. This is a first POC for the Screenless interface.

PROCESS:

1. ~~Get access to files~~
2. Search and filter files
3. Turn remaining files into HTML
4. Create PDF
5. ~~Print and deliver~~
*/
export const textFilesToPdf = async (context) => {
    const { absoluteFolderPath, destinationFolderPath } = context;
    /** If true, .gitignore will not be used as filter */
    const ignoreGitIgnore = false;
    // ensure explore allows ignoring build, public, node_modules, etc
    const ignoredFolders = [
        "build",
        "public",
        "node_modules",
        ".git",
        "out",
        ".vscode",
    ];
    /**
  Step 2:
  
  Search and filter files
  
  - Gitignore can be applied
  - Non-text files can be omitted
  - Long YAML, JSON or CSV can be omitted
  - Generated code can be omitted (both in src and build)
  */
    const results = await explore({
        basePath: absoluteFolderPath,
        ignore: ignoredFolders,
        extension: [
            "ts",
            "tsx",
            "html",
            "md",
            "txt",
            // NOT:
            //"json", "csv", "yaml", "js", "jsx"
        ],
    });
    /**
  Step 3:
  
  Turn remaining files into HTML
  
  - md becomes HTML
  - code gets wrapped in codeblock md, then becomes color-highlighted HTML
  - HTML remains HTML (mabye later, we'd want to simplify it to only keep the readable part)
  
  
  */
    const htmlFiles = (await Promise.all(results.map(async (item) => {
        const content = await fsPromises.readFile(item.path, "utf8");
        const title = item.path.slice(absoluteFolderPath.length + 1);
        if (item.path.endsWith(".html")) {
            const html = content;
            return { title, html, ...item };
        }
        if (item.path.endsWith(".md")) {
            const html = mdToHtml(content, title);
            return { title, html, ...item };
        }
        const extension = item.path.split(".").pop();
        const isCode = item.path.endsWith(".ts") || item.path.endsWith(".tsx");
        if (isCode) {
            //wrapped in codeblock md, then becomes color-highlighted HTML
            const md = `\`\`\`${extension}\n${content}\n\`\`\`\n`;
            const html = mdToHtml(md, title);
            return { title, html, ...item };
        }
        return;
    }))).filter(notEmpty);
    /**
  
  Step 4:
  - Input: list of html filepaths
  - Output: giant pdf with page indicators, file indicators, and a table of contents.
  
  1. For every file, make a PDF that has the file path in the header of each page, but no pagenumbers. For each generated pdf, determine how many pages.
  */
    const executablePath = process.env.NODE_ENV === "production"
        ? await chromium.executablePath
        : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    console.log({ executablePath });
    const browser = await playwright.chromium.launch({
        args: [...chromium.args, "--font-render-hinting=none", "--disable-gpu"], // This way fix rendering issues with specific fonts
        executablePath,
        headless: process.env.NODE_ENV === "production" ? chromium.headless : true,
    });
    const browserContext = await browser.newContext();
    //  const browser = await puppeteer.launch();
    const pdfPages = await mapMany(htmlFiles, async (item, index) => {
        console.log(`${index + 1}/${htmlFiles.length}`);
        const pathBasedName = withoutExtension(item.title).replaceAll("/", "_");
        const absoluteDestinationPath = path.join(destinationFolderPath, pathBasedName + ".pdf");
        const page = await browserContext.newPage();
        await page.setContent(item.html);
        await page.pdf({
            path: absoluteDestinationPath,
            format: "A4",
            outline: true,
            displayHeaderFooter: true,
            margin: { bottom: 100, top: 20, left: 20, right: 20 },
            scale: 1.5,
            footerTemplate: '<div style="font-size:20px; margin-left:20px;"><span class="title"></span> - <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
        });
        await page.close();
        // Open generated pdf and get pagecount
        const fileBuffer = await fsPromises.readFile(absoluteDestinationPath);
        const pdf = await PDFDocument.load(fileBuffer);
        const totalPages = pdf.getPageCount();
        return { title: item.title, totalPages, absoluteDestinationPath };
    }, 2);
    // 2. Based on the initial step, we also know which page every file starts. Create markdown for a table of contents. Turn that into a PDF as well. Get amount of pages for that as well.
    console.log("toc");
    const tableOfContents = pdfPages
        .map((item, index, array) => {
        const startPage = sum(array.slice(0, index).map((x) => x.totalPages)) + 1;
        return `- ${item.title} - ${startPage}`;
    })
        .join("\n");
    const page = await browserContext.newPage();
    await page.setContent(`<html><body><pre>${tableOfContents}</pre></body></html>`);
    const absoluteTocPath = path.join(destinationFolderPath, "toc.pdf");
    await page.pdf({
        path: absoluteTocPath,
        format: "A4",
        scale: 1.5,
        outline: true,
        displayHeaderFooter: true,
        margin: { bottom: 100, top: 20, left: 20, right: 20 },
    });
    await page.close();
    await browserContext.close();
    await browser.close();
    /**Merge toc and all pdfs together into one giant pdf (use https://www.npmjs.com/package/pdf-merger-js)*/
    const merger = new PDFMerger();
    const items = [
        { title: "TOC", totalPages: 1, absoluteDestinationPath: absoluteTocPath },
        ...pdfPages,
    ];
    await oneByOne(items, async (item) => {
        await merger.add(item.absoluteDestinationPath);
    });
    await merger.setMetadata({
        producer: "Script",
        author: "W",
        creator: "W",
        title: destinationFolderPath,
    });
    const mergedPath = path.join(destinationFolderPath, "merged.pdf");
    //save under given name and reset the internal document
    await merger.save(mergedPath);
    const outputPath = path.join(destinationFolderPath, "paged.pdf");
    /**  Last step: Use https://blog.logrocket.com/managing-pdfs-node-pdf-lib/#what-is-lib-pdf to put pagenumbers onto the giant pdf.*/
    await addPageNumbers(mergedPath, outputPath);
    /**
     * Cleanup: remove all files except paged.pdf
     */
    await Promise.all(items
        .map((x) => x.absoluteDestinationPath)
        .concat(mergedPath)
        .map((p) => fsPromises.rm(p)));
    return outputPath;
    // return absoluteGiantPdfPath;
};
//# sourceMappingURL=textFilesToPdf.js.map