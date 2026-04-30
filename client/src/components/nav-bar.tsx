import { NavLink } from 'react-router-dom';
import { Nav, NavItem, Navbar, NavbarBrand } from 'reactstrap';

export default function NavBar() {
  const renderLink = (to: string, label: string) => (
    <NavItem>
      <NavLink to={to} end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        {label}
      </NavLink>
    </NavItem>
  );

  return (
    <Navbar color="dark" dark expand="md" className="px-3">
      <NavbarBrand tag="span">Enlil Financial Planning</NavbarBrand>
      <Nav navbar className="ms-auto">
        {renderLink('/', 'Dashboard')}
        {renderLink('/ledger', 'Ledger')}
        {renderLink('/templates', 'Recurring')}
        {renderLink('/categories', 'Categories')}
      </Nav>
    </Navbar>
  );
}
