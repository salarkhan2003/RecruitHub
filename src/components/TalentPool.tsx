import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, User, Mail, Sparkles, Filter, ExternalLink, GraduationCap, Briefcase, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export const TalentPool = () => {
  const [talents, setTalents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTalent, setSelectedTalent] = useState<any>(null);

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    try {
      const res = await fetch('/api/talents');
      const data = await res.json();
      setTalents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTalents([]);
    }
  };

  const filteredTalents = (Array.isArray(talents) ? talents : []).filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.profile?.skills && (typeof t.profile.skills === 'string') && JSON.parse(t.profile.skills).some((s:string) => s.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Talent Pool / Leaderboard</h2>
          <p className="text-sm text-muted-foreground">Discover potential candidates based on skills and performance.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or skill..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filters</Button>
        </div>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">Candidate</TableHead>
              <TableHead className="font-bold">Top Skills</TableHead>
              <TableHead className="font-bold">Resume Analysis</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTalents.map((talent) => {
              const skills = talent.profile?.skills ? JSON.parse(talent.profile.skills) : [];
              return (
                <TableRow key={talent.id} className="hover:bg-slate-50/50 group transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {talent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{talent.name}</div>
                        <div className="text-xs text-muted-foreground">{talent.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 3).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-[10px] py-0 px-1.5 h-5 bg-white border-slate-200 shadow-sm">{s}</Badge>
                      ))}
                      {skills.length > 3 && <span className="text-[10px] text-muted-foreground font-medium">+{skills.length - 3} more</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {talent.profile?.resumeText ? (
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-100 gap-1 text-[10px]">
                        <Sparkles className="w-3 h-3" /> AI Indexed
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No resume data</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="font-bold text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 ml-auto" onClick={() => setSelectedTalent(talent)}>
                      View Profile <ExternalLink className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <AnimatePresence>
        {selectedTalent && (
          <Dialog open={!!selectedTalent} onOpenChange={() => setSelectedTalent(null)}>
            <DialogContent className="max-w-[1500px] w-[98vw] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl p-0">
              <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                <div className="absolute -bottom-12 left-8 border-4 border-white rounded-full bg-white">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold">
                    {selectedTalent.name.charAt(0)}
                  </div>
                </div>
              </div>
              <div className="pt-16 pb-8 px-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      {selectedTalent.name} 
                      <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50/50">Elite Candidate</Badge>
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedTalent.email}</p>
                  </div>
                  <Button className="gap-2 shadow-lg shadow-indigo-100"><Zap className="w-4 h-4" /> Invite to Job</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 block">Professional Bio</h4>
                      <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-indigo-100 pl-4 py-1">
                        {selectedTalent.profile?.bio || 'No bio provided.'}
                      </p>
                    </section>
                    <section>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 block">Education & Certs</h4>
                      <div className="space-y-3">
                        {selectedTalent.profile?.education ? (
                          (typeof selectedTalent.profile.education === 'string' ? JSON.parse(selectedTalent.profile.education) : selectedTalent.profile.education).map((edu: any, idx: number) => (
                            <div key={idx} className="flex gap-3">
                              <GraduationCap className="w-5 h-5 text-indigo-500 shrink-0" />
                              <div className="text-sm">
                                <p className="font-bold">{edu.degree}</p>
                                <p className="text-xs text-muted-foreground">{edu.school}, {edu.year}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No education details provided.</p>
                        )}
                        {(!selectedTalent.profile?.education || (typeof selectedTalent.profile.education === 'string' ? JSON.parse(selectedTalent.profile.education).length === 0 : selectedTalent.profile.education.length === 0)) && (
                          <p className="text-xs text-muted-foreground italic">No education details provided.</p>
                        )}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 block">Skill Set Analysis</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTalent.profile?.skills && (typeof selectedTalent.profile.skills === 'string' ? JSON.parse(selectedTalent.profile.skills) : selectedTalent.profile.skills).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">{skill}</Badge>
                        ))}
                      </div>
                    </section>
                    <section>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 block">Experience Timeline</h4>
                      <div className="space-y-3">
                        {selectedTalent.profile?.experience ? (
                          (typeof selectedTalent.profile.experience === 'string' ? JSON.parse(selectedTalent.profile.experience) : selectedTalent.profile.experience).map((exp: any, idx: number) => (
                            <div key={idx} className="flex gap-3">
                              <Briefcase className="w-5 h-5 text-emerald-500 shrink-0" />
                              <div className="text-sm">
                                <p className="font-bold">{exp.title} @ {exp.company}</p>
                                <p className="text-xs text-muted-foreground">{exp.period}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No experience details provided.</p>
                        )}
                        {(!selectedTalent.profile?.experience || (typeof selectedTalent.profile.experience === 'string' ? JSON.parse(selectedTalent.profile.experience).length === 0 : selectedTalent.profile.experience.length === 0)) && (
                          <p className="text-xs text-muted-foreground italic">No experience details provided.</p>
                        )}
                      </div>
                    </section>
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
