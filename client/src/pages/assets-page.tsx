import { useState } from 'react';
import { Container, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { RenderPageHeader } from '../UI/functions/render-page-header';
import LongTermContainersSection from './asset-tabs/long-term-containers-section';
import LongTermItemsSection from './asset-tabs/long-term-items-section';
import RetirementTab from './asset-tabs/retirement-tab';
import SavingsTab from './asset-tabs/savings-tab';
import SimpleAssetsTab from './asset-tabs/simple-assets-tab';

type AssetTab = 'investments' | 'possessions' | 'retirement' | 'simple' | 'savings';

const TABS: { key: AssetTab; label: string }[] = [
  { key: 'investments', label: 'Investments' },
  { key: 'possessions', label: 'Possessions' },
  { key: 'retirement', label: 'Retirement' },
  { key: 'simple', label: 'Simple Assets' },
  { key: 'savings', label: 'Savings' },
];

export default function AssetsPage() {
  const [active, setActive] = useState<AssetTab>('investments');

  return (
    <Container fluid className="py-4">
      <RenderPageHeader title="Assets" subtitle="What you own — investments, possessions, cash, savings." />
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
        <TabPane tabId="investments">{active === 'investments' && <LongTermContainersSection />}</TabPane>
        <TabPane tabId="possessions">{active === 'possessions' && <LongTermItemsSection />}</TabPane>
        <TabPane tabId="retirement">{active === 'retirement' && <RetirementTab />}</TabPane>
        <TabPane tabId="simple">{active === 'simple' && <SimpleAssetsTab />}</TabPane>
        <TabPane tabId="savings">{active === 'savings' && <SavingsTab />}</TabPane>
      </TabContent>
    </Container>
  );
}
