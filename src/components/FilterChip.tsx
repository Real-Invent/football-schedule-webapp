import type { LucideIcon } from "lucide-react";

type FilterChipProps = {
  active: boolean;
  onClick: () => void;
  color: string;
  icon?: LucideIcon;
  label: string;
};

// フィルターチップ（ボタン）コンポーネント
// リーグ・放送局選択、お気に入りボタンなどで使用
export function FilterChip({
  active,
  onClick,
  color,
  icon: Icon,
  label,
}: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition"
      style={{
        background: active ? color : "#FFF",
        color: active ? "#fff" : "#475569",
        borderColor: active ? color : "#e2e8f0",
      }}
    >
      {Icon && <Icon size={13} />}
      {label}
    </button>
  );
}
