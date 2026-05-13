// Random-feeling but deterministic palette for tag pills — the same tag string
// always hashes to the same color. Keeps story tables scannable: spotting
// "Vacation" / "Auto-pay" / "Travel" is faster when the color is consistent.
const TAG_COLORS = [
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#0ea5e9', // sky
  '#a855f7', // violet
  '#84cc16', // lime
  '#6366f1', // indigo
];

export function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]!;
}

interface TagPillProps {
  tag: string;
}

export function TagPill({ tag }: TagPillProps) {
  const color = tagColor(tag);
  return (
    <span
      className="rounded-pill"
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.6rem',
        fontSize: '0.78rem',
        fontWeight: 500,
        backgroundColor: `${color}26`,
        color,
        border: `1px solid ${color}66`,
        whiteSpace: 'nowrap',
      }}
    >
      {tag}
    </span>
  );
}
