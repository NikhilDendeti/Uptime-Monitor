import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface AddUrlFormProps {
  isAdding: boolean;
  error: string | null;
  onAdd: (url: string) => Promise<void>;
}

export function AddUrlForm({ isAdding, error, onAdd }: AddUrlFormProps) {
  const [value, setValue] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      await onAdd(trimmed);
      setValue('');
    } catch {
      // error state is surfaced via the `error` prop
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            label="URL to monitor"
            hideLabel
            type="url"
            inputMode="url"
            placeholder="https://example.com"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>
        <Button type="submit" loading={isAdding} disabled={!value.trim()}>
          {!isAdding && <Plus className="h-4 w-4" strokeWidth={2} />}
          Add URL
        </Button>
      </form>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            role="alert"
            className="flex items-center gap-1.5 text-sm text-danger"
          >
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
