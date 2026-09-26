import React, { useState } from "react";
import { X, User as UserIcon, Mail, Calendar, BookOpen, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/fileHelpers";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, stats, updateName } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateName(name.trim());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#0a0a0f] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF41]/15 border border-[#00FF41]/30 flex items-center justify-center text-[#8AFF9B] font-mono font-bold">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Student Profile</h2>
              <p className="text-xs text-zinc-500 font-mono">Personal account details & statistics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 p-3 bg-red-950/30 border border-red-800/60 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-[#8AFF9B]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00FF41]" />
            <span>Profile name updated successfully!</span>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono mb-1">
              <BookOpen className="w-3.5 h-3.5 text-[#00FF41]" />
              Subjects
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {stats?.total_subjects ?? 0}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono mb-1">
              <FileText className="w-3.5 h-3.5 text-[#8AFF9B]" />
              Resources
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {stats?.total_resources ?? 0}
            </div>
          </div>
        </div>

        {/* Edit Name Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#050508] border border-zinc-800 text-sm text-zinc-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00FF41]/60 focus:ring-1 focus:ring-[#00FF41]/30 transition-all font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              Email Address (Account ID)
            </label>
            <div className="flex items-center gap-2 w-full bg-zinc-900/40 border border-zinc-800/80 text-sm text-zinc-400 px-3.5 py-2.5 rounded-xl font-mono">
              <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              Member Since
            </label>
            <div className="flex items-center gap-2 w-full bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400 px-3.5 py-2.5 rounded-xl font-mono">
              <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>{formatDate(user.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim() || name === user.name}
              className="px-5 py-2 text-xs font-mono font-semibold rounded-lg bg-[#00FF41] hover:bg-[#8AFF9B] text-black transition-all flex items-center gap-2 subtle-glow disabled:opacity-40"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
