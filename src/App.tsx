import React, { useState, useEffect } from 'react';
import { useAuthStore } from './lib/store';
import { Auth } from './components/Auth';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { CandidatePortal } from './components/CandidatePortal';
import { StudentExamRoom } from './components/StudentExamRoom';
import { Button } from './components/ui/button';
import { LogOut, User as UserIcon, Briefcase } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function App() {
  const { user, logout, setUser } = useAuthStore();
  const [activeTest, setActiveTest] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const syncUser = async (email: string, session: any, retryCount = 0) => {
      try {
        // First, check if server is healthy
        const healthRes = await fetch('/api/health').catch(() => null);
        if (!healthRes || !healthRes.ok) {
          if (retryCount < 10) {
            const delay = Math.min(1000 * Math.pow(1.5, retryCount), 5000);
            setTimeout(() => syncUser(email, session, retryCount + 1), delay);
            return;
          }
          throw new Error("Server not responding after multiple attempts");
        }

        const res = await fetch(`/api/me?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // Sync if missing from DB
          const resLogin = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email, 
              name: session.user.user_metadata.full_name || email, 
              role: session.user.user_metadata.role || 'STUDENT' 
            }),
          });
          if (resLogin.ok) {
            const userData = await resLogin.json();
            setUser(userData);
          }
        }
      } catch (err) {
        console.error(`Auth sync attempt ${retryCount + 1} failed:`, err);
        if (retryCount < 5) { // Increased retries
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
          setTimeout(() => syncUser(email, session, retryCount + 1), delay);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const email = session.user.email;
        if (email) {
          syncUser(email, session);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setIsValidating(false);
    });

    // Initial check
    const checkSession = async (retryCount = 0) => {
      try {
        // First, check if server is healthy
        const healthRes = await fetch('/api/health').catch(() => null);
        if (!healthRes || !healthRes.ok) {
          if (retryCount < 10) {
            const delay = Math.min(1000 * Math.pow(1.5, retryCount), 5000);
            setTimeout(() => checkSession(retryCount + 1), delay);
            return;
          }
          throw new Error("Server not responding after multiple attempts");
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email;
          if (email) {
            const res = await fetch(`/api/me?email=${encodeURIComponent(email)}`);
            if (res.ok) {
              const userData = await res.json();
              setUser(userData);
            }
          }
        }
        setIsValidating(false);
      } catch (err) {
        console.error(`Initial session check attempt ${retryCount + 1} failed:`, err);
        if (retryCount < 5) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setTimeout(() => checkSession(retryCount + 1), delay);
        } else {
          setIsValidating(false);
        }
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, [setUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (user.role === 'RECRUITER') {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <nav className="bg-white border-b px-6 py-3 sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center max-w-7xl">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">R</div>
              RecruitHub
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-accent rounded-full">
                <UserIcon className="w-4 h-4" />
                {user.name}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </div>
          </div>
        </nav>
        <RecruiterDashboard />
      </div>
    );
  }

  // Student Flow
  if (activeTest) {
    return <StudentExamRoom test={activeTest} onExit={() => setActiveTest(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <nav className="bg-white border-b px-6 py-3 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">S</div>
            CandidatePortal
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-accent rounded-full">
              <UserIcon className="w-4 h-4" />
              {user.name}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </nav>
      <CandidatePortal user={user} onSelectTest={(test) => setActiveTest(test)} />
    </div>
  );
}
