import React, { useState, useEffect, ChangeEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Link as LinkIcon, ExternalLink, Shield, Calendar, BarChart2, Copy, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { useAuth } from '../auth/AuthContext';

interface UrlData {
  id: number;
  shortId: string;
  originalUrl: string;
  createdAt: string;
  expiresAt: string;
  clicks: number;
  isPasswordProtected: boolean;
}

const Dashboard: React.FC = () => {
  const { session, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [urls, setUrls] = useState<UrlData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }

    const fetchUrls = async () => {
      if (!session) return;
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/urls`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch URLs');
        }
        const data = await response.json();
        setUrls(data);
      } catch (error) {
        toast.error('Could not load your URLs.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUrls();
  }, [user, session, authLoading, navigate]);

  const copyToClipboard = (shortId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${shortId}`)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy URL.'));
  };

  const deleteUrl = async (shortIdToDelete: string) => {
    if (!session) return;
    
    // Optimistic UI update
    setUrls(currentUrls => currentUrls.filter(url => url.shortId !== shortIdToDelete));

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/urls/${shortIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Deletion failed on the server.');
        }

        toast.success(`URL /${shortIdToDelete} has been deleted.`);

    } catch (error) {
        toast.error('Failed to delete the URL. Please refresh and try again.');
        // Optional: Refetch URLs to get the correct state
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Function to safely format date (handles both Date objects and date strings)
  const formatDate = (dateInput: Date | string): string => {
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        // Check if date is valid after parsing/creation
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleDateString();
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date';
    }
  };


  const filteredUrls = urls.filter(url =>
    url.shortId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
     return (
        <div className="flex justify-center items-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
             <span className="sr-only">Loading...</span>
          </div>
          <span className="ml-3">Loading your dashboard...</span>
        </div>
      );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Shortened URLs</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your shortened links
          </p>
        </div>
        <Button asChild>
          <RouterLink to="/">Create New URL</RouterLink>
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by short ID or original URL..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" role="status">
             <span className="sr-only">Loading...</span>
          </div>
          <span className="ml-3">Loading your URLs...</span>
        </div>
      ) : filteredUrls.length > 0 ? (
        <div className="grid gap-6">
          {filteredUrls.map((url) => (
            <Card key={url.shortId} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <LinkIcon className="h-5 w-5 text-primary shrink-0" />
                      {/* Allow break-all for very long shortIDs if needed */}
                      <h3 className="font-medium text-lg break-all">
                        {window.location.origin}/{url.shortId}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap gap-2 md:gap-0 md:flex-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(url.shortId)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={`/${url.shortId}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit
                        </a>
                      </Button>
                      {/* Add confirmation before deleting */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the link for /${url.shortId}?`)) {
                                deleteUrl(url.shortId);
                            }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mb-4 overflow-hidden text-ellipsis whitespace-nowrap" title={url.originalUrl}>
                    Original: <a href={url.originalUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{url.originalUrl}</a>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p>{formatDate(url.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Expires</p>
                        <p>{formatDate(url.expiresAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <BarChart2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p>{url.clicks}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Shield className={`h-4 w-4 shrink-0 ${url.isPasswordProtected ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                      <div>
                         <p className="text-xs text-muted-foreground">Security</p>
                         <p className={!url.isPasswordProtected ? 'text-muted-foreground' : ''}>
                            {url.isPasswordProtected ? 'Password Set' : 'No Password'}
                         </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         // Different message depending on whether search is active
         <Card className="p-6 text-center">
            <div className="py-8 flex flex-col items-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                 <LinkIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'No Matching URLs Found' : 'No URLs Created Yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                 {searchTerm
                   ? `Your search for "${searchTerm}" did not return any results. Try refining your search.`
                   : 'Get started by shortening your first long URL.'}
              </p>
              {!searchTerm && (
                 <Button asChild>
                    <RouterLink to="/">Create Your First URL</RouterLink>
                 </Button>
              )}
            </div>
         </Card>
      )}
    </div>
  );
};

export default Dashboard;