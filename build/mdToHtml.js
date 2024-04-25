import hljs from "highlight.js";
import Markdown from "markdown-it";
/** Color highlighted code html */
export const mdToHtml = (md, title) => {
    const renderer = Markdown("commonmark", {
        highlight: (str, lang) => {
            const language = lang ? hljs.getLanguage(lang) : undefined;
            //   console.log({ str, lang, language });
            const code = language
                ? hljs.highlight(str, {
                    language: lang,
                    ignoreIllegals: true,
                }).value
                : renderer.utils.escapeHtml(str);
            return `<pre class="hljs" style="white-space: pre-wrap;"><code>${code}</code></pre>`;
        },
    });
    const rendered = renderer.render(md);
    return `<html>
  ${title ? `<head><title>${title}</title></head>` : ""}<body>
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

${rendered}

</body></html>`;
};
//# sourceMappingURL=mdToHtml.js.map