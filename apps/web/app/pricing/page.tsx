import { StaticSitePage } from "../components/StaticSitePage";
import { sitePages } from "../lib/site-pages";

export default function PricingPage() {
  return <StaticSitePage content={sitePages.pricing} />;
}
