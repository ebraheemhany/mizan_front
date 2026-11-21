// app/[locale]/(pages)/(dashboard)/template.tsx
// A template, unlike the layout, mounts again on every navigation: each page comes
// in with a short fade-and-rise, and so does content that replaces a loading spinner
// (globals.css: .page-shell). The sidebar and top bar (the layout) stay still.
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-shell">{children}</div>;
}
