import { createCn } from "cn/config"

// Class merging that knows Mizan's own radius and shadow tokens (globals.css), so a
// component's rounded-card / rounded-btn / shadow-float replaces the base primitive's
// rounded-xl / rounded-lg / shadow-lg instead of losing to it.
export const cn = createCn({
  extend: { theme: { radius: ["card", "btn", "btn-lg", "icon"], shadow: ["float"] } },
})
