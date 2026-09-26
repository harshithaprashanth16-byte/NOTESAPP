export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function isPreviewableInBrowser(fileType: string, fileName?: string): "pdf" | "image" | "text" | "unsupported" {
  const type = (fileType || "").toLowerCase();
  const ext = fileName ? fileName.split(".").pop()?.toLowerCase() : "";

  if (type === "pdf" || ext === "pdf") {
    return "pdf";
  }
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(type) || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
    return "image";
  }
  if (type === "txt" || ext === "txt") {
    return "text";
  }
  return "unsupported";
}

export function getFileCategoryColor(fileType: string): {
  bg: string;
  text: string;
  border: string;
  accent: string;
} {
  const type = (fileType || "").toLowerCase();
  switch (type) {
    case "pdf":
      return {
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/30",
        accent: "#ef4444",
      };
    case "doc":
    case "docx":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/30",
        accent: "#3b82f6",
      };
    case "ppt":
    case "pptx":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        accent: "#f59e0b",
      };
    case "xls":
    case "xlsx":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        accent: "#10b981",
      };
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/30",
        accent: "#a855f7",
      };
    case "txt":
      return {
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
        border: "border-cyan-500/30",
        accent: "#06b6d4",
      };
    default:
      return {
        bg: "bg-zinc-500/10",
        text: "text-zinc-400",
        border: "border-zinc-500/30",
        accent: "#71717a",
      };
  }
}
