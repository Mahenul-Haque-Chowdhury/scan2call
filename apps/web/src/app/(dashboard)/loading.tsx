'use client';

import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-[60vh] items-center justify-center"
    >
      <Spinner size="lg" />
    </motion.div>
  );
}
