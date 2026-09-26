import React, { useState } from "react";
import { X, FolderPlus, AlertCircle } from "lucide-react";
import { api, type Subject } from "../api/client";

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectCreated: (subject: Subject) => void;
}

export const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({
  isOpen,
  onClose,
  onSubjectCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a subject name.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newSubject = await api.subjects.create({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onSubjectCreated(newSubject);
      setName("");
      setDescription("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create subject. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#0a0a0f] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#00FF41]">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Create Subject</h2>
              <p className="text-xs text-zinc-500 font-mono">Organize resources under a new academic course</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 bg-red-950/30 border border-red-800/60 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
              Subject Name <span className="text-[#00FF41]">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Structures, Operating Systems, Linear Algebra"
              className="w-full bg-[#050508] border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00FF41]/60 focus:ring-1 focus:ring-[#00FF41]/30 transition-all font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
              Description <span className="text-zinc-500 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. CS201 - Algorithms, trees, graphs, sorting methods, syllabus & lecture notes"
              className="w-full bg-[#050508] border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00FF41]/60 focus:ring-1 focus:ring-[#00FF41]/30 transition-all font-sans resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-mono font-semibold rounded-lg bg-[#00FF41] hover:bg-[#8AFF9B] text-black transition-all flex items-center gap-2 subtle-glow disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Creating...
                </>
              ) : (
                "Create Subject"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
