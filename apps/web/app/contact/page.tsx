import { StaticSitePage } from "../components/StaticSitePage";
import { sitePages } from "../lib/site-pages";

export default function ContactPage() {
  return <StaticSitePage content={sitePages.contact} />;
}
