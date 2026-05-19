import { StaticSitePage } from "../components/StaticSitePage";
import { sitePages } from "../lib/site-pages";

export default function AboutPage() {
  return <StaticSitePage content={sitePages.about} />;
}
