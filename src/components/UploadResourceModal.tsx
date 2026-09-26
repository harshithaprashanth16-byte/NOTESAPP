import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowUpCircle } from "lucide-react";
import { api, type Resource } from "../api/client";
import { formatFileSize } from "../utils/fileHelpers";

interface UploadResourceModalProps {
  isOpen: boolean;
  subjectId: string;
  subjectName: string;
  onClose: () => void;
  onResourceUploaded: (resource: Resource) => void;
}

const SUPPORTED_EXTS = [
  "PDF", "DOC", "DOCX", "PPT", "PPTX", "XLS", "XLSX", "TXT", "JPG", "JPEG", "PNG"
];

const ACCEPT_STRING = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png";

export const UploadResourceModal: React.FC<UploadResourceModalProps> = ({
  isOpen,
  subjectId,
  subjectName,
  onClose,
  onResourceUploaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateFile = (selectedFile: File): boolean => {
    setError(null);
    const ext = selectedFile.name.split(".").pop()?.toUpperCase() || "";
    if (!SUPPORTED_EXTS.includes(ext)) {
      setError(`Unsupported file type (.${ext.toLowerCase()}). Please select a PDF, Word, PowerPoint, Excel, text or image file.`);
      return false;
    }
    // Max 50MB
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File exceeds 50MB size limit. Please choose a smaller file.");
      return false;
    }
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const res = await api.resources.upload(subjectId, file, (percent) => {
        setUploadProgress(percent);
      });

      setSuccess(true);
      setTimeout(() => {
        onResourceUploaded(res.resource);
        handleReset();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Upload Resource</h2>
              <p className="text-xs text-zinc-500 font-mono">
                Adding to <span className="text-[#8AFF9B]">{subjectName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isUploading) {
                handleReset();
                onClose();
              }
            }}
            disabled={isUploading}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 transition-colors disabled:opacity-40"
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

        {/* Success Alert */}
        {success && (
          <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-[#8AFF9B]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00FF41]" />
            <span>Resource uploaded successfully!</span>
          </div>
        )}

        {/* Dropzone Area */}
        <div className="mt-5">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-[#00FF41] bg-[#00FF41]/5"
                : file
                ? "border-zinc-700 bg-zinc-900/40"
                : "border-zinc-800 hover:border-zinc-700 bg-[#06060a] hover:bg-zinc-900/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_STRING}
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />

            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#8AFF9B] mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-zinc-200 truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-zinc-500 font-mono mt-1">{formatFileSize(file.size)}</p>
                <p className="text-xs text-[#00FF41] font-mono mt-2 underline">Click or drop to replace file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                  <ArrowUpCircle className="w-6 h-6 text-[#00FF41]" />
                </div>
                <p className="text-sm font-medium text-zinc-300">Drag & drop your file here</p>
                <p className="text-xs text-zinc-500 my-1 font-mono">or</p>
                <span className="inline-block px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white transition-colors">
                  Choose File
                </span>
                <p className="text-[11px] text-zinc-500 font-mono mt-4">
                  Supported formats: PDF, DOCX, PPTX, XLSX, TXT, JPG, PNG
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00FF41] transition-all duration-150 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading || success}
            className="px-5 py-2 text-xs font-mono font-semibold rounded-lg bg-[#00FF41] hover:bg-[#8AFF9B] text-black transition-all flex items-center gap-2 subtle-glow disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Uploading {uploadProgress}%
              </>
            ) : (
              "Upload Resource"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
