import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, BookOpen, PlayCircle, LogOut, AlertCircle, Search, Filter, History, CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TestListProps {
  onSelectTest: (test: any) => void;
}

export const TestList: React.FC<TestListProps> = ({ onSelectTest }) => {
  const { user, logout } = useAuthStore();
  const [tests, setTests] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    fetchTests();
    fetchSubmissions();
  }, []);

  const checkDatabase = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/debug/db');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error("Failed to check database:", err);
    } finally {
      setIsCheckingDb(false);
    }
  };

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/tests');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTests(data);
        setError(null);
      } else {
        setError(data.details || data.error || "Failed to load tests");
      }
    } catch (err: any) {
      setError("Network error or server failure");
    }
  };

  const fetchSubmissions = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/submissions/user/${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubmissions(data);
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    }
  };

  const categories = ['All', ...new Set(tests.map(t => t.category || 'General'))];

  const filteredTests = tests.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (t.category || 'General') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto p-6 max-w-full space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Available Assessments</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}. Select a test to begin.</p>
        </div>
        <Button variant="ghost" onClick={logout} className="gap-2 text-muted-foreground hover:text-destructive">
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5" /> Database Connection Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              There was an error connecting to the database. This usually means the required tables haven't been created yet in your Supabase project.
            </p>
            <div className="bg-slate-950 p-4 rounded-md overflow-x-auto">
              <pre className="text-xs text-slate-300 font-mono">
                {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
              </pre>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkDatabase} 
                disabled={isCheckingDb}
                className="w-fit gap-2"
              >
                <Sparkles className={cn("w-4 h-4", isCheckingDb && "animate-spin")} />
                {isCheckingDb ? "Checking Tables..." : "Run Database Diagnostic"}
              </Button>

              {dbStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(dbStatus).map(([table, status]: [string, any]) => (
                    <div key={table} className={cn(
                      "p-2 rounded border text-xs flex flex-col gap-1",
                      status.status === 'ok' ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                    )}>
                      <span className="font-bold">{table}</span>
                      <span>{status.status === 'ok' ? "Ready" : "Missing/Error"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Action Required: Please ensure you have run the SQL setup script in your Supabase SQL Editor. You can find the required SQL in the <strong>setup.sql</strong> file in this project.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="available" className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="available" className="gap-2">
              <BookOpen className="w-4 h-4" /> Available Tests
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" /> My History
            </TabsTrigger>
          </TabsList>

          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search assessments..." 
                className="pl-8 bg-white" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <TabsContent value="available" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <Card key={test.id} className="flex flex-col hover:shadow-xl transition-all duration-300 border-none bg-white group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {test.category || 'General'}
                    </Badge>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <Clock className="w-3 h-3" /> {test.duration}m
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{test.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2">
                    {test.description || 'No description provided for this assessment.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {test.questions?.length || 0} Questions
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto pt-6">
                  {submissions.some(s => s.testId === test.id && s.status === 'COMPLETED') ? (
                    <Button disabled className="w-full gap-2 h-11 font-semibold bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
                      <CheckCircle2 className="w-4 h-4" /> Assessment Completed
                    </Button>
                  ) : (
                    <Button onClick={() => onSelectTest(test)} className="w-full gap-2 h-11 font-semibold shadow-sm">
                      <PlayCircle className="w-4 h-4" /> Start Assessment
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
            {filteredTests.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Search className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-600">No assessments found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or category filter.</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold">Assessment</th>
                    <th className="px-6 py-4 font-bold">Category</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{sub.test?.title}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[10px]">{sub.test?.category || 'General'}</Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(sub.completedAt || sub.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn(
                          sub.status === 'COMPLETED' ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" : "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200"
                        )}>
                          {sub.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <History className="w-8 h-8 opacity-20" />
                          <p>You haven't taken any assessments yet.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
