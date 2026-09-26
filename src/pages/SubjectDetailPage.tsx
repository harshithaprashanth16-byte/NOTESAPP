import React, { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  UploadCloud, 
  Plus, 
  FileText, 
  Trash2, 
  ChevronRight, 
  Folder,
  ArrowUpDown,
  Filter,
  AlertCircle
} from "lucide-react";
import { api, type Subject, type Resource } from "../api/client";
import { ResourceCard } from "../components/ResourceCard";
import { UploadResourceModal } from "../components/UploadResourceModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ResourceRowSkeleton } from "../components/SkeletonLoader";

interface SubjectDetailPageProps {
  subjectId: string;
  onBackToDashboard: () => void;
  onViewResource: (resource: Resource) => void;
  onDownloadResource: (resource: Resource) => void;
}

type SortOption = "recent" | "oldest" | "name-asc" | "name-desc" | "size-desc";
type FilterOption = "ALL" | "PDF" | "DOCS" | "SLIDES" | "SHEETS" | "IMAGES" | "TEXT";

export const SubjectDetailPage: React.FC<SubjectDetailPageProps> = ({
  subjectId,
  onBackToDashboard,
  onViewResource,
  onDownloadResource,
}) => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Actions
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeletingResource, setIsDeletingResource] = useState(false);
  const [isDeleteSubjectDialogOpen, setIsDeleteSubjectDialogOpen] = useState(false);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterBy, setFilterBy] = useState<FilterOption>("ALL");

  const loadSubjectData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.subjects.get(subjectId);
      setSubject(data.subject);
      setResources(data.resources);
    } catch (err: any) {
      setError(err?.message || "Failed to load subject. It may have been deleted.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubjectData();
  }, [subjectId]);

  const handleResourceUploaded = (newResource: Resource) => {
    setResources((prev) => [newResource, ...prev]);
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;
    setIsDeletingResource(true);
    try {
      await api.resources.delete(resourceToDelete.id);
      setResources((prev) => prev.filter((r) => r.id !== resourceToDelete.id));
      setResourceToDelete(null);
    } catch (err: any) {
      alert(err?.message || "Failed to delete resource.");
    } finally {
      setIsDeletingResource(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!subject) return;
    setIsDeletingSubject(true);
    try {
      await api.subjects.delete(subject.id);
      onBackToDashboard();
    } catch (err: any) {
      alert(err?.message || "Failed to delete subject.");
    } finally {
      setIsDeletingSubject(false);
    }
  };

  // Filtered and Sorted resources
  const processedResources = useMemo(() => {
    let list = [...resources];

    // Filter
    if (filterBy !== "ALL") {
      list = list.filter((r) => {
        const type = r.file_type.toUpperCase();
        if (filterBy === "PDF") return type === "PDF";
        if (filterBy === "DOCS") return ["DOC", "DOCX"].includes(type);
        if (filterBy === "SLIDES") return ["PPT", "PPTX"].includes(type);
        if (filterBy === "SHEETS") return ["XLS", "XLSX"].includes(type);
        if (filterBy === "IMAGES") return ["JPG", "JPEG", "PNG", "WEBP"].includes(type);
        if (filterBy === "TEXT") return type === "TXT";
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name-asc":
          return a.file_name.localeCompare(b.file_name);
        case "name-desc":
          return b.file_name.localeCompare(a.file_name);
        case "size-desc":
          return b.file_size - a.file_size;
        default:
          return 0;
      }
    });

    return list;
  }, [resources, filterBy, sortBy]);

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-800 flex items-center justify-center text-red-400 mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-white">Subject Unavailable</h2>
        <p className="text-xs text-zinc-400 mt-1">{error}</p>
        <button
          onClick={onBackToDashboard}
          className="mt-5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      {/* 1. Breadcrumb navigation */}
      <nav className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-6">
        <button
          onClick={onBackToDashboard}
          className="hover:text-zinc-300 transition-colors flex items-center gap-1.5"
        >
          <Folder className="w-3.5 h-3.5 text-[#00FF41]" />
          Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-zinc-200 font-semibold truncate max-w-xs sm:max-w-md">
          {subject?.name || "Subject Details"}
        </span>
      </nav>

      {/* 2. Subject Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-zinc-800/80 pb-6 mb-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              {subject?.name}
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
              {resources.length} {resources.length === 1 ? "resource" : "resources"}
            </span>
          </div>

          {subject?.description ? (
            <p className="text-sm text-zinc-400 leading-relaxed font-sans mt-2">
              {subject.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-600 italic font-mono mt-1">No description provided</p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#00FF41] hover:bg-[#8AFF9B] text-black font-semibold text-xs font-mono tracking-wider flex items-center gap-2 subtle-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            + Upload Resource
          </button>

          <button
            onClick={() => setIsDeleteSubjectDialogOpen(true)}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 transition-colors"
            title="Delete this subject"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs text-zinc-500 font-mono flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3 text-zinc-600" />
            Filter:
          </span>
          {(["ALL", "PDF", "DOCS", "SLIDES", "SHEETS", "IMAGES", "TEXT"] as FilterOption[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterBy(tab)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
                filterBy === tab
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent hover:border-zinc-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-500 font-mono">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[#0a0a0f] border border-zinc-800 text-xs font-mono text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00FF41]/50 cursor-pointer"
          >
            <option value="recent">Recently uploaded</option>
            <option value="oldest">Oldest</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="size-desc">File Size (Largest)</option>
          </select>
        </div>
      </div>

      {/* 4. Resources List or Empty State */}
      {isLoading ? (
        <div className="space-y-3">
          <ResourceRowSkeleton />
          <ResourceRowSkeleton />
          <ResourceRowSkeleton />
        </div>
      ) : resources.length === 0 ? (
        /* Empty State */
        <div className="bg-[#08080c] border border-dashed border-zinc-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 mx-auto mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white">No resources yet</h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Upload your notes, assignments, lecture slides, syllabus, or study materials into this subject.
          </p>
          <div className="mt-5">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#00FF41] hover:bg-[#8AFF9B] text-black font-semibold text-xs font-mono tracking-wider inline-flex items-center gap-2 subtle-glow transition-all"
            >
              <Plus className="w-4 h-4" />
              + Upload Resource
            </button>
          </div>
        </div>
      ) : processedResources.length === 0 ? (
        <div className="bg-[#08080c] border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-xs text-zinc-400 font-mono">No resources match the selected "{filterBy}" filter.</p>
          <button
            onClick={() => setFilterBy("ALL")}
            className="mt-3 text-xs text-[#8AFF9B] hover:underline font-mono"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {processedResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onView={onViewResource}
              onDownload={onDownloadResource}
              onDelete={(res) => setResourceToDelete(res)}
            />
          ))}
        </div>
      )}

      {/* Upload Resource Modal */}
      {subject && (
        <UploadResourceModal
          isOpen={isUploadModalOpen}
          subjectId={subject.id}
          subjectName={subject.name}
          onClose={() => setIsUploadModalOpen(false)}
          onResourceUploaded={handleResourceUploaded}
        />
      )}

      {/* Delete Resource Confirmation */}
      <ConfirmDialog
        isOpen={!!resourceToDelete}
        title="Delete this resource?"
        message={`Are you sure you want to delete "${resourceToDelete?.file_name}"? This action cannot be undone.`}
        confirmText="Delete Resource"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeletingResource}
        onConfirm={handleDeleteResource}
        onCancel={() => setResourceToDelete(null)}
      />

      {/* Delete Subject Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteSubjectDialogOpen}
        title="Delete this subject?"
        message={`Are you sure you want to delete "${subject?.name}"? All resources in this subject will also be permanently deleted. This action cannot be undone.`}
        confirmText="Delete Subject"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeletingSubject}
        onConfirm={handleDeleteSubject}
        onCancel={() => setIsDeleteSubjectDialogOpen(false)}
      />
    </main>
  );
};
