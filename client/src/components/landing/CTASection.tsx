import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "../shared/Button";
import { BorderBeam } from "../shared/Card";
import { ParallaxMedia, ScrollReveal } from "../shared/ScrollMotion";

export function CTASection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-2xl border border-hairline-bright bg-surface p-8 text-center shadow-panel sm:p-14">
            <BorderBeam tone="accent" />
            <ParallaxMedia
              src="/assets/agent-sandbox-perimeter.jpg"
              alt=""
              ariaHidden
              fillParent
              width={1376}
              height={768}
              shiftY={26}
              scaleRange={[1.06, 1.15]}
              className="z-0 pointer-events-none"
              imgClassName="opacity-20"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-surface via-surface/80 to-surface/65"
            />
            <div className="relative z-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-5 font-display text-fluid-h2 font-bold tracking-tight text-ink">
                Test the attack before attackers do
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-ink-muted sm:text-base">
                Spin up a private demo sandbox seeded with 6 realistic attack emails. Toggle Guard OFF
                to watch MailPilot get hijacked, then flip Guard ON and verify the SHA-256 ledger.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <Link to="/signup">
                  <Button variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                    Try the demo
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">
                    Sign in to existing workspace
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

