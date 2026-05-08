import { useQueries } from '@tanstack/react-query';
import { Card, CardBody, CardTitle, Col, Container, Row } from 'reactstrap';
import { creditCardDebtsApi } from '../api/credit-card-debts';
import { longTermContainersApi } from '../api/long-term-containers';
import { longTermItemsApi } from '../api/long-term-items';
import { mortgageDebtsApi } from '../api/mortgage-debts';
import { queryKeys } from '../api/query-keys';
import { retirementContainersApi } from '../api/retirement-containers';
import { savingsApi } from '../api/savings';
import { simpleAssetsApi } from '../api/simple-assets';
import { RenderPageHeader } from '../UI/functions/render-page-header';

const fmt = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

export default function NetWorthPage() {
  const queries = useQueries({
    queries: [
      { queryKey: queryKeys.longTermContainers.all, queryFn: longTermContainersApi.list },
      { queryKey: queryKeys.longTermItems.all, queryFn: longTermItemsApi.list },
      { queryKey: queryKeys.retirementContainers.all, queryFn: retirementContainersApi.list },
      { queryKey: queryKeys.simpleAssets.all, queryFn: simpleAssetsApi.list },
      { queryKey: queryKeys.savings.all, queryFn: savingsApi.list },
      { queryKey: queryKeys.creditCardDebts.all, queryFn: creditCardDebtsApi.list },
      { queryKey: queryKeys.mortgageDebts.all, queryFn: mortgageDebtsApi.list },
    ],
  });

  const [
    ltContainers,
    ltItems,
    retContainers,
    simpleAssets,
    savings,
    creditCards,
    mortgages,
  ] = queries;

  const isLoading = queries.some((q) => q.isLoading);

  const sumValue = <T extends { currentValue: number }>(items?: T[]) =>
    (items ?? []).reduce((acc, x) => acc + x.currentValue, 0);
  const sumBalance = <T extends { currentBalance: number }>(items?: T[]) =>
    (items ?? []).reduce((acc, x) => acc + x.currentBalance, 0);

  const longTermContainerTotal = sumValue(ltContainers.data);
  const longTermItemTotal = sumValue(ltItems.data);
  const retirementTotal = sumValue(retContainers.data);
  const simpleAssetTotal = sumValue(simpleAssets.data);
  const savingsTotal = sumValue(savings.data);

  const creditCardTotal = sumBalance(creditCards.data);
  const mortgageTotal = sumBalance(mortgages.data);

  const totalAssets =
    longTermContainerTotal + longTermItemTotal + retirementTotal + simpleAssetTotal + savingsTotal;
  const totalLiabilities = creditCardTotal + mortgageTotal;
  const netWorth = totalAssets - totalLiabilities;

  const renderSummaryCards = () => (
    <Row className="g-3 mb-4">
      <Col md={4}>
        <Card>
          <CardBody>
            <CardTitle tag="h6" className="text-muted">Total Assets</CardTitle>
            <h2 className="mb-0 text-success">{fmt(totalAssets)}</h2>
          </CardBody>
        </Card>
      </Col>
      <Col md={4}>
        <Card>
          <CardBody>
            <CardTitle tag="h6" className="text-muted">Total Liabilities</CardTitle>
            <h2 className="mb-0 text-danger">{fmt(totalLiabilities)}</h2>
          </CardBody>
        </Card>
      </Col>
      <Col md={4}>
        <Card>
          <CardBody>
            <CardTitle tag="h6" className="text-muted">Net Worth</CardTitle>
            <h2 className={`mb-0 ${netWorth >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(netWorth)}</h2>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );

  const renderBreakdown = () => (
    <Row className="g-3">
      <Col md={6}>
        <Card>
          <CardBody>
            <CardTitle tag="h5">Assets breakdown</CardTitle>
            <table className="table table-sm mb-0">
              <tbody>
                <tr>
                  <td>Long-Term Containers</td>
                  <td className="text-end">{fmt(longTermContainerTotal)}</td>
                </tr>
                <tr>
                  <td>Long-Term Items</td>
                  <td className="text-end">{fmt(longTermItemTotal)}</td>
                </tr>
                <tr>
                  <td>Retirement</td>
                  <td className="text-end">{fmt(retirementTotal)}</td>
                </tr>
                <tr>
                  <td>Simple Assets</td>
                  <td className="text-end">{fmt(simpleAssetTotal)}</td>
                </tr>
                <tr>
                  <td>Savings</td>
                  <td className="text-end">{fmt(savingsTotal)}</td>
                </tr>
                <tr className="fw-bold border-top">
                  <td>Total</td>
                  <td className="text-end">{fmt(totalAssets)}</td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>
      </Col>
      <Col md={6}>
        <Card>
          <CardBody>
            <CardTitle tag="h5">Liabilities breakdown</CardTitle>
            <table className="table table-sm mb-0">
              <tbody>
                <tr>
                  <td>Credit Cards</td>
                  <td className="text-end">{fmt(creditCardTotal)}</td>
                </tr>
                <tr>
                  <td>Mortgages</td>
                  <td className="text-end">{fmt(mortgageTotal)}</td>
                </tr>
                <tr className="fw-bold border-top">
                  <td>Total</td>
                  <td className="text-end">{fmt(totalLiabilities)}</td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );

  return (
    <Container fluid className="py-4">
      <RenderPageHeader
        title="Net Worth"
        subtitle="Snapshot of total assets minus total liabilities. Time-series chart coming in a future iteration."
      />
      {isLoading ? <p>Loading...</p> : (
        <>
          {renderSummaryCards()}
          {renderBreakdown()}
        </>
      )}
    </Container>
  );
}
