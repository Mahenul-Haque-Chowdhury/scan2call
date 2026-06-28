'use client';

import { motion } from 'framer-motion';

// Runs on every marketing route change, giving each page a quick fade-in.
// Opacity-only on purpose: a transform here would become a containing block
// and break any position:fixed children (modals, overlays).
export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
