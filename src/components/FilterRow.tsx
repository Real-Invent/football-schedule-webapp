import React from "react";

type FilterRowProps = {
  label: string;
  children: React.ReactNode;
};

export function FilterRow({ label, children }: FilterRowProps) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-1 px-0.5">
        {label}
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: "none" }}
      >
        {children}
      </div>
    </div>
  );
}
