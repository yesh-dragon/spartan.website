import { MarketingNav } from "../components/layout/MarketingNav";
import { Footer } from "../components/layout/Footer";
import { ScrollProgressBar } from "../components/shared/ScrollMotion";
import { Hero } from "../components/landing/Hero";
import { KineticDefenseGallery } from "../components/landing/KineticDefenseGallery";
import { AttackDemoLoop } from "../components/landing/AttackDemoLoop";
import { HowItWorksBento } from "../components/landing/HowItWorksBento";
import { FourPillars } from "../components/landing/FourPillars";
import { CodeSnippetTabs } from "../components/landing/CodeSnippetTabs";
import { CTASection } from "../components/landing/CTASection";

export function Landing() {
  return (
    <div className="relative min-h-dvh bg-canvas text-ink">
      <ScrollProgressBar />
      <div className="pointer-events-none fixed inset-0 ag-obsidian-aura" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 bg-soc-grid opacity-55" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 bg-noise-overlay" aria-hidden="true" />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <MarketingNav />
        <main className="flex-1">
          <Hero />
          <KineticDefenseGallery />
          <AttackDemoLoop />
          <HowItWorksBento />
          <FourPillars />
          <CodeSnippetTabs />
          <CTASection />
        </main>
        <Footer />
      </div>
    </div>
  );
}

