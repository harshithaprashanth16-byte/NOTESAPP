import React, { useState, useEffect } from "react";
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  FileSpreadsheet, 
  AlertCircle, 
  Maximize2, 
  Minimize2,
  FileCode,
  FileCheck
} from "lucide-react";
import { api, type Resource } from "../api/client";
import { isPreviewableInBrowser, formatFileSize, formatDate, getFileCategoryColor } from "../utils/fileHelpers";

interface FileViewerModalProps {
  isOpen: boolean;
  resource: Resource | null;
  onClose: () => void;
  onDownload: (resource: Resource) => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  isOpen,
  resource,
  onClose,
  onDownload,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen || !resource) {
      setTextContent(null);
      return;
    }

    const previewType = isPreviewableInBrowser(resource.file_type, resource.file_name);
    if (previewType === "text") {
      setIsLoadingText(true);
      fetch(api.resources.getViewUrl(resource.id))
        .then((res) => res.text())
        .then((text) => setTextContent(text))
        .catch((err) => {
          console.error("Failed to load text preview:", err);
          setTextContent("Error loading text file content.");
        })
        .finally(() => setIsLoadingText(false));
    } else {
      setTextContent(null);
    }
  }, [isOpen, resource]);

  if (!isOpen || !resource) return null;

  const previewType = isPreviewableInBrowser(resource.file_type, resource.file_name);
  const viewUrl = api.resources.getViewUrl(resource.id);
  const category = getFileCategoryColor(resource.file_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div 
        className={`w-full flex flex-col bg-[#07070b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen 
            ? "fixed inset-2 z-50" 
            : previewType === "unsupported" 
            ? "max-w-lg" 
            : "max-w-5xl h-[88vh]"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0f] border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${category.bg} ${category.text} ${category.border} shrink-0`}>
              {resource.file_type}
            </span>
            <div className="min-w-0">
              <h3 title={resource.file_name} className="text-sm font-semibold text-white truncate">
                {resource.file_name}
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono truncate">
                {formatFileSize(resource.file_size)} · Uploaded {formatDate(resource.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {previewType !== "unsupported" && (
              <>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="hidden sm:inline-flex p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors inline-flex items-center"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </>
            )}

            <button
              onClick={() => onDownload(resource)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content Area */}
        <div className="flex-1 bg-[#030305] overflow-hidden flex items-center justify-center p-0 relative">
          {previewType === "pdf" && (
            <div className="w-full h-full flex flex-col bg-[#1e1e24]">
              <iframe
                src={`${viewUrl}#toolbar=1&navpanes=0`}
                title={resource.file_name}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {previewType === "image" && (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <img
                src={viewUrl}
                alt={resource.file_name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-zinc-800/60"
              />
            </div>
          )}

          {previewType === "text" && (
            <div className="w-full h-full overflow-auto p-4 sm:p-6 font-mono text-xs sm:text-sm text-zinc-300 bg-[#060609] select-text">
              {isLoadingText ? (
                <div className="flex items-center justify-center h-full text-zinc-500">
                  <span className="w-4 h-4 border-2 border-[#00FF41] border-t-transparent rounded-full animate-spin mr-2"></span>
                  Loading text preview...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words leading-relaxed font-mono">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {previewType === "unsupported" && (
            <div className="p-8 text-center max-w-md my-auto">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-amber-400" />
              </div>
              <h4 className="text-base font-semibold text-white">Browser Preview Unavailable</h4>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Files of type <span className="font-mono text-zinc-200 font-bold">{resource.file_type}</span> ({resource.file_name}) cannot be previewed directly inside the web browser.
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                You can download the original file to view it using Word, PowerPoint, Excel, or another desktop application.
              </p>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => onDownload(resource)}
                  className="px-6 py-2.5 rounded-xl bg-[#00FF41] hover:bg-[#8AFF9B] text-black font-semibold text-xs font-mono flex items-center gap-2 subtle-glow transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download File ({formatFileSize(resource.file_size)})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
