import { AnimatePresence } from 'framer-motion';
import { AddUrlForm } from './components/AddUrlForm';
import { Header } from './components/Header';
import { MonitorList } from './components/MonitorList';
import { OfflineBanner } from './components/OfflineBanner';
import { useMonitors } from './hooks/useMonitors';

export default function App() {
  const { monitors, isInitialLoading, isOffline, isAdding, addError, add, remove } = useMonitors();

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <AddUrlForm isAdding={isAdding} error={addError} onAdd={add} />

      <AnimatePresence>{isOffline && <OfflineBanner />}</AnimatePresence>

      <MonitorList monitors={monitors} isInitialLoading={isInitialLoading} onDelete={remove} />
    </div>
  );
}
