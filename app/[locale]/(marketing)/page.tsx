import Image from 'next/image';
import { useTranslations } from 'next-intl';
import CtaSection from '@/component/CtaSection';
import PricingCard from '@/component/PricingCard';
import HowItWorks from '@/component/HowItWorks';
import FeaturesSection from '@/component/FeaturesSection';
import WhyMizan from '@/component/WhyMizan';

import Hero from '@/component/Hero';
import FAQ from '@/component/FAQ';
export default function Home() {
  const t = useTranslations('Landing');
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
