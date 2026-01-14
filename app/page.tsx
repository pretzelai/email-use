import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { CodeExample } from "@/components/landing/code-example";
import { Features } from "@/components/landing/features";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Header />
      <main>
        <Hero />
        <CodeExample />
        <section id="features">
          <Features />
        </section>
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
