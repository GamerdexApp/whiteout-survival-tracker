import { alt, size } from "@/app/opengraph-image";
import type { Metadata } from "next";
import { APP_NAME } from "@/data/nav";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
}

export const pageMetadata = ({
  title,
  description,
  path,
}: PageMetadataInput): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${title} | ${APP_NAME}`,
    description,
    url: path,
    images: [{ url: "/opengraph-image", ...size, alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${APP_NAME}`,
    description,
    images: [{ url: "/opengraph-image", alt }],
  },
});
