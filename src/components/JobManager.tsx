import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Trash2, Sparkles, AlertCircle, CheckCircle2, MoreHorizontal, Settings, Users, Send, Building2, Briefcase as BriefcaseIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const JobManager = ({ user }: { user: any }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    type: 'Full-time',
    salaryRange: '',
    fields: [] as any[]
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setJobs(data.filter((j:any) => j.creatorId === user.id));
      } else {
        console.error("Job fetch error or unexpected data:", data);
        setJobs([]);
      }
    } catch (err) {
      console.error(err);
      setJobs([]);
    }
  };

  const generateWithAi = async () => {
    if (!newJob.title) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a professional job description and requirements for the role: ${newJob.title}. 
                  Provide a JSON response with 'description', 'requirements' (bullet points), 'location' (suggested), and 'salaryRange' (suggested).`,
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text);
      setNewJob({ ...newJob, ...data });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const addField = () => {
    setNewJob({
      ...newJob,
      fields: [...newJob.fields, { label: '', type: 'text', isRequired: true }]
    });
  };

  const removeField = (index: number) => {
    setNewJob({
      ...newJob,
      fields: newJob.fields.filter((_, i) => i !== index)
    });
  };

  const updateField = (index: number, updates: any) => {
    const fields = [...newJob.fields];
    fields[index] = { ...fields[index], ...updates };
    setNewJob({ ...newJob, fields });
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newJob, creatorId: user.id }),
      });
      if (res.ok) {
        setIsCreating(false);
        setNewJob({ title: '', description: '', requirements: '', location: '', type: 'Full-time', salaryRange: '', fields: [] });
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Job Board Management</h2>
          <p className="text-sm text-muted-foreground">Post and manage active career opportunities.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Create New Job
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <BriefcaseIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-600">No active job postings</h3>
            <p className="text-sm text-slate-400 mb-6">Start your recruitment drive by posting your first job.</p>
            <Button variant="outline" onClick={() => setIsCreating(true)}>Get Started</Button>
          </div>
        )}
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-md transition-all border-slate-200 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100">{job.status}</Badge>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{job.type}</span>
              </div>
              <CardTitle className="text-lg pt-2">{job.title}</CardTitle>
              <CardDescription className="flex items-center gap-1 font-medium italic">
                <Settings className="w-3 h-3" /> {job.location || 'Remote'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {i}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-500">24 Applicants</span>
                </div>
                <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 font-bold text-xs uppercase tracking-wider">
                  View List
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {isCreating && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogContent className="max-w-[1500px] w-[98vw] max-h-[95vh] overflow-y-auto p-8">
              <DialogHeader>
                <div className="flex items-center justify-between pr-8">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Plus className="w-6 h-6 p-1 bg-primary text-white rounded" /> 
                    Post New Opportunity
                  </DialogTitle>
                  {user.company && (
                    <Badge variant="outline" className="text-indigo-600 border-indigo-100 bg-indigo-50 gap-1 h-6 px-2 font-bold transition-all">
                       <Building2 className="w-3.5 h-3.5" /> {user.company.name}
                    </Badge>
                  )}
                </div>
                <DialogDescription>
                  Fill in the details below. Use AI to generate a professional description in seconds.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Job Title</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="e.g. Senior Frontend Engineer" 
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        className="h-11"
                      />
                      <Button 
                        variant="secondary" 
                        className="h-11 px-4 gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                        onClick={generateWithAi}
                        disabled={isGenerating || !newJob.title}
                      >
                        {isGenerating ? <div className="w-4 h-4 border-2 border-indigo-700 border-t-transparent animate-spin rounded-full" /> : <Sparkles className="w-4 h-4" />}
                        {isGenerating ? "Generating..." : "AI Generate"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</Label>
                      <Input 
                        placeholder="e.g. San Francisco or Remote" 
                        value={newJob.location}
                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Employment Type</Label>
                      <Select 
                        value={newJob.type}
                        onValueChange={(val) => setNewJob({ ...newJob, type: val })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Job Description</Label>
                    <Textarea 
                      placeholder="What does the ideal candidate look like?" 
                      className="min-h-[150px] leading-relaxed"
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Core Requirements</Label>
                    <Textarea 
                      placeholder="Bullet points of required skills/experience..." 
                      className="min-h-[100px]"
                      value={newJob.requirements}
                      onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Application Fields
                      </h3>
                      <Button size="sm" variant="ghost" onClick={addField} className="text-xs font-bold text-indigo-600 gap-1 rounded-full hover:bg-indigo-50">
                        <Plus className="w-3 h-3" /> Add Field
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground italic">Add custom questions you want candidates to answer when applying.</p>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {newJob.fields.length === 0 && (
                        <div className="text-center py-6 text-slate-300 italic text-sm">No custom fields added yet.</div>
                      )}
                      {newJob.fields.map((field, idx) => (
                        <Card key={idx} className="p-3 border-slate-200">
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Field Label (e.g. Portfolio Link)" 
                                value={field.label}
                                onChange={(e) => updateField(idx, { label: e.target.value })}
                                className="flex-1 h-9"
                              />
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500" onClick={() => removeField(idx)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <Select 
                                value={field.type} 
                                onValueChange={(val) => updateField(idx, { type: val })}
                              >
                                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Short Text</SelectItem>
                                  <SelectItem value="textarea">Long Text</SelectItem>
                                  <SelectItem value="url">Link / URL</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-2 font-medium">
                                <span className={cn(field.isRequired ? "text-indigo-600" : "text-slate-400")}>
                                  {field.isRequired ? "Mandatory" : "Optional"}
                                </span>
                                <input 
                                  type="checkbox" 
                                  checked={field.isRequired}
                                  onChange={(e) => updateField(idx, { isRequired: e.target.checked })}
                                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Salary Range</Label>
                    <Input 
                      placeholder="e.g. $100k - $150k" 
                      value={newJob.salaryRange}
                      onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t pt-6">
                <Button variant="ghost" onClick={() => setIsCreating(false)}>Discard</Button>
                <Button onClick={handleSubmit} className="px-8 bg-indigo-600 hover:bg-indigo-700 h-11">
                  Post & Go Live <Send className="w-4 h-4 ml-2" />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

function BriefcaseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  )
}
