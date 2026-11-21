// component/AuthCard.tsx
// The frame of the small account pages (forgot password, new password, confirm email).
import Logo from '@/component/Logo';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-canvas min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <Logo />
        <div className="rounded-card border-line bg-surface mt-8 border p-5 shadow-[0_18px_48px_-32px_rgba(15,42,32,0.35)] sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
