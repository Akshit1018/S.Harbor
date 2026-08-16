function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function attr(tag: string, name: string): string {
  const re = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i");
  return tag.match(re)?.[1] ?? "";
}

export function exportOpml(
  channels: { id: string; title: string }[],
): string {
  const outlines = channels
    .map(
      (c) =>
        `    <outline type="rss" text="${escapeXml(c.title)}" title="${escapeXml(c.title)}" xmlUrl="https://www.youtube.com/feeds/videos.xml?channel_id=${c.id}"/>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>Harbor</title>
  </head>
  <body>
${outlines}
  </body>
</opml>
`;
}

export function parseOpml(xml: string): { id: string; title: string }[] {
  const found: { id: string; title: string }[] = [];
  const seen = new Set<string>();
  const re = /<outline\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const tag = m[0];
    const xmlUrl = attr(tag, "xmlUrl") || attr(tag, "htmlUrl");
    const title = attr(tag, "title") || attr(tag, "text");
    const id =
      xmlUrl.match(/channel_id=([A-Za-z0-9_-]+)/)?.[1] ??
      tag.match(/(UC[\w-]{22})/)?.[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    found.push({ id, title: title || id });
  }
  return found;
}

export function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
