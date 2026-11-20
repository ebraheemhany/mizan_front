import { setRequestLocale } from 'next-intl/server';
import CtaSection from '@/component/CtaSection';
import PricingCard from '@/component/PricingCard';
import HowItWorks from '@/component/HowItWorks';
import FeaturesSection from '@/component/FeaturesSection';
import WhyMizan from '@/component/WhyMizan';

import Hero from '@/component/Hero';
import FAQ from '@/component/FAQ';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  // Static rendering: the locale comes from the URL, not from reading the request.
  setRequestLocale((await params).locale);
  return (
    <div>
      <Hero />
      <WhyMizan />
      <FeaturesSection />
      <HowItWorks />
      <PricingCard />
      <FAQ />
      <CtaSection />
    </div>
  );
}
