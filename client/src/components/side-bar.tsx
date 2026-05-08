import { NavLink } from 'react-router-dom';

interface NavItemSpec {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

interface NavSectionSpec {
  title: string;
  items: NavItemSpec[];
}

const ungroupedItems: NavItemSpec[] = [
  { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
];

const sections: NavSectionSpec[] = [
  {
    title: 'Cash Flow',
    items: [
      { to: '/ledger', label: 'Ledger', icon: 'bi-journal-text' },
      { to: '/templates', label: 'Recurring', icon: 'bi-arrow-repeat' },
      { to: '/categories', label: 'Categories', icon: 'bi-tags' },
    ],
  },
  {
    title: 'Balances',
    items: [
      { to: '/assets', label: 'Assets', icon: 'bi-piggy-bank' },
      { to: '/liabilities', label: 'Liabilities', icon: 'bi-credit-card' },
      { to: '/net-worth', label: 'Net Worth', icon: 'bi-graph-up-arrow' },
    ],
  },
];

export default function SideBar() {
  const renderItem = (item: NavItemSpec) => (
    <li key={item.to} className="sidebar-item">
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
        }
        title={item.label}
      >
        <i className={`bi ${item.icon} sidebar-icon`} aria-hidden="true" />
        <span className="sidebar-label">{item.label}</span>
      </NavLink>
    </li>
  );

  const renderSection = (section: NavSectionSpec) => (
    <li key={section.title} className="sidebar-section">
      <div className="sidebar-section-title">{section.title}</div>
      <ul className="sidebar-list">{section.items.map(renderItem)}</ul>
    </li>
  );

  return (
    <aside className="app-sidebar" aria-label="Main navigation">
      <div className="sidebar-brand" title="Enlil Financial Planning">
        <i className="bi bi-coin sidebar-icon" aria-hidden="true" />
        <span className="sidebar-label sidebar-brand-text">Enlil</span>
      </div>
      <nav className="sidebar-nav">
        <ul className="sidebar-list">{ungroupedItems.map(renderItem)}</ul>
        <ul className="sidebar-list sidebar-sections">{sections.map(renderSection)}</ul>
      </nav>
    </aside>
  );
}
