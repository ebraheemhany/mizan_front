// app/[locale]/(marketing)/layout.tsx
import Header from '@/component/Header';
import Footer from '@/component/Footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}