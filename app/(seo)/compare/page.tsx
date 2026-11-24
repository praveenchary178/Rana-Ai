import Hub, { hubMetadata } from "../../seo/Hub";
import { COMPARE, GUIDE, RIVALS, SEO_BY_PATH } from "../../seo/index";
export const metadata = hubMetadata("/compare", "RANA AI vs Ringg, Bolna, Vapi, Retell & Telecallers", "Honest comparisons of RANA AI with Indian and global voice AI platforms, human telecallers, IVR and missed-call services — for Indian businesses.");
export default function Page() { return <Hub path="/compare" eyebrow="Compare" h1="How RANA AI compares" intro="Honest, dated comparisons — including when the other option is the better choice." pages={[GUIDE, ...RIVALS, SEO_BY_PATH["/vapi-alternative-india"], ...COMPARE]} />; }
