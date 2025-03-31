// src/App.tsx
import { JSX } from 'react'; // Import React for JSX typings
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';
import Home from './pages/Home';
import RedirectPage from './pages/RedirectPage';
import Dashboard from './pages/Dashboard';
import { Toaster } from './components/ui/sonner';

function App(): JSX.Element {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto p-4">
            <div className="flex justify-end mb-4">
              <ModeToggle />
            </div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/:shortId" element={<RedirectPage />} />
            </Routes>
          </div>
        </div>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;