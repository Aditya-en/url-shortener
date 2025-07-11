import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Button } from './ui/button';
import { ModeToggle } from './mode-toggle';
import { Github, LogOut } from 'lucide-react';

export function AppHeader() {
  const { user, signOut } = useAuth();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });
  };

  return (
    <header className="container mx-auto p-4 flex justify-between items-center border-b">
      <Link to="/" className="text-xl font-bold">
        Shorty
      </Link>
      <div className="flex items-center gap-4">
        <ModeToggle />
        {user ? (
          <>
            <Button variant="outline" asChild>
                <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </>
        ) : (
          <Button onClick={handleLogin}>
            <Github className="mr-2 h-4 w-4" /> Login with GitHub
          </Button>
        )}
      </div>
    </header>
  );
}