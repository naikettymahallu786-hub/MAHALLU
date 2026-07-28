'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Users, Edit, Phone, Mail, Plus, X, Search, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export function ClassOverviewTab({ classData, classId, refetch }: { classData: any, classId: string, refetch: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch students for this class
  const { data: students, isLoading } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => apiClient.get(`/students?classId=${classId}&limit=100`).then(r => r.data.data),
  });

  // Fetch all students to pick from
  const { data: allStudents } = useQuery({
    queryKey: ['all-students'],
    queryFn: () => apiClient.get('/students?limit=1000').then(r => r.data.data),
    enabled: isModalOpen,
  });

  const availableStudents = allStudents?.filter((s: any) => {
    const sClassId = typeof s.classId === 'object' ? s.classId?._id : s.classId;
    return sClassId !== classId && s.memberId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const assignMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      // Execute sequentially or Promise.all. Promise.all is fine for small batches.
      await Promise.all(studentIds.map(id => apiClient.put(`/students/${id}`, { classId })));
    },
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedStudents([]);
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] });
      refetch();
    }
  });

  const handleAssign = () => {
    if (selectedStudents.length > 0) {
      assignMutation.mutate(selectedStudents);
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Teacher Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User className="text-emerald-600" />
            Class Usthadh
          </h2>
          <button className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
            <Edit size={14} /> Change
          </button>
        </div>
        
        {classData.teacherId ? (
          <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/20">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl font-bold">
              {classData.teacherId.memberId?.name?.[0]}
            </div>
            <div>
              <h3 className="font-bold text-lg">{classData.teacherId.memberId?.name}</h3>
              <p className="text-sm text-muted-foreground">{classData.teacherId.qualification || 'No Qualification Listed'}</p>
              
              <div className="flex gap-4 mt-2">
                {classData.teacherId.memberId?.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone size={12} /> {classData.teacherId.memberId.phone}
                  </div>
                )}
                {classData.teacherId.memberId?.email && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail size={12} /> {classData.teacherId.memberId.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-border bg-card text-center">
            <p className="text-muted-foreground">No Usthadh assigned to this class.</p>
          </div>
        )}
      </div>

      {/* Students Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="text-emerald-600" />
            Enrolled Students ({students?.length || 0})
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-sm px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
            >
              <Plus size={14} /> Assign Students
            </button>
            <Link href={`/students/new?classId=${classId}`}>
              <button className="text-sm px-3 py-1.5 border border-border bg-card rounded-lg hover:bg-muted flex items-center gap-1">
                <Users size={14} /> New Admission
              </button>
            </Link>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl shimmer" />)}
          </div>
        ) : students && students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student: any) => (
              <div key={student._id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                  {student.memberId?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{student.memberId?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{student.admissionNo}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-border bg-card text-center">
            <Users size={32} className="mx-auto mb-3 text-emerald-600/40" />
            <p className="text-muted-foreground font-medium">No students enrolled</p>
            <p className="text-xs text-muted-foreground mt-1">Students will appear here once assigned to this class.</p>
          </div>
        )}
      </div>

      {/* Assign Students Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-lg font-bold">Assign Existing Students</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-muted rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search students by name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {availableStudents.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No available students found.</p>
                </div>
              ) : (
                availableStudents.map((student: any) => {
                  const isSelected = selectedStudents.includes(student._id);
                  return (
                    <div 
                      key={student._id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedStudents(prev => prev.filter(id => id !== student._id));
                        } else {
                          setSelectedStudents(prev => [...prev, student._id]);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isSelected ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                          {student.memberId?.name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.memberId?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.admissionNo} • Current Class: {student.classId?.name || 'None'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && <CheckCircle size={14} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-border flex justify-between items-center bg-muted/30">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedStudents.length} selected
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssign}
                  disabled={selectedStudents.length === 0 || assignMutation.isPending}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {assignMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Assign to Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
