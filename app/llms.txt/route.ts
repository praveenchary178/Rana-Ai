// /llms.txt — a plain-text map of the public site for AI assistants and AI search (same idea as sitemap.xml, but readable).
// Built from the SEO page data and blog posts, so it never drifts from the real pages.
import { ALL_SEO } from "../seo/index";
import { listPosts } from "@/lib/posts";

export const revalidate = 900;

const SITE = "https://ranaai.in";
const GROUPS: [string, string][] = [
  ["solution", "Solutions"], ["pricing", "Pricing"], ["language", "Languages"], ["industry", "Industries"],
  ["city", "Cities"], ["compare", "Comparisons"], ["tool", "Tools"], ["glossary", "Glossary"],
];
const line = (title: string, path: string, desc: string) => `- [${title}](${SITE}${path}): ${desc.replace(/\s+/g, " ").trim()}`;

export async function GET() {
  const posts = await listPosts();
  const out: string[] = [
    "# RANA AI",
    "",
    "> RANA AI is an AI voice agent and AI calling agent for Indian businesses, based in Hyderabad. It answers inbound calls and places outbound calls in 11 Indian languages plus English, scores every lead hot, warm or cold, and alerts the business's team. Plans are monthly, priced in rupees, and set up by the RANA team.",
    "",
    `Website: ${SITE} · Contact: hello@ranaai.in`,
  ];
  for (const [kind, title] of GROUPS) {
    const pages = ALL_SEO.filter((p) => p.kind === kind);
    if (!pages.length) continue;
    out.push("", `## ${title}`, "", ...pages.map((p) => line(p.label, p.path, p.description)));
  }
  if (posts.length) out.push("", "## Blog", "", ...posts.map((p) => line(p.title, `/blog/${p.slug}`, p.description)));
  return new Response(out.join("\n") + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
