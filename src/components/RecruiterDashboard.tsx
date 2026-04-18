import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, ClipboardList, BarChart3, Trash2, AlertCircle, Sparkles, Lock, Unlock, Download, Search, Tag, Pencil, X, Eye, CheckCircle2, XCircle, RefreshCw, Mail, Calendar, Send, MoreHorizontal, Settings, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { io } from 'socket.io-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { JobManager } from './JobManager';
import { TalentPool } from './TalentPool';
import { ApplicationReview } from './ApplicationReview';
import { CompanyManager } from './CompanyManager';
import { LayoutDashboard, Briefcase, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const socket = io();

export const RecruiterDashboard = () => {
  const { user } = useAuthStore();
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [error, setError] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState({ role: '', count: 5, difficulty: 'Intermediate' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Test Form
  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    duration: 30,
    category: 'General',
    questions: [{ text: '', options: ['', '', '', ''], correctAnswer: 0, isLocked: false }]
  });

  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    fetchTests();
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

  useEffect(() => {
    if (selectedTestId) {
      fetchResults(selectedTestId);
    }
  }, [selectedTestId]);

  useEffect(() => {
    socket.on("new_submission", (data) => {
      if (data.testId === selectedTestId) {
        fetchResults(selectedTestId);
      }
    });

    return () => {
      socket.off("new_submission");
    };
  }, [selectedTestId]);

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/tests');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTests(data);
        setError(null);
      } else {
        console.error("Expected array of tests, got:", data);
        setError(data.details || data.error || "Failed to load tests");
        setTests([]);
      }
    } catch (err) {
      console.error("Failed to fetch tests:", err);
      setError("Network error or server failure");
      setTests([]);
    }
  };

  const fetchResults = async (testId: string) => {
    try {
      const res = await fetch(`/api/tests/${testId}/results`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        console.error("Expected array of results, got:", data);
        setResults([]);
      }
    } catch (err) {
      console.error("Failed to fetch results:", err);
      setResults([]);
    }
  };

  const handleCreateTest = async () => {
    if (!newTest.title) {
      setError("Please provide a test title.");
      return;
    }
    
    const url = editingTestId ? `/api/tests/${editingTestId}` : '/api/tests';
    const method = editingTestId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTest, creatorId: user?.id }),
    });

    if (res.ok) {
      setIsCreating(false);
      setEditingTestId(null);
      fetchTests();
      setNewTest({
        title: '',
        description: '',
        duration: 30,
        category: 'General',
        questions: [{ text: '', options: ['', '', '', ''], correctAnswer: 0, isLocked: false }]
      });
    } else {
      const data = await res.json();
      if (data.details?.code === '23503') {
        setError("Your session has expired or your user record is missing from the database. Please logout and login again to refresh your session.");
      } else {
        setError(data.details?.message || data.error || "Failed to save test");
      }
    }
  };

  const handleEditClick = (test: any) => {
    setEditingTestId(test.id);
    setNewTest({
      title: test.title,
      description: test.description || '',
      duration: test.duration,
      category: test.category || 'General',
      questions: test.questions.map((q: any) => ({
        text: q.text,
        options: JSON.parse(q.options),
        correctAnswer: q.correctAnswer,
        isLocked: true
      }))
    });
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setEditingTestId(null);
    setNewTest({
      title: '',
      description: '',
      duration: 30,
      category: 'General',
      questions: [{ text: '', options: ['', '', '', ''], correctAnswer: 0, isLocked: false }]
    });
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.role) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate ${aiPrompt.count} multiple choice questions for a ${aiPrompt.role} role at ${aiPrompt.difficulty} difficulty.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  minItems: 4,
                  maxItems: 4
                },
                correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" }
              },
              required: ["text", "options", "correctAnswer"]
            }
          }
        }
      });

      const generated = JSON.parse(response.text || "[]");
      const formatted = generated.map((q: any) => ({
        ...q,
        isLocked: true
      }));

      setNewTest({
        ...newTest,
        questions: [...newTest.questions.filter(q => q.text !== ''), ...formatted]
      });
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setError("Failed to generate questions with AI. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addQuestion = () => {
    setNewTest({
      ...newTest,
      questions: [...newTest.questions, { text: '', options: ['', '', '', ''], correctAnswer: 0, isLocked: false }]
    });
  };

  const removeQuestion = (index: number) => {
    const updated = newTest.questions.filter((_, i) => i !== index);
    setNewTest({ ...newTest, questions: updated });
  };

  const toggleLock = (index: number) => {
    const updated = [...newTest.questions];
    updated[index].isLocked = !updated[index].isLocked;
    setNewTest({ ...newTest, questions: updated });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...newTest.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setNewTest({ ...newTest, questions: updatedQuestions });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updatedQuestions = [...newTest.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setNewTest({ ...newTest, questions: updatedQuestions });
  };

  const handleDeleteTest = async (testId: string) => {
    const res = await fetch(`/api/tests/${testId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchTests();
      if (selectedTestId === testId) setSelectedTestId(null);
      setTestToDelete(null);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to delete test");
      setTestToDelete(null);
    }
  };

  const exportResults = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Student,Score,Status,Date\n"
      + results.map(r => `${r.user.name},${r.score.toFixed(1)}%,${r.status},${new Date(r.completedAt || r.startedAt).toLocaleDateString()}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `results_${selectedTestId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTests = tests.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusForm, setStatusForm] = useState({
    recruitmentStatus: 'PENDING',
    interviewLink: '',
    recruiterNotes: ''
  });

  useEffect(() => {
    if (selectedSubmission) {
      setStatusForm({
        recruitmentStatus: selectedSubmission.recruitmentStatus || 'PENDING',
        interviewLink: selectedSubmission.interviewLink || '',
        recruiterNotes: selectedSubmission.recruiterNotes || ''
      });
    }
  }, [selectedSubmission]);

  const updateRecruitmentStatus = async () => {
    if (!selectedSubmission) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/submissions/${selectedSubmission.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setResults(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
        setSelectedSubmission(prev => ({ ...prev, ...updated }));
        setError(null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("Failed to update recruitment status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getScoreDistribution = () => {
    const distribution = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ];
    results.forEach(r => {
      if (r.score <= 20) distribution[0].count++;
      else if (r.score <= 40) distribution[1].count++;
      else if (r.score <= 60) distribution[2].count++;
      else if (r.score <= 80) distribution[3].count++;
      else distribution[4].count++;
    });
    return distribution;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-full animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <LayoutDashboard className="w-32 h-32" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
             Recruitment Suite
          </h1>
          <p className="text-muted-foreground mt-1">Orchestrate your talent pipeline and AI-driven assessments.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={checkDatabase} className="gap-2 border-slate-200">
            <Settings className={cn("w-4 h-4", isCheckingDb && "animate-spin")} /> Diagnostics
          </Button>
          <Button onClick={() => setIsCreating(!isCreating)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
            {isCreating ? 'Dismiss' : <><Plus className="w-4 h-4" /> New Assessment</>}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="assessments" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-xl h-12 w-full max-w-4xl shadow-sm grid grid-cols-5">
          <TabsTrigger value="assessments" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2">
            <ClipboardList className="w-4 h-4" /> Assessments
          </TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2">
            <Briefcase className="w-4 h-4" /> Job Board
          </TabsTrigger>
          <TabsTrigger value="applications" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2">
            <BarChart3 className="w-4 h-4" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="talents" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2">
            <Users className="w-4 h-4" /> Talent Pool
          </TabsTrigger>
          <TabsTrigger value="company" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2">
            <Building2 className="w-4 h-4" /> Company Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessments" className="space-y-6 focus-visible:outline-none">

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

      <AnimatePresence>
        {testToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete Assessment?</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. All student submissions for this test will also be permanently deleted.
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setTestToDelete(null)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleDeleteTest(testToDelete)}>Delete</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{editingTestId ? 'Edit Assessment' : 'Create Assessment'}</CardTitle>
                    <CardDescription>
                      {editingTestId ? 'Update the test details and questions.' : 'Define the test title, duration, and questions.'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleCancelCreate}>
                      <X className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-lg border border-primary/20">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Assisted</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Test Title</Label>
                    <Input 
                      placeholder="e.g. Senior Frontend Engineer Test" 
                      value={newTest.title}
                      onChange={(e) => setNewTest({...newTest, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input 
                      placeholder="e.g. Engineering, Marketing" 
                      value={newTest.category}
                      onChange={(e) => setNewTest({...newTest, category: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (Minutes)</Label>
                    <Input 
                      type="number" 
                      value={isNaN(newTest.duration) ? "" : newTest.duration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setNewTest({...newTest, duration: isNaN(val) ? 0 : val});
                      }}
                    />
                  </div>
                </div>

                <div className="bg-slate-100 p-4 rounded-xl border border-dashed border-slate-300 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Sparkles className="w-4 h-4" /> AI Question Generator
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <Input 
                      className="md:col-span-2"
                      placeholder="Role or Topic (e.g. React Hooks, Python Basics)" 
                      value={aiPrompt.role}
                      onChange={(e) => setAiPrompt({...aiPrompt, role: e.target.value})}
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">Count:</Label>
                      <Input 
                        type="number"
                        min={1}
                        max={20}
                        className="w-20"
                        value={aiPrompt.count}
                        onChange={(e) => setAiPrompt({...aiPrompt, count: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={aiPrompt.difficulty}
                      onChange={(e) => setAiPrompt({...aiPrompt, difficulty: e.target.value})}
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                    <Button 
                      onClick={handleAiGenerate} 
                      disabled={isGenerating || !aiPrompt.role}
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                    >
                      {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Questions ({newTest.questions.length})</h3>
                    <Button variant="outline" size="sm" onClick={addQuestion} className="gap-2">
                      <Plus className="w-4 h-4" /> Add Manual Question
                    </Button>
                  </div>
                  {newTest.questions.map((q, qIndex) => (
                    <Card key={qIndex} className="p-4 space-y-4 relative group">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Question {qIndex + 1}</Label>
                          {q.isLocked && <Badge variant="secondary" className="text-[10px] h-4 px-1 gap-1"><Lock className="w-2 h-2" /> AI Verified</Badge>}
                        </div>
                        <Input 
                          placeholder="Enter question text" 
                          value={q.text}
                          onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              name={`correct-${qIndex}`} 
                              checked={q.correctAnswer === oIndex}
                              disabled={q.isLocked}
                              onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                              className="w-4 h-4 accent-primary"
                            />
                            <Input 
                              placeholder={`Option ${String.fromCharCode(65 + oIndex)}`} 
                              value={opt}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              className={cn(q.correctAnswer === oIndex && "border-primary bg-primary/5")}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs gap-1 h-7"
                          onClick={() => toggleLock(qIndex)}
                        >
                          {q.isLocked ? <><Unlock className="w-3 h-3" /> Unlock Correct Answer</> : <><Lock className="w-3 h-3" /> Lock Correct Answer</>}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button onClick={handleCreateTest} className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20">
                  {editingTestId ? 'Update Assessment' : 'Publish Assessment'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSubmission && (
          <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
            <DialogContent className="max-w-[1500px] w-[98vw] max-h-[95vh] overflow-y-auto p-8">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Detailed Report: {selectedSubmission.user.name}
                </DialogTitle>
                <DialogDescription>
                  Reviewing submission for {selectedSubmission.test.title} ({selectedSubmission.score.toFixed(1)}%)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Recruitment Workflow
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Candidate Status</Label>
                      <Select 
                        value={statusForm.recruitmentStatus} 
                        onValueChange={(val) => setStatusForm(prev => ({ ...prev, recruitmentStatus: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending Review</SelectItem>
                          <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                          <SelectItem value="INTERVIEW_SCHEDULED">Interview Scheduled</SelectItem>
                          <SelectItem value="OFFER_SENT">Offer Sent</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Interview Link</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://meet.google.com/..." 
                          value={statusForm.interviewLink}
                          onChange={(e) => setStatusForm(prev => ({ ...prev, interviewLink: e.target.value }))}
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="shrink-0"
                          title="Copy Link"
                          onClick={() => {
                            if (statusForm.interviewLink) {
                              navigator.clipboard.writeText(statusForm.interviewLink);
                            }
                          }}
                        >
                          <ClipboardList className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Recruiter Notes</Label>
                    <Textarea 
                      placeholder="Add internal notes about this candidate..." 
                      className="min-h-[80px]"
                      value={statusForm.recruiterNotes}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, recruiterNotes: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={updateRecruitmentStatus} 
                      disabled={isUpdatingStatus}
                      className="flex-1 gap-2"
                    >
                      {isUpdatingStatus ? "Updating..." : "Update Status"}
                    </Button>
                    {statusForm.recruitmentStatus === 'SHORTLISTED' && (
                      <Button 
                        variant="outline"
                        onClick={() => setStatusForm(prev => ({ ...prev, recruitmentStatus: 'INTERVIEW_SCHEDULED' }))}
                        className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Calendar className="w-4 h-4" /> Schedule Interview
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" /> Question Breakdown
                  </h3>
                  {selectedSubmission.test.questions.map((q: any, idx: number) => {
                  const answers = JSON.parse(selectedSubmission.answers);
                  const studentAnswer = answers[q.id];
                  const options = JSON.parse(q.options);
                  const isCorrect = studentAnswer === q.correctAnswer;

                  return (
                    <div key={q.id} className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      isCorrect ? "border-green-100 bg-green-50/30" : "border-red-100 bg-red-50/30"
                    )}>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <h4 className="font-medium flex gap-2">
                          <span className="text-muted-foreground font-mono">Q{idx + 1}</span>
                          {q.text}
                        </h4>
                        {isCorrect ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Correct
                          </Badge>
                        ) : studentAnswer !== undefined ? (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 gap-1">
                            <XCircle className="w-3 h-3" /> Incorrect
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Unanswered</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {options.map((opt: string, oIdx: number) => (
                          <div 
                            key={oIdx} 
                            className={cn(
                              "p-3 rounded-lg border text-sm flex items-center gap-2",
                              oIdx === q.correctAnswer ? "border-green-500 bg-green-50 text-green-700 font-medium" : 
                              oIdx === studentAnswer ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 bg-white"
                            )}
                          >
                            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            {opt}
                            {oIdx === q.correctAnswer && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                            {oIdx === studentAnswer && !isCorrect && <XCircle className="w-4 h-4 ml-auto" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Active Tests
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tests..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredTests.map((test) => (
                <div 
                  key={test.id} 
                  className={cn(
                    "p-4 cursor-pointer transition-colors hover:bg-accent group",
                    selectedTestId === test.id && "bg-accent"
                  )}
                  onClick={() => setSelectedTestId(test.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium leading-none">{test.title}</h4>
                      {test.category && <Badge variant="outline" className="text-[10px] h-4 px-1">{test.category}</Badge>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">{test.duration}m</Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary"
                          onClick={(e) => { e.stopPropagation(); handleEditClick(test); }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => { e.stopPropagation(); setTestToDelete(test.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {test.questions?.length || 0} Questions
                  </p>
                </div>
              ))}
              {filteredTests.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No tests found matching your search.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <Tabs defaultValue="results">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Assessment Insights</CardTitle>
                <CardDescription>
                  {selectedTestId ? `Viewing data for ${tests.find(t => t.id === selectedTestId)?.title}` : 'Select a test to view results'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedTestId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => fetchResults(selectedTestId)}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
                {selectedTestId && results.length > 0 && (
                  <Button variant="outline" size="sm" onClick={exportResults} className="gap-2">
                    <Download className="w-4 h-4" /> Export
                  </Button>
                )}
                <TabsList>
                  <TabsTrigger value="results" className="gap-2">
                    <Users className="w-4 h-4" /> Results
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="gap-2">
                    <BarChart3 className="w-4 h-4" /> Analytics
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="results" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Test Status</TableHead>
                      <TableHead>Recruitment</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((res) => (
                      <TableRow key={res.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{res.user.name}</span>
                            <span className="text-[10px] text-muted-foreground">{res.user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={res.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[10px]">
                            {res.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[10px] gap-1",
                            res.recruitmentStatus === 'SHORTLISTED' ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200" :
                            res.recruitmentStatus === 'INTERVIEW_SCHEDULED' ? "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200" :
                            res.recruitmentStatus === 'OFFER_SENT' ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" :
                            res.recruitmentStatus === 'REJECTED' ? "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" :
                            "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200"
                          )}>
                            {res.recruitmentStatus === 'INTERVIEW_SCHEDULED' && <Calendar className="w-3 h-3" />}
                            {res.recruitmentStatus === 'OFFER_SENT' && <Send className="w-3 h-3" />}
                            {res.recruitmentStatus || 'PENDING'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-mono font-bold",
                            res.score >= 70 ? "text-green-600" : res.score >= 40 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {res.score?.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {res.recruitmentStatus === 'PENDING' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-[10px] border-blue-200 text-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedSubmission(res);
                                  setStatusForm(prev => ({ ...prev, recruitmentStatus: 'SHORTLISTED' }));
                                }}
                              >
                                Shortlist
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => setSelectedSubmission(res)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {results.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No submissions yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="analytics" className="mt-0">
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={getScoreDistribution()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {getScoreDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.2 + (index * 0.2)})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-center text-xs text-muted-foreground mt-4">Score Distribution (Percentage Range vs Student Count)</p>
                </div>
              </TabsContent>
            </CardContent>
            </Tabs>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="jobs">
        <JobManager user={user} />
      </TabsContent>

      <TabsContent value="applications">
        <ApplicationReview user={user} />
      </TabsContent>

      <TabsContent value="talents">
        <TalentPool />
      </TabsContent>

      <TabsContent value="company">
        <CompanyManager user={user} />
      </TabsContent>
    </Tabs>
  </div>
);
};
