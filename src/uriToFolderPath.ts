/**
 * Do this later, assume we already have it for now
 *
 * Also, I've done part of this before, so let's find that first.
 */
export const uriToFolderPath = (context: {
  /** Can be
   * - absolute path
   * - project relative path
   * - relative path (from cli) --> absolute path
   * - url with pathname
   */
  uri: string;
}) => {
  /** Step 1:
   Get access to files
  
  - If it's a URL, download it into zip if it's downloadable and get the right chunk (e.g. github, drive, dropbox, wetransfer)
  - If it's a URL but no download can be found, look up the sitemap and scrape from the URL itself to find all paths that in scope of the URL
  - If it's a zipped file, unzip it and use the folder.
  - If it's a folder that is already on my file system, good.
  
  */
};
