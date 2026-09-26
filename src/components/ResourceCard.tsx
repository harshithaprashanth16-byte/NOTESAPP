import React from "react";
import { 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  FileCode, 
  FileSpreadsheet, 
  Image, 
  File as GenericFile 
} from "lucide-react";
import type { Resource } from "../api/client";
import { formatFileSize, formatDate, getFileCategoryColor } from "../utils/fileHelpers";

interface ResourceCardProps {
  resource: Resource;
  onView: (resource: Resource) => void;
  onDownload: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onView,
  onDownload,
  onDelete,
}) => {
  const category = getFileCategoryColor(resource.file_type);

  const renderIcon = () => {
    const t = resource.file_type.toLowerCase();
    if (t === "pdf") return <FileText className="w-5 h-5 text-red-400" />;
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(t)) return <Image className="w-5 h-5 text-purple-400" />;
    if (["xls", "xlsx"].includes(t)) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (["doc", "docx"].includes(t)) return <FileText className="w-5 h-5 text-blue-400" />;
    if (t === "txt") return <FileCode className="w-5 h-5 text-cyan-400" />;
    return <GenericFile className="w-5 h-5 text-zinc-400" />;
  };

  return (
    <div className="group bg-[#08080c] hover:bg-[#0b0c10] border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150">
      {/* Left: Icon & Metadata */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <div className={`w-10 h-10 rounded-xl ${category.bg} border ${category.border} flex items-center justify-center shrink-0`}>
          {renderIcon()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 
              title={resource.file_name} 
              className="text-sm font-medium text-zinc-200 group-hover:text-white truncate cursor-pointer hover:underline"
              onClick={() => onView(resource)}
            >
              {resource.file_name}
            </h4>
            <span className={`hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${category.bg} ${category.text} ${category.border} shrink-0`}>
              {resource.file_type}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 text-xs text-zinc-500 font-mono">
            <span className="sm:hidden font-bold text-zinc-400">{resource.file_type} ·</span>
            <span>{formatFileSize(resource.file_size)}</span>
            <span>·</span>
            <span>Uploaded {formatDate(resource.created_at)}</span>
            {resource.subject_name && (
              <>
                <span>·</span>
                <span className="text-zinc-400 truncate max-w-[120px]">
                  {resource.subject_name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t border-zinc-800/50 sm:border-t-0">
        <button
          onClick={() => onView(resource)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 flex items-center gap-1.5 transition-colors"
          title="View resource preview"
        >
          <Eye className="w-3.5 h-3.5 text-[#8AFF9B]" />
          View
        </button>

        <button
          onClick={() => onDownload(resource)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 flex items-center gap-1.5 transition-colors"
          title="Download original file"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          Download
        </button>

        <button
          onClick={() => onDelete(resource)}
          className="p-1.5 text-xs rounded-lg bg-zinc-900/60 hover:bg-red-500/15 text-zinc-500 hover:text-red-400 border border-zinc-800/60 hover:border-red-500/30 transition-colors"
          title="Delete resource"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
