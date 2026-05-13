// Same approach as TagPill — deterministic palette from a hash so the same
// category always gets the same color. Hash the UID (not the name) so renames
// don't shuffle the color.
const CATEGORY_COLORS = [
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

export function categoryColor(categoryUid: string): string {
  let hash = 0;
  for (let i = 0; i < categoryUid.length; i++) {
    hash = (hash * 31 + categoryUid.charCodeAt(i)) | 0;
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length]!;
}

interface CategoryPillProps {
  categoryUid: string;
  name: string;
}

export function CategoryPill({ categoryUid, name }: CategoryPillProps) {
  const color = categoryColor(categoryUid);
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
      {name}
    </span>
  );
}
