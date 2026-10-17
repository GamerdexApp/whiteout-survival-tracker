"use client";

import { Footer } from "@/comps/layout/Footer";
import { AllPages } from "./AllPages";
import { ClosingCta } from "./ClosingCta";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { LandingTopBar } from "./LandingTopBar";
import { Languages } from "./Languages";
import { Numbers } from "./Numbers";
import { Privacy } from "./Privacy";
import { Screens } from "./Screens";
import { Tools } from "./Tools";

export function LandingPage() {
	return (
		<div className="bg-bg flex min-h-dvh flex-col">
			<LandingTopBar />
			<main id="main" className="flex-1">
				<Hero />
				<HowItWorks />
				<Screens />
				<Features />
				<Tools />
				<Numbers />
				<Languages />
				<AllPages />
				<Privacy />
				<Faq />
				<ClosingCta />
			</main>
			<Footer />
		</div>
	);
}
