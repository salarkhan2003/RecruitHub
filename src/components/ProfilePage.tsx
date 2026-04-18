import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { User, Mail, Link as LinkIcon, Save, Plus, Briefcase, GraduationCap, Github, Laptop } from 'lucide-react';
import { motion } from 'motion/react';

export const ProfilePage = ({ user }: { user: any }) => {
  const [profile, setProfile] = useState<any>({
    bio: '',
    skills: [],
    education: [],
    experience: [],
    resumeUrl: '',
    resumeText: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user.id]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profiles/${user.id}`);
      const data = await res.json();
      if (data && data.userId) {
        setProfile({
          ...data,
          skills: typeof data.skills === 'string' ? JSON.parse(data.skills) : (data.skills || []),
          education: typeof data.education === 'string' ? JSON.parse(data.education) : (data.education || []),
          experience: typeof data.experience === 'string' ? JSON.parse(data.experience) : (data.experience || [])
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, userId: user.id }),
      });
      if (res.ok) {
        // Show success
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter((s: string) => s !== skill) });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Professional Profile</h1>
          <p className="text-muted-foreground transition-all">Complete your profile to increase your visibility to recruiters.</p>
        </div>
        <Button onClick={saveProfile} disabled={isSaving} className="gap-2">
          {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Profile</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto flex items-center justify-center text-indigo-600 text-3xl font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-xl">{user.name}</h2>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                  <Mail className="w-3 h-3" /> {user.email}
                </div>
              </div>
              <Badge variant="outline" className="capitalize">{user.role}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Laptop className="w-4 h-4" /> Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="pr-1 gap-1">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-red-500">×</button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add skill..." 
                  value={newSkill} 
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button size="icon" variant="outline" onClick={addSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" /> Professional Bio
              </CardTitle>
              <CardDescription>Tell recruiters who you are and what you're passionate about.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Write a brief professional summary..." 
                className="min-h-[120px]"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Briefcase className="w-5 h-5" /> Experience
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => setProfile({ ...profile, experience: [...profile.experience, { title: '', company: '', period: '', description: '' }] })}>
                <Plus className="w-4 h-4" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.experience.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 bg-slate-50 rounded-lg">No experience added yet.</p>
              )}
              {profile.experience.map((exp: any, idx: number) => (
                <div key={idx} className="space-y-4 p-4 border rounded-xl relative group">
                  <button 
                    onClick={() => {
                      const updated = profile.experience.filter((_: any, i: number) => i !== idx);
                      setProfile({ ...profile, experience: updated });
                    }}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Job Title</Label>
                      <Input 
                        value={exp.title} 
                        placeholder="Software Engineer"
                        onChange={(e) => {
                          const updated = [...profile.experience];
                          updated[idx] = { ...exp, title: e.target.value };
                          setProfile({ ...profile, experience: updated });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Company</Label>
                      <Input 
                        value={exp.company} 
                        placeholder="Google"
                        onChange={(e) => {
                          const updated = [...profile.experience];
                          updated[idx] = { ...exp, company: e.target.value };
                          setProfile({ ...profile, experience: updated });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Period</Label>
                    <Input 
                      value={exp.period} 
                      placeholder="2021 - Present"
                      onChange={(e) => {
                        const updated = [...profile.experience];
                        updated[idx] = { ...exp, period: e.target.value };
                        setProfile({ ...profile, experience: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <GraduationCap className="w-5 h-5" /> Education
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => setProfile({ ...profile, education: [...profile.education, { degree: '', school: '', year: '' }] })}>
                <Plus className="w-4 h-4" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.education.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 bg-slate-50 rounded-lg">No education added yet.</p>
              )}
              {profile.education.map((edu: any, idx: number) => (
                <div key={idx} className="space-y-4 p-4 border rounded-xl relative group">
                  <button 
                    onClick={() => {
                      const updated = profile.education.filter((_: any, i: number) => i !== idx);
                      setProfile({ ...profile, education: updated });
                    }}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Degree</Label>
                      <Input 
                        value={edu.degree} 
                        placeholder="B.Tech CS"
                        onChange={(e) => {
                          const updated = [...profile.education];
                          updated[idx] = { ...edu, degree: e.target.value };
                          setProfile({ ...profile, education: updated });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">School/University</Label>
                      <Input 
                        value={edu.school} 
                        placeholder="Stanford"
                        onChange={(e) => {
                          const updated = [...profile.education];
                          updated[idx] = { ...edu, school: e.target.value };
                          setProfile({ ...profile, education: updated });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Year</Label>
                    <Input 
                      value={edu.year} 
                      placeholder="2020"
                      onChange={(e) => {
                        const updated = [...profile.education];
                        updated[idx] = { ...edu, year: e.target.value };
                        setProfile({ ...profile, education: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" /> Portfolio & Resume
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Resume Link (Google Drive/Dropbox)</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://..." 
                    value={profile.resumeUrl}
                    onChange={(e) => setProfile({ ...profile, resumeUrl: e.target.value })}
                  />
                  <Button variant="outline" size="icon">
                    <Github className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
