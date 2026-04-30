import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody, CardTitle, CardText } from 'reactstrap';
import {
  RenderPrimaryButton,
  RenderDefaultButton,
} from './UI/functions/render-skeleton-button-functions';

interface HealthResponse {
  status: string;
  timestampUtc: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as HealthResponse;
      setHealth(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  useEffect(() => {
    void checkHealth();
  }, []);

  const renderHeader = () => (
    <Row className="mb-4">
      <Col>
        <h1>Enlil Financial Planning</h1>
        <p className="text-muted mb-0">
          Skeleton app — wire endpoints into the API and pages into <code>client/src</code>.
        </p>
      </Col>
    </Row>
  );

  const renderHealthBody = () => {
    if (error) return <CardText className="text-danger">API unreachable: {error}</CardText>;
    if (!health) return <CardText>Checking...</CardText>;
    return (
      <CardText>
        <strong>{health.status}</strong> — {new Date(health.timestampUtc).toLocaleString()}
      </CardText>
    );
  };

  const renderActions = () => (
    <div className="d-flex gap-2">
      <RenderPrimaryButton label="Re-check API" onClick={() => void checkHealth()} />
      <RenderDefaultButton label="Reset" onClick={() => setHealth(null)} />
    </div>
  );

  const renderHealthCard = () => (
    <Card>
      <CardBody>
        <CardTitle tag="h5">API health</CardTitle>
        {renderHealthBody()}
        {renderActions()}
      </CardBody>
    </Card>
  );

  return (
    <Container className="py-4">
      {renderHeader()}
      {renderHealthCard()}
    </Container>
  );
}
