import { Link } from 'react-router-dom';
import { Card, CardBody, CardText, CardTitle, Col, Container, Row } from 'reactstrap';

export default function DashboardPage() {
  const renderPlaceholderCard = (title: string, body: string, linkTo: string, linkLabel: string) => (
    <Col md="6" lg="4" className="mb-3">
      <Card className="h-100 dashboard-card">
        <CardBody>
          <CardTitle tag="h5">{title}</CardTitle>
          <CardText>{body}</CardText>
          <Link to={linkTo} className="btn btn-outline-light">
            {linkLabel}
          </Link>
        </CardBody>
      </Card>
    </Col>
  );

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Dashboard</h1>
          <p className="text-muted mb-0">
            Summary panels (graphs, widgets, drill-downs) coming in a later iteration. For now, the data lives in
            the Ledger and Recurring Templates pages.
          </p>
        </Col>
      </Row>
      <Row>
        {renderPlaceholderCard(
          'Ledger',
          'Browse and edit individual line items — both manual entries and template-seeded rows.',
          '/ledger',
          'Open ledger',
        )}
        {renderPlaceholderCard(
          'Recurring templates',
          'Schedule-driven items like rent, mortgage, and paychecks. Edits propagate to unedited future rows.',
          '/templates',
          'Manage templates',
        )}
        {renderPlaceholderCard(
          'Categories',
          'Income / expense / both categories used by line items and templates.',
          '/categories',
          'Manage categories',
        )}
      </Row>
    </Container>
  );
}
