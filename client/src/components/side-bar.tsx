import { NavLink } from 'react-router-dom';

interface NavItemSpec {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  children?: NavItemSpec[];
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
      {
        to: '/ledger',
        label: 'Ledger',
        icon: 'bi-journal-text',
        end: true,
        children: [
          { to: '/ledger/reports', label: 'Reports', icon: 'bi-bar-chart' },
        ],
      },
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
  const renderLink = (item: NavItemSpec, isChild: boolean) => (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          'sidebar-link',
          isChild ? 'sidebar-link-child' : '',
          isActive ? 'sidebar-link-active' : '',
        ]
          .filter(Boolean)
          .join(' ')
      }
      title={item.label}
    >
      <i className={`bi ${item.icon} sidebar-icon`} aria-hidden="true" />
      <span className="sidebar-label">{item.label}</span>
    </NavLink>
  );

  const renderItem = (item: NavItemSpec) => (
    <li key={item.to} className="sidebar-item">
      {renderLink(item, false)}
      {item.children && item.children.length > 0 && (
        <ul className="sidebar-list sidebar-sublist">
          {item.children.map((c) => (
            <li key={c.to} className="sidebar-item">
              {renderLink(c, true)}
            </li>
          ))}
        </ul>
      )}
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
