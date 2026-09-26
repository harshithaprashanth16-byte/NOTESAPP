import React from "react";
import { BookOpen, ArrowRight, Trash2, Calendar } from "lucide-react";
import type { Subject } from "../api/client";
import { formatDate } from "../utils/fileHelpers";

interface SubjectCardProps {
  subject: Subject;
  onOpen: (subjectId: string) => void;
  onDelete: (subject: Subject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onOpen, onDelete }) => {
  return (
    <div className="group relative bg-[#08080c] hover:bg-[#0c0c12] border border-zinc-800/90 hover:border-[#00FF41]/40 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 subtle-glow-hover">
      {/* Top row: Icon and Delete Action */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#00FF41] group-hover:border-[#00FF41]/40 group-hover:bg-[#00FF41]/10 transition-colors shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(subject);
          }}
          title="Delete subject"
          className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main info */}
      <div className="flex-1 cursor-pointer" onClick={() => onOpen(subject.id)}>
        <h3 className="text-base font-semibold text-white group-hover:text-[#8AFF9B] transition-colors line-clamp-1">
          {subject.name}
        </h3>
        {subject.description ? (
          <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
            {subject.description}
          </p>
        ) : (
          <p className="text-xs text-zinc-600 mt-1.5 italic font-mono">No description provided</p>
        )}
      </div>

      {/* Footer: Count and Open Link */}
      <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-medium text-zinc-300 px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-800">
            {subject.resource_count ?? 0} {subject.resource_count === 1 ? "resource" : "resources"}
          </span>
        </div>

        <button
          onClick={() => onOpen(subject.id)}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#8AFF9B] group-hover:text-[#00FF41] hover:underline"
        >
          Open Subject
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
