// src/pages/Home.tsx
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Alias Link to avoid conflict
import { Link as LinkIcon, Copy, Shield, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// Define the structure of the expected API response
interface ShortenedUrlResponse {
  shortId: string;
  originalUrl: string;
  expiresAt: string; // Assuming API returns date as string ISO format
  isPasswordProtected: boolean;
  // Add other potential fields if necessary
}

// Define the structure for API error response
interface ApiErrorResponse {
    error: string;
}

const Home: React.FC = () => {
//   const { toast } = useToast();
  const [url, setUrl] = useState<string>('');
  const [customAlias, setCustomAlias] = useState<string>('');
  const [usePassword, setUsePassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [expiration, setExpiration] = useState<string>('30'); // Value from Select is string
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shortenedUrl, setShortenedUrl] = useState<ShortenedUrlResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>("create"); // State to control Tabs active value


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setShortenedUrl(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: url,
          customShortId: customAlias.trim() || null,
          expiresIn: parseInt(expiration), // API expects number
          password: usePassword ? password : null,
        }),
      });
      console.log("here sending req to")
      console.log(response)
      const data = await response.json();

      if (!response.ok) {
        // Type assertion for error data structure
        throw new Error((data as ApiErrorResponse).error || `HTTP error! Status: ${response.status}`);
      }

      // Type assertion for success data structure
      setShortenedUrl(data as ShortenedUrlResponse);
      setActiveTab("result"); // Switch to result tab on success
      toast('URL Shortened Successfully',{
        description: 'Your shortened URL is ready to use!',
      });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast('Error',{
          description: errorMessage,
        });
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
      setExpiration('30'); // Reset expiration to default
      setActiveTab("create"); // Switch back to create tab
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-2">
            <LinkIcon className="h-8 w-8" />
            URL Shortener
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Shorten your links with custom features and tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
           {/* Control Tabs value with state */}
           <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="create">Create Short URL</TabsTrigger>
              <TabsTrigger value="result" disabled={!shortenedUrl}>
                Your Short URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url">Enter your long URL</Label>
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/very-long-url-that-needs-shortening"
                      value={url}
                      onChange={handleUrlChange}
                      required
                      className="flex-1"
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
              {shortenedUrl && (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex justify-between items-center gap-2">
                      <p className="font-medium break-all flex-1">{`${window.location.origin}/${shortenedUrl.shortId}`}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(`${window.location.origin}/${shortenedUrl.shortId}`)}
                      >
                        <Copy className="h-5 w-5" />
                        <span className="sr-only">Copy URL</span>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-2 overflow-hidden">
                      <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Original URL</p>
                        <p className="text-sm text-muted-foreground truncate" title={shortenedUrl.originalUrl}>
                            {shortenedUrl.originalUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Expires on</p>
                        <p className="text-sm text-muted-foreground">
                          {/* Format the date string for display */}
                          {new Date(shortenedUrl.expiresAt).toLocaleDateString()}
                          {' '}
                          {new Date(shortenedUrl.expiresAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {shortenedUrl.isPasswordProtected && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <Shield className="h-5 w-5 text-yellow-500" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">This URL is password protected</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Button
                      variant="outline"
                      onClick={handleCreateAnother}
                    >
                      Create another URL
                    </Button>
                    <Button
                      asChild // Use asChild for RouterLink compatibility
                    >
                      <RouterLink to="/dashboard" className="flex items-center gap-2">
                         Go to Dashboard <ArrowRight className="h-4 w-4" />
                      </RouterLink>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-sm text-muted-foreground">
            View your shortened URLs in the{" "}
            <RouterLink to="/dashboard" className="font-medium underline underline-offset-4">
              Dashboard
            </RouterLink>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Home;