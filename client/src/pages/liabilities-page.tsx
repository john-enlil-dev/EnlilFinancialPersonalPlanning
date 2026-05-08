import { useState } from 'react';
import { Container, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { RenderPageHeader } from '../UI/functions/render-page-header';
import CreditCardsTab from './liability-tabs/credit-cards-tab';
import MortgagesTab from './liability-tabs/mortgages-tab';

type LiabilityTab = 'credit-cards' | 'mortgages';

const TABS: { key: LiabilityTab; label: string }[] = [
  { key: 'credit-cards', label: 'Credit Cards' },
  { key: 'mortgages', label: 'Mortgages' },
];

export default function LiabilitiesPage() {
  const [active, setActive] = useState<LiabilityTab>('credit-cards');

  return (
    <Container fluid className="py-4">
      <RenderPageHeader title="Liabilities" subtitle="What you owe — credit cards and mortgages." />
      <Nav tabs className="mb-3">
        {TABS.map((t) => (
          <NavItem key={t.key}>
            <NavLink
              active={active === t.key}
              onClick={() => setActive(t.key)}
              style={{ cursor: 'pointer' }}
            >
              {t.label}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      <TabContent activeTab={active}>
        <TabPane tabId="credit-cards">{active === 'credit-cards' && <CreditCardsTab />}</TabPane>
        <TabPane tabId="mortgages">{active === 'mortgages' && <MortgagesTab />}</TabPane>
      </TabContent>
    </Container>
  );
}
