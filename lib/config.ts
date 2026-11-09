import { shortDomain } from "./links/rules";

export const siteConfig = {
  shortDomain: shortDomain(),
  sourceUrl: process.env.NEXT_PUBLIC_SOURCE_URL || "https://github.com/Cage4D/url-shortener",
};
