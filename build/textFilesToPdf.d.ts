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
export declare const textFilesToPdf: (context: {
    absoluteFolderPath: string;
    destinationFolderPath: string;
}) => Promise<string>;
//# sourceMappingURL=textFilesToPdf.d.ts.map