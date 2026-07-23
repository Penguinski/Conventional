interface Props {
  label: string;
  side: "left" | "right";
  compact?: boolean;
}

export default function CornerTab({ label, side, compact = false }: Props) {
  return (
    <span className={`corner-tab tab-${side} ${compact ? "tab-compact" : ""}`} aria-hidden="true">
      <i />
      <b>{label}</b>
    </span>
  );
}
