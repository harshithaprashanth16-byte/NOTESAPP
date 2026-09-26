import React, { useState, useEffect } from "react";
import { 
  Plus, 
  FolderPlus, 
  BookOpen, 
  Sparkles, 
  FileText, 
  Eye, 
  Download, 
  ArrowRight,
  Clock,
  Layers
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, type Subject, type Resource } from "../api/client";
import { SubjectCard } from "../components/SubjectCard";
import { CreateSubjectModal } from "../components/CreateSubjectModal";
import { SubjectCardSkeleton } from "../components/SkeletonLoader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { formatFileSize, formatDate, getFileCategoryColor } from "../utils/fileHelpers";

interface DashboardPageProps {
  onOpenSubject: (subjectId: string) => void;
  onViewResource: (resource: Resource) => void;
  onDownloadResource: (resource: Resource) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenSubject,
  onViewResource,
  onDownloadResource,
}) => {
  const { user, stats, refreshUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load subjects and recent resources
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [subjectsData, recentData] = await Promise.all([
        api.subjects.list(),
        api.resources.getRecent(5),
      ]);
      setSubjects(subjectsData);
      setRecentResources(recentData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSubjectCreated = (newSubject: Subject) => {
    setSubjects((prev) => [newSubject, ...prev]);
    refreshUser();
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await api.subjects.delete(subjectToDelete.id);
      setSubjects((prev) => prev.filter((s) => s.id !== subjectToDelete.id));
      setRecentResources((prev) => prev.filter((r) => r.subject_id !== subjectToDelete.id));
      setSubjectToDelete(null);
      refreshUser();
    } catch (err: any) {
      alert(err?.message || "Failed to delete subject");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Student";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* 1. Welcome Section */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#8AFF9B] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse"></span>
              PERSONAL ACADEMIC WORKSPACE
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              {getGreeting()}, <span className="text-zinc-100">{firstName}</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1 font-sans">
              Keep your study resources and course notes organized in one place.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#00FF41] hover:bg-[#8AFF9B] text-black font-semibold text-xs font-mono tracking-wider flex items-center gap-2 transition-all subtle-glow shrink-0"
          >
            <Plus className="w-4 h-4" />
            + Add Subject
          </button>
        </div>
      </section>

      {/* 2. Subjects Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">Your Subjects</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
              {subjects.length}
            </span>
          </div>

          {subjects.length > 0 && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-mono text-[#8AFF9B] hover:text-[#00FF41] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              New Subject
            </button>
          )}
        </div>

        {/* Subjects Grid or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SubjectCardSkeleton />
            <SubjectCardSkeleton />
            <SubjectCardSkeleton />
          </div>
        ) : subjects.length === 0 ? (
          /* Empty State for Subjects */
          <div className="bg-[#08080c] border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#8AFF9B] mx-auto mb-4">
              <FolderPlus className="w-7 h-7 text-[#00FF41]" />
            </div>
            <h3 className="text-base font-semibold text-white">No subjects yet</h3>
            <p className="text-xs text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Create your first subject (e.g. Data Structures, Python, Mathematics) to start organizing your lecture notes and resources.
            </p>
            <div className="mt-5">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#00FF41] hover:bg-[#8AFF9B] text-black font-semibold text-xs font-mono tracking-wider inline-flex items-center gap-2 subtle-glow transition-all"
              >
                <Plus className="w-4 h-4" />
                + Create Subject
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onOpen={onOpenSubject}
                onDelete={(sub) => setSubjectToDelete(sub)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Recent Resources Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">Recent Resources</h2>
            <span className="text-xs font-mono text-zinc-500">latest uploads</span>
          </div>
        </div>

        {recentResources.length === 0 ? (
          <div className="bg-[#08080c] border border-zinc-800/80 rounded-xl p-6 text-center text-xs text-zinc-500 font-mono">
            No recently uploaded resources found. Upload notes inside any subject to see them listed here.
          </div>
        ) : (
          <div className="bg-[#08080c] border border-zinc-800/80 rounded-xl divide-y divide-zinc-800/60 overflow-hidden">
            {recentResources.map((resource) => {
              const category = getFileCategoryColor(resource.file_type);
              return (
                <div
                  key={resource.id}
                  className="p-3.5 sm:px-4 sm:py-3 hover:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${category.bg} ${category.text} ${category.border} shrink-0`}>
                      {resource.file_type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={() => onViewResource(resource)}
                          className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white truncate cursor-pointer hover:underline"
                        >
                          {resource.file_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono mt-0.5">
                        <span 
                          onClick={() => onOpenSubject(resource.subject_id)}
                          className="text-zinc-400 hover:text-[#8AFF9B] cursor-pointer hover:underline truncate max-w-[150px]"
                        >
                          {resource.subject_name || "Subject"}
                        </span>
                        <span>·</span>
                        <span>{formatFileSize(resource.file_size)}</span>
                        <span>·</span>
                        <span>{formatDate(resource.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => onViewResource(resource)}
                      className="px-2.5 py-1 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#8AFF9B]" />
                      View
                    </button>
                    <button
                      onClick={() => onDownloadResource(resource)}
                      className="px-2.5 py-1 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Subject Modal */}
      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubjectCreated={handleSubjectCreated}
      />

      {/* Delete Subject Confirmation */}
      <ConfirmDialog
        isOpen={!!subjectToDelete}
        title="Delete this subject?"
        message={`Are you sure you want to delete "${subjectToDelete?.name}"? All resources and notes inside this subject will be permanently deleted. This action cannot be undone.`}
        confirmText="Delete Subject"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteSubject}
        onCancel={() => setSubjectToDelete(null)}
      />
    </main>
  );
};
