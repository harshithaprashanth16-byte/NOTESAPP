import React from "react";

export const SubjectCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#08080c] border border-zinc-800/80 rounded-xl p-5 animate-pulse flex flex-col justify-between h-48">
      <div>
        <div className="w-10 h-10 rounded-lg bg-zinc-800 mb-4"></div>
        <div className="w-3/4 h-5 rounded bg-zinc-800 mb-2"></div>
        <div className="w-1/2 h-3.5 rounded bg-zinc-800/60"></div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
        <div className="w-20 h-4 rounded bg-zinc-800/80"></div>
        <div className="w-16 h-4 rounded bg-zinc-800/80"></div>
      </div>
    </div>
  );
};

export const ResourceRowSkeleton: React.FC = () => {
  return (
    <div className="bg-[#08080c] border border-zinc-800/80 rounded-xl p-4 animate-pulse flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-zinc-800 shrink-0"></div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="w-2/3 h-4 rounded bg-zinc-800"></div>
          <div className="w-1/3 h-3 rounded bg-zinc-800/60"></div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 h-8 rounded-lg bg-zinc-800/70"></div>
        <div className="w-16 h-8 rounded-lg bg-zinc-800/70"></div>
      </div>
    </div>
  );
};
