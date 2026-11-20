// component/RouteLoading.tsx
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * The Suspense fallback of pages that read request data (a dynamic id or token in
 * the URL, or the query string). With Cache Components, that data must be read
 * inside Suspense so the rest of the page can be prerendered.
 */
export default function RouteLoading({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      className={cn(
        'text-muted flex items-center justify-center',
        fullScreen ? 'bg-canvas min-h-dvh' : 'py-20',
      )}
    >
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}
