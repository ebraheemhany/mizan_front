// components/app/AppSidebar.tsx
import Logo from '../Logo';
import PlanCard from './PlanCard';
import SidebarNav from './SidebarNav';

export default function AppSidebar() {
  return (
    <aside className="border-line bg-surface sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-e py-5 shadow-sm [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-line-strong [&::-webkit-scrollbar-thumb:hover]:bg-brand lg:flex">
      <div className="border-line mb-5 border-b px-6 pb-5">
        <Logo href="/dashboard" />
      </div>
      <div className="flex-1">
        <SidebarNav />
      </div>
      <div className="mt-auto px-3 pt-5">
        <PlanCard />
      </div>
    </aside>
  );
}
