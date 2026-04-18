import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Search, MapPin, Briefcase, DollarSign, Sparkles, Filter, ArrowRight, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const JobPortal = ({ user }: { user: any }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationData, setApplicationData] = useState<Record<string, any>>({});
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userApplications, setUserApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchJobs();
    fetchProfile();
    fetchUserApplications();
  }, []);

  const fetchUserApplications = async () => {
    try {
      const res = await fetch(`/api/applications/user/${user.id}`);
      const data = await res.json();
      setUserApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch user applications:", err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      const jobList = Array.isArray(data) ? data : [];
      setJobs(jobList);
      setFilteredJobs(jobList);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setJobs([]);
      setFilteredJobs([]);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profiles/${user.id}`);
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    setFilteredJobs((Array.isArray(jobs) ? jobs : []).filter(job => 
      job.title.toLowerCase().includes(query) || 
      job.description.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query)
    ));
  }, [searchQuery, jobs]);

  const checkEligibility = async (job: any) => {
    if (!profile) return;
    setIsCheckingEligibility(true);
    setAiAnalysis(null);
    try {
      const prompt = `
        As an expert recruitment AI, analyze the match between this candidate and job.
        
        Job Details:
        Title: ${job.title}
        Description: ${job.description}
        Requirements: ${job.requirements}
        
        Candidate Profile:
        Bio: ${profile.bio}
        Skills: ${profile.skills}
        Experience: ${profile.experience}
        Education: ${profile.education}
        
        Provide a JSON response with:
        1. matchScore (0-100)
        2. reasoning (2-3 sentences)
        3. strengths (array of strings)
        4. gaps (array of strings)
        5. selectionProbability (Low, Medium, High)
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const analysis = JSON.parse(response.text);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error("Eligibility check failed:", err);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const submitApplication = async () => {
    setIsApplying(true);
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          answers: applicationData,
          aiScore: aiAnalysis?.matchScore || 0
        }),
      });
      if (res.ok) {
        setSelectedJob(null);
        setApplicationData({});
        setAiAnalysis(null);
        fetchUserApplications(); // Refresh applied status
      }
    } catch (err) {
      console.error("Application failed:", err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Opportunities</h1>
          <p className="text-muted-foreground">Find the perfect role that matches your skills using our AI-powered discovery.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by role, skill, or company..." 
              className="pl-10 h-10 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full flex flex-col hover:shadow-xl transition-all border-slate-200 overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge variant="secondary">{job.type}</Badge>
                    {job.company && (
                      <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {job.company.name}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Posted {new Date(job.createdAt).toLocaleDateString()}</div>
                </div>
                <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">{job.title}</CardTitle>
                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {job.location || 'Remote'}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" /> {job.salaryRange || 'Competitive'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>
                <div className="pt-4 mt-auto">
                  {userApplications.some(app => app.jobId === job.id) ? (
                    <Button className="w-full bg-green-50 text-green-600 border border-green-200 hover:bg-green-50 cursor-default shadow-none">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Applied
                    </Button>
                  ) : (
                    <Button 
                      className="w-full justify-between group/btn bg-slate-900 hover:bg-black"
                      onClick={() => {
                        setSelectedJob(job);
                        checkEligibility(job);
                      }}
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedJob && (
          <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
            <DialogContent className="max-w-[1500px] w-[98vw] max-h-[95vh] overflow-y-auto p-8">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
                    {selectedJob.company && (
                      <div className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> {selectedJob.company.name}
                      </div>
                    )}
                  </div>
                  <Badge className="text-sm">{selectedJob.type}</Badge>
                </div>
                <DialogDescription className="flex items-center gap-4 pt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedJob.location}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {selectedJob.category}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-6">
                <div className="lg:col-span-2 space-y-6">
                  <section>
                    <h4 className="font-bold text-lg mb-2">Job Description</h4>
                    <p className="text-slate-600 whitespace-pre-wrap">{selectedJob.description}</p>
                  </section>
                  
                  {selectedJob.requirements && (
                    <section>
                      <h4 className="font-bold text-lg mb-2">Requirements</h4>
                      <p className="text-slate-600 whitespace-pre-wrap">{selectedJob.requirements}</p>
                    </section>
                  )}

                  {selectedJob.fields && selectedJob.fields.length > 0 && (
                    <section className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                         Application Fields
                      </h4>
                      <div className="space-y-4">
                        {selectedJob.fields.map((field: any) => (
                          <div key={field.id} className="space-y-2">
                            <Label className="flex items-center gap-1">
                              {field.label}
                              {field.isRequired && <span className="text-red-500">*</span>}
                            </Label>
                            {field.type === 'textarea' ? (
                              <Textarea 
                                placeholder={field.label}
                                value={applicationData[field.id] || ''}
                                onChange={(e) => setApplicationData({ ...applicationData, [field.id]: e.target.value })}
                              />
                            ) : (
                              <Input 
                                placeholder={field.label}
                                value={applicationData[field.id] || ''}
                                onChange={(e) => setApplicationData({ ...applicationData, [field.id]: e.target.value })}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Sparkles className="w-16 h-16" />
                    </div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-700">
                      <Sparkles className="w-4 h-4" /> AI Match Analysis
                    </CardTitle>
                    
                    {isCheckingEligibility ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-medium text-indigo-600">Analyzing compatibility...</p>
                      </div>
                    ) : aiAnalysis ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Selection Probability</span>
                          <Badge className={
                            aiAnalysis.selectionProbability === 'High' ? 'bg-green-100 text-green-700' :
                            aiAnalysis.selectionProbability === 'Medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {aiAnalysis.selectionProbability}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                              <circle cx="32" cy="32" r="28" fill="transparent" stroke="#e0e7ff" strokeWidth="4" />
                              <circle cx="32" cy="32" r="28" fill="transparent" stroke="#6366f1" strokeWidth="4" strokeDasharray={`${aiAnalysis.matchScore * 1.76} 200`} />
                            </svg>
                            <span className="absolute text-sm font-bold">{aiAnalysis.matchScore}%</span>
                          </div>
                          <div className="text-xs text-slate-600 italic">
                            {aiAnalysis.reasoning}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-indigo-700 uppercase">Key Strengths</p>
                          <div className="flex flex-wrap gap-1">
                            {aiAnalysis.strengths.map((s: string) => (
                              <Badge key={s} variant="outline" className="text-[10px] bg-white">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        {aiAnalysis.gaps?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-amber-700 uppercase">Improvement Areas</p>
                            <div className="flex flex-wrap gap-1">
                              {aiAnalysis.gaps.map((g: string) => (
                                <Badge key={g} variant="outline" className="text-[10px] border-amber-200 text-amber-700">{g}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-2">
                        <AlertCircle className="w-8 h-8 text-indigo-300 mx-auto" />
                        <p className="text-xs text-indigo-600 px-4">Complete your profile to see your AI selection probability.</p>
                      </div>
                    )}
                  </div>

                  {userApplications.some(app => app.jobId === selectedJob.id) ? (
                    <div className="bg-green-50 border border-green-100 p-6 rounded-xl text-center space-y-2">
                       <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                       <h4 className="font-bold text-green-800">Application Submitted</h4>
                       <p className="text-sm text-green-600">You have already applied for this position. The recruiter will review your profile and update you soon.</p>
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200"
                      disabled={isApplying}
                      onClick={submitApplication}
                    >
                      {isApplying ? "Submitting..." : "Apply Now"}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};
