import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
}

export function RenderPageHeader({ title, subtitle, rightContent }: PageHeaderProps) {
  return (
    <div className="page-header d-flex align-items-start mb-4 pb-3">
      <div className="me-auto">
        <h1 className="page-header-title mb-1">{title}</h1>
        {subtitle && <p className="page-header-subtitle mb-0">{subtitle}</p>}
      </div>
      {rightContent && <div className="ms-3 d-flex align-items-center gap-2">{rightContent}</div>}
    </div>
  );
}
