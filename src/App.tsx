import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import Home from './pages/Home';
import RedirectPage from './pages/RedirectPage';
import Dashboard from './pages/Dashboard';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './auth/AuthContext';
import { AppHeader } from './components/AppHeader';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto p-4">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/:shortId" element={<RedirectPage />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;