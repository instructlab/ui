// Dashboard.tsx
import JobDurationChart from "@app/components/ChartJobDuration";
import * as React from 'react';
import { PageSection, Title, Card, CardBody, CardTitle } from '@patternfly/react-core';
import JobStatusPieChart from '@app/components/ChartJobDistribution';

const Dashboard: React.FunctionComponent = () => {
  return (
    <PageSection>
      <Title headingLevel="h1" size="lg">Dashboard</Title>
      <Card className="pf-m-mb-lg"> {/* TODO: the bottom spacing isn't working */}
        <CardTitle>Job Status Distribution</CardTitle>
        <CardBody>
          <JobStatusPieChart />
        </CardBody>
      </Card>

      <Card>
        <CardTitle>Successful Job Durations</CardTitle>
        <CardBody>
          <JobDurationChart />
        </CardBody>
      </Card>
    </PageSection>
  );
};

export { Dashboard };

