import { APP_NAME } from "@/data/nav";
import { SITE_DESCRIPTION, SITE_URL } from "@/data/site";

const webApplication = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: APP_NAME,
	description: SITE_DESCRIPTION,
	url: SITE_URL,
	applicationCategory: "GameApplication",
	operatingSystem: "Any",
	offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export function SiteJsonLd() {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(webApplication).replace(/</g, "\\u003c"),
			}}
		/>
	);
}
