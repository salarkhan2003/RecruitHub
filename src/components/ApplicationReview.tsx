import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Eye, CheckCircle2, XCircle, Clock, Sparkles, Filter, ChevronRight, Mail, Briefcase, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Settings } from 'lucide-react';

export const ApplicationReview = ({ user }: { user: any }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', recruiterNotes: '' });

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setJobs(data.filter((j:any) => j.creatorId === user.id));
      } else {
        setJobs([]);
      }
    } catch (err) { console.error(err); setJobs([]); }
  };

  const fetchApplications = async () => {
    try {
      const url = selectedJobId === 'all' ? `/api/applications/all` : `/api/jobs/${selectedJobId}/applications`;
      let data: any[] = [];
      const res = await fetch(url);
      const jsonData = await res.json();
      if (Array.isArray(jsonData)) {
        data = jsonData;
      }
      setApplications(data);
    } catch (err) { console.error(err); setApplications([]); }
  };

  const updateStatus = async () => {
    if (!selectedApp) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setApplications(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
        setSelectedApp(prev => ({ ...prev, ...updated }));
      }
    } catch (err) { console.error(err); }
    finally { setIsUpdating(false); }
  };

  useEffect(() => {
    if (selectedApp) {
      setStatusForm({
        status: selectedApp.status,
        recruiterNotes: selectedApp.recruiterNotes || ''
      });
    }
  }, [selectedApp]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPLIED': return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Applied</Badge>;
      case 'SHORTLISTED': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1"><CheckCircle2 className="w-3 h-3" /> Shortlisted</Badge>;
      case 'REJECTED': return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case 'INTERVIEW': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 gap-1"><Calendar className="w-3 h-3" /> Interviewing</Badge>;
      case 'OFFER': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1"><Sparkles className="w-3 h-3" /> Offer Sent</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Application Tracking System</h2>
          <p className="text-sm text-muted-foreground">Review and manage candidates through the recruitment pipeline.</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="All Jobs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Postings</SelectItem>
              {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">Candidate</TableHead>
              <TableHead className="font-bold">Job Role</TableHead>
              <TableHead className="font-bold">Match Score</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground italic">
                  No applications found for the selected criteria.
                </TableCell>
              </TableRow>
            )}
            {applications.map((app) => (
              <TableRow key={app.id} className="hover:bg-slate-50/50 group transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-200 group-hover:bg-white transition-colors">
                      {app.user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{app.user.name}</div>
                      <div className="text-xs text-muted-foreground">{app.user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                   <div className="font-medium">{app.job?.title || 'Unknown Job'}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-12 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${app.aiScore || 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{app.aiScore || 0}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(app.status)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="font-bold text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 ml-auto" onClick={() => setSelectedApp(app)}>
                    Review <ChevronRight className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AnimatePresence>
        {selectedApp && (
          <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
            <DialogContent className="max-w-[1500px] w-[98vw] max-h-[95vh] overflow-y-auto p-8">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold tracking-tight">Application Dossier</DialogTitle>
                  {getStatusBadge(selectedApp.status)}
                </div>
                <DialogDescription>
                  Reviewing {selectedApp.user.name} for the {selectedApp.job?.title} position.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 border-t mt-4">
                <div className="md:col-span-2 space-y-8">
                  <section className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" /> Candidate Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold">Skills</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedApp.user.profile?.skills && (typeof selectedApp.user.profile.skills === 'string' ? JSON.parse(selectedApp.user.profile.skills) : selectedApp.user.profile.skills).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-[10px] py-0 px-1 bg-white">{s}</Badge>
                          ))}
                        </div>
                        
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold block pt-2">Education</Label>
                        <div className="space-y-2">
                          {selectedApp.user.profile?.education && (typeof selectedApp.user.profile.education === 'string' ? JSON.parse(selectedApp.user.profile.education) : selectedApp.user.profile.education).map((edu: any, idx: number) => (
                            <div key={idx} className="text-xs">
                               <p className="font-bold">{edu.degree}</p>
                               <p className="text-muted-foreground">{edu.school}, {edu.year}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold">Resume Link</Label>
                        <a href={selectedApp.user.profile?.resumeUrl} target="_blank" rel="noreferrer" className="block text-indigo-600 hover:underline text-sm font-medium mt-1 truncate max-w-xs transition-all">
                          {selectedApp.user.profile?.resumeUrl || 'Not provided'}
                        </a>

                        <Label className="text-[10px] text-muted-foreground uppercase font-bold block pt-2">Experience</Label>
                        <div className="space-y-2">
                          {selectedApp.user.profile?.experience && (typeof selectedApp.user.profile.experience === 'string' ? JSON.parse(selectedApp.user.profile.experience) : selectedApp.user.profile.experience).map((exp: any, idx: number) => (
                            <div key={idx} className="text-xs">
                               <p className="font-bold">{exp.title} @ {exp.company}</p>
                               <p className="text-muted-foreground">{exp.period}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       Questionnaire Responses
                    </h4>
                    <div className="space-y-4">
                      {selectedApp.answers && Object.entries(JSON.parse(selectedApp.answers)).map(([fieldId, answer]: [any, any]) => {
                        const field = selectedApp.job?.fields?.find((f:any) => f.id === fieldId);
                        return (
                          <div key={fieldId} className="space-y-2 border-l-2 border-indigo-100 pl-4 py-1">
                             <div className="text-xs font-bold text-slate-700">{field?.label || 'Custom Question'}</div>
                             <div className="text-sm text-slate-600">{answer || 'Not provided'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                <div className="md:col-span-1 space-y-6">
                  <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><Settings className="w-12 h-12" /></div>
                    <div className="text-sm font-bold uppercase tracking-widest">Pipeline Actions</div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400 uppercase font-bold">Set Stage</Label>
                        <Select 
                          value={statusForm.status} 
                          onValueChange={(val) => setStatusForm({ ...statusForm, status: val })}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APPLIED">Applied</SelectItem>
                            <SelectItem value="SHORTLISTED">Shortlist</SelectItem>
                            <SelectItem value="INTERVIEW">Interview</SelectItem>
                            <SelectItem value="OFFER">Offer</SelectItem>
                            <SelectItem value="REJECTED">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400 uppercase font-bold">Recruiter Notes</Label>
                        <Textarea 
                          placeholder="Internal evaluation notes..." 
                          className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                          value={statusForm.recruiterNotes}
                          onChange={(e) => setStatusForm({ ...statusForm, recruiterNotes: e.target.value })}
                        />
                      </div>

                      <Button 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 transition-all"
                        onClick={updateStatus}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Processing..." : "Commit Update"}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-indigo-400 mb-2">Pro-Tip</div>
                    <p className="text-xs text-indigo-700 leading-normal italic">
                      "Move this candidate to 'Interview' to trigger a calendar invite automatically."
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};
