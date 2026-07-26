// 简单的维基百科图片检索工具（浏览器端使用）
// 返回 { imageUrl, sourcePageUrl, sourceTitle } 或 null
export async function fetchWikipediaImage(name) {
  if (!name || !name.trim()) return null;
  const q = encodeURIComponent(name.trim());
  try {
    // 1) search for the page
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&origin=*`;
    const sResp = await fetch(searchUrl);
    const sJson = await sResp.json();
    const hits = sJson?.query?.search;
    if (!hits || hits.length === 0) return null;
    const title = hits[0].title; // take first match

    // 2) request page image & page url
    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages|info&piprop=original&inprop=url&format=json&origin=*`;
    const pResp = await fetch(pageUrl);
    const pJson = await pResp.json();
    const pages = pJson?.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    if (!pageId) return null;
    const page = pages[pageId];
    const imageUrl = page?.original?.source || null;
    const sourcePageUrl = page?.fullurl || null;
    const sourceTitle = page?.title || title;
    if (!imageUrl) return null;
    return { imageUrl, sourcePageUrl, sourceTitle };
  } catch (err) {
    console.warn("fetchWikipediaImage error", err);
    return null;
  }
}
