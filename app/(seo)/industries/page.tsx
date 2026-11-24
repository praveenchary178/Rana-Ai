import Hub, { hubMetadata } from "../../seo/Hub";
import { INDUSTRIES, FOR_PAGES } from "../../seo/index";
export const metadata = hubMetadata("/industries", "AI Voice Agents by Industry", "How AI voice agents answer and make calls for real estate, healthcare, education, e-commerce, finance, hospitality, poultry, retail and more in India.");
const FOR_CARDS = FOR_PAGES.map((f) => ({ path: f.path, label: f.label.replace(/^AI calling for /, ""), intro: "Use cases, sample calls and a live demo for this industry." }));
export default function Page() { return <Hub path="/industries" eyebrow="Industries" h1="AI voice agents for every industry that runs on calls" intro="Pick your industry to see the calls an AI voice agent answers and makes for you, a sample conversation, and what your team gets after every call." extra={FOR_CARDS} pages={INDUSTRIES} />; }
