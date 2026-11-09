import { Shortener } from "@/components/Shortener";
import { PageFrame } from "@/components/SiteChrome";
import { TopoBackground } from "@/components/TopoBackground";
import { siteConfig } from "@/lib/config";

export default function Home() {
  return (
    <PageFrame backdrop={<TopoBackground />}>
      <Shortener domain={siteConfig.shortDomain} />
    </PageFrame>
  );
}
