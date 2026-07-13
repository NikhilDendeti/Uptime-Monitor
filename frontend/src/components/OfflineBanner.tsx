import { motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
      role="status"
      className="flex items-center gap-2 rounded-lg border border-border bg-warning-bg px-3 py-2 text-sm text-warning"
    >
      <WifiOff className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      Can&apos;t reach the server. Showing the last known status — retrying automatically.
    </motion.div>
  );
}
