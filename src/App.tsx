import { ThemeToggle } from './components/ThemeToggle';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Tasky Initialized</h1>
        <ThemeToggle />
      </div>
    </div>
  );
}
