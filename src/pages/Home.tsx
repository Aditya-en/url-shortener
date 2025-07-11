import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as LinkIcon, Copy, Shield, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface ShortenedUrlResponse {
  shortId: string;
  originalUrl: string;
  expiresAt: string;
  isPasswordProtected: boolean;
}

interface ApiErrorResponse {
  error: string;
}

const Home: React.FC = () => {
  const { session, user } = useAuth();
  const [url, setUrl] = useState<string>('');
  const [customAlias, setCustomAlias] = useState<string>('');
  const [usePassword, setUsePassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [expiration, setExpiration] = useState<string>('30');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shortenedUrl, setShortenedUrl] = useState<ShortenedUrlResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>("create");

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!session) {
        toast.error("Please log in to create a short URL.");
        return;
    }

    setIsLoading(true);
    setShortenedUrl(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          originalUrl: url,
          customShortId: customAlias.trim() || undefined,
          expiresIn: parseInt(expiration),
          password: usePassword ? password : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as ApiErrorResponse).error || `HTTP error! Status: ${response.status}`);
      }

      setShortenedUrl(data as ShortenedUrlResponse);
      setActiveTab("result");
      toast.success('URL Shortened Successfully');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error('Error', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast('Copied to clipboard',{
          description: 'The URL has been copied to your clipboard',
        });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast('Error',{
          description: 'Failed to copy URL to clipboard',
        });
      });
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleAliasChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomAlias(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  // Handler for Switch change - Shadcn Switch passes checked state
  const handleUsePasswordChange = (checked: boolean) => {
    setUsePassword(checked);
    if (!checked) {
      setPassword(''); // Clear password if protection is disabled
    }
  };

  // Handler for Select change - Shadcn Select passes the value string
  const handleExpirationChange = (value: string) => {
    setExpiration(value);
  };

  const handleCreateAnother = () => {
      setUrl('');
      setCustomAlias('');
      setPassword('');
      setUsePassword(false);
      setShortenedUrl(null);
      setExpiration('30');
      setActiveTab("create");
  };

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to Shorty</h1>
            <p className="text-xl text-muted-foreground mb-8">The simple, powerful, and open-source URL shortener.</p>
            <Button size="lg" onClick={handleLogin}>
                Login with GitHub to Get Started
            </Button>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center pt-10">
      <Card className="w-full max-w-3xl">
          {/* CardHeader, CardContent with form, and CardFooter remain largely the same */}
          {/* Ensure the submit button is disabled if the user is not logged in */}
           <CardHeader>
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-2">
            <LinkIcon className="h-8 w-8" />
            Create a New Short URL
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Welcome, {user.email || 'friend'}! Let's shorten a link.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="result" disabled={!shortenedUrl}>
                Result
              </TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form fields are the same as in your original file */}
                <div className="space-y-2">
                  <Label htmlFor="url">Enter your long URL</Label>
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/very-long-url-that-needs-shortening"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-alias">Custom alias (optional)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="custom-alias"
                      placeholder="my-custom-url"
                      value={customAlias}
                      onChange={handleAliasChange}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Leave empty for a random short URL. Use letters, numbers, dashes, underscores.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="expiration">Link expiration</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <Select value={expiration} onValueChange={handleExpirationChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select expiration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-protection">Password protection</Label>
                      <Switch
                        id="password-protection"
                        checked={usePassword}
                        onCheckedChange={handleUsePasswordChange}
                      />
                    </div>
                    {usePassword && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter password"
                          value={password}
                          onChange={handlePasswordChange}
                          required={usePassword} // Only required if switch is on
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !url}>
                  {isLoading ? "Generating..." : "Shorten URL"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="result">
              {shortenedUrl ? (
                <div className="space-y-6 text-center">
                  <h3 className="text-2xl font-semibold">Your Link is Ready!</h3>
                  <div className="space-y-2">
                    <Label htmlFor="short-url">Your shortened URL</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="short-url"
                        readOnly
                        value={`${window.location.origin}/${shortenedUrl.shortId}`}
                        className="flex-1"
                      />
                      <Button asChild variant="secondary" size="icon">
                        <a 
                          href={`${window.location.origin}/${shortenedUrl.shortId}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Visit</span>
                        </a>
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(`${window.location.origin}/${shortenedUrl.shortId}`)}
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={handleCreateAnother} className="w-full sm:w-auto">
                      <ArrowRight className="mr-2 h-4 w-4" /> Create Another
                    </Button>
                    <Button variant="secondary" asChild className="w-full sm:w-auto">
                      <RouterLink to="/dashboard">Go to Dashboard</RouterLink>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Your result will appear here after creating a link.</p>
                </div>
              )}
            </TabsContent>
           </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;