import { StaticSitePage } from "../components/StaticSitePage";
import { sitePages } from "../lib/site-pages";

export default function BlogPage() {
  return <StaticSitePage content={sitePages.blog} />;
}
