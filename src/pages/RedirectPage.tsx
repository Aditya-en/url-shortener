// src/pages/RedirectPage.tsx
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Shield, Lock } from 'lucide-react';

// Define expected API responses
interface RedirectSuccessResponse {
    originalUrl: string;
}

interface RedirectPasswordRequiredResponse {
    isPasswordProtected: true;
    error?: string; // Optional error message if provided by API
}

interface RedirectErrorResponse {
    error: string;
    isPasswordProtected?: false; // Can optionally clarify it's not password related
}

const RedirectPage: React.FC = () => {
  // useParams returns Readonly<Params<string>>. shortId should exist based on route.
  // Add a check or non-null assertion if needed, but route definition implies it.
  const { shortId } = useParams<{ shortId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUrlInfo = async () => {
      // Ensure shortId is defined before proceeding (good practice)
      if (!shortId) {
          setError('Invalid short URL identifier.');
          setIsLoading(false);
          return;
      }
      setIsLoading(true); // Reset loading state for fetch
      setError(''); // Clear previous errors

      try {
        // Initial check without password
        const response = await fetch(`/api/redirect/${shortId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Sending empty body to check status/password requirement first
          body: JSON.stringify({}),
        });

        const data = await response.json();

        if (response.ok) {
          // If no password required, redirect immediately
          window.location.href = (data as RedirectSuccessResponse).originalUrl;
          // No need to set loading false here as page navigates away
        } else if (response.status === 401 && (data as RedirectPasswordRequiredResponse)?.isPasswordProtected) {
          // Password protected URL
          setIsPasswordProtected(true);
          setError((data as RedirectPasswordRequiredResponse).error || 'Password required'); // Set initial message
          setIsLoading(false); // Stop loading, show password form
        } else {
          // URL not found, expired, or other error
          setError((data as RedirectErrorResponse).error || 'URL not found or has expired');
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching URL info:", err);
        setError('An error occurred while trying to fetch URL information.');
        setIsLoading(false);
      }
    };

    fetchUrlInfo();
    // Rerun effect if shortId changes (though unlikely in this page's lifecycle)
  }, [shortId]);

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shortId) return; // Should not happen if form is visible

    setIsLoading(true);
    setError(''); // Clear previous password errors

    try {
      const response = await fetch(`/api/redirect/${shortId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }), // Send password this time
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = (data as RedirectSuccessResponse).originalUrl;
      } else {
         // Use specific error from API or a generic one
         setError((data as RedirectErrorResponse).error || 'Invalid password or link error.');
         setIsLoading(false); // Keep loading false on error
      }
    } catch (err) {
      console.error("Error verifying password:", err);
      setError('An error occurred while verifying the password.');
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  // Show loading spinner only if not waiting for password
  if (isLoading && !isPasswordProtected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-lg">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show error message if there's an error AND we are not showing the password form
  if (error && !isPasswordProtected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Link Error</CardTitle>
            <CardDescription className="text-center">
              We couldn't find or access the page you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show password form if needed
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      {isPasswordProtected && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Shield className="h-6 w-6" />
              Password Protected Link
            </CardTitle>
            <CardDescription className="text-center">
              Please enter the password to access this link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    aria-describedby="password-error" // Link error message for accessibility
                  />
                </div>
                {/* Show password-specific errors here */}
                {error && <p id="password-error" className="text-sm text-destructive">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Access Link"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Return Home
            </Button>
          </CardFooter>
        </Card>
      )}
      {/* If !isPasswordProtected and no error/loading, this part is effectively unreachable */}
      {/* because the initial useEffect either redirects, sets error, or sets isPasswordProtected */}
    </div>
  );
};

export default RedirectPage;