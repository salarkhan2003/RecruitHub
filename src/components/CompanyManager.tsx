import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Building2, Globe, MapPin, Save, Shield, ShieldCheck, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export const CompanyManager = ({ user }: { user: any }) => {
  const [company, setCompany] = useState<any>({
    name: '',
    description: '',
    website: '',
    industry: '',
    location: '',
    logo: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompany();
  }, [user.id]);

  const fetchCompany = async () => {
    try {
      const res = await fetch(`/api/companies/user/${user.id}`);
      const data = await res.json();
      if (data) {
        setCompany(data);
      }
    } catch (err) {
      console.error("Failed to fetch company:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveCompany = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...company, adminId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setCompany(data);
      }
    } catch (err) {
      console.error("Failed to save company:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading company profile...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Profile</h1>
            <p className="text-muted-foreground">Manage your company details and recruiter controls.</p>
          </div>
        </div>
        <Button onClick={saveCompany} disabled={isSaving} className="gap-2 shadow-lg shadow-indigo-100">
          {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Profile</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <div className="h-2 bg-indigo-500" />
            <CardHeader>
              <CardTitle className="text-xl">Basic Information</CardTitle>
              <CardDescription>Primary details displayed on job listings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    placeholder="Acme Inc." 
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input 
                    placeholder="Technology / Finance" 
                    value={company.industry}
                    onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <div className="flex gap-2">
                    <div className="bg-slate-50 border px-3 flex items-center rounded-md text-muted-foreground text-sm">
                      <Globe className="w-4 h-4" />
                    </div>
                    <Input 
                      placeholder="https://acme.org" 
                      value={company.website}
                      onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Primary Location</Label>
                  <div className="flex gap-2">
                    <div className="bg-slate-50 border px-3 flex items-center rounded-md text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <Input 
                      placeholder="New York, NY" 
                      value={company.location}
                      onChange={(e) => setCompany({ ...company, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>About the Organization</Label>
                <Textarea 
                  placeholder="Describe your company's mission and culture..." 
                  className="min-h-[150px]"
                  value={company.description}
                  onChange={(e) => setCompany({ ...company, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" /> RBAC & Controls
              </CardTitle>
              <CardDescription>Configure recruitment permissions and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Auto-Apply Branding</p>
                    <p className="text-xs text-muted-foreground">Automatically add company name to postings.</p>
                  </div>
                  <div className="h-6 w-11 bg-indigo-600 rounded-full flex items-center px-1">
                    <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between opacity-50">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Collaborative Review</p>
                    <p className="text-xs text-muted-foreground">Allow multiple recruiters to score apps.</p>
                  </div>
                  <div className="h-6 w-11 bg-slate-200 rounded-full flex items-center px-1">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                   Active Recruiters
                </h4>
                <div className="space-y-2">
                   <div className="flex items-center justify-between p-3 border rounded-xl bg-white">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold">{user.name} (You)</p>
                          <p className="text-[10px] text-muted-foreground">Admin Access</p>
                        </div>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Owner</Badge>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-indigo-900 text-white overflow-hidden">
             <div className="p-6 space-y-4 relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                   <ShieldCheck className="w-32 h-32" />
                </div>
                <h3 className="text-xl font-bold">Security & RBA</h3>
                <p className="text-indigo-200 text-sm">
                  Your organization is verified. All recruitment actions are logged and encrypted.
                </p>
                <div className="space-y-2 pt-4">
                   <div className="flex items-center gap-2 text-xs">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Enterprise Security Enabled</span>
                   </div>
                   <div className="flex items-center gap-2 text-xs">
                      <Users className="w-4 h-4 text-indigo-300" />
                      <span>Single Workspace Access</span>
                   </div>
                </div>
             </div>
          </Card>

          <Card className="border-none ring-1 ring-slate-200">
             <CardHeader>
                <CardTitle className="text-sm">Quick Statistics</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex justify-between items-end border-b pb-4">
                   <span className="text-sm text-muted-foreground">Active Jobs</span>
                   <span className="text-3xl font-bold">12</span>
                </div>
                <div className="flex justify-between items-end">
                   <span className="text-sm text-muted-foreground">Total Applications</span>
                   <span className="text-3xl font-bold">482</span>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
