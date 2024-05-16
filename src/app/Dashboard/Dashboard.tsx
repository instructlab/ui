// Dashboard.tsx
import JobDurationChart from "@app/components/ChartJobDuration";
import * as React from 'react';
import { Card } from '@patternfly/react-core/dist/dynamic/components/Card'
import { CardBody } from '@patternfly/react-core/dist/dynamic/components/Card'
import { CardTitle } from '@patternfly/react-core/dist/dynamic/components/Card'
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page'
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title'
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

