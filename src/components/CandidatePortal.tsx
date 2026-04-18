import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { JobPortal } from './JobPortal';
import { ProfilePage } from './ProfilePage';
import { TestList } from './TestList';
import { ClipboardList, Briefcase, User } from 'lucide-react';

export const CandidatePortal = ({ user, onSelectTest }: { user: any, onSelectTest: (test: any) => void }) => {
  return (
    <div className="container mx-auto p-4 max-w-full animate-in fade-in duration-500">
      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-xl h-12 w-full max-w-md shadow-sm mx-auto flex">
          <TabsTrigger value="jobs" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2 flex-1">
            <Briefcase className="w-4 h-4" /> Jobs
          </TabsTrigger>
          <TabsTrigger value="assessments" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2 flex-1">
            <ClipboardList className="w-4 h-4" /> Assessments
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2 flex-1">
            <User className="w-4 h-4" /> My Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="focus-visible:outline-none">
          <JobPortal user={user} />
        </TabsContent>

        <TabsContent value="assessments" className="focus-visible:outline-none">
          <TestList onSelectTest={onSelectTest} />
        </TabsContent>

        <TabsContent value="profile" className="focus-visible:outline-none">
          <ProfilePage user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
