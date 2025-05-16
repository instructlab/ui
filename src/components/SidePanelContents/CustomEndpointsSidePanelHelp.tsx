import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Content } from '@patternfly/react-core';
import SidePanelHelp from '@/components/SidePanelContents/SidePanelHelp';

export const CustomEndpointsTitle = 'Custom model endpoints';

export const CustomEndpointsDescription: React.FC = () => {
  const router = useRouter();

  return (
    <>
      Adding a custom model endpoint enables you to test a model on the{' '}
      <Button variant="link" isInline onClick={() => router.push('/playground/chat')}>
        Chat with a model
      </Button>{' '}
      page.
    </>
  );
};

export const CustomEndpointsBody: React.FC = () => {
  const router = useRouter();

  return (
    <>
      <strong>Adding endpoints</strong>
      <Content component="p">
        To add an endpoint, click the <strong>Add custom model endpoint</strong> button on the{' '}
        <Button variant="link" isInline onClick={() => router.push('/playground/endpoints')}>
          Custom model endpoints
        </Button>{' '}
        or{' '}
        <Button variant="link" isInline onClick={() => router.push('/playground/chat')}>
          Chat with a model
        </Button>{' '}
        page. Complete the required fields, such as URL and API key, then click <strong>Add</strong>. The new endpoint will be enabled automatically.
      </Content>
      <strong>Enabling and disabling endpoints</strong>
      <Content component="p">
        You can control when models are exposed for inference. Enabling an endpoint makes a model available for querying, while disabling it prevents
        requests from reaching the model.
      </Content>
    </>
  );
};

const CustomEndpointsSidePanelHelp: React.FC = () => (
  <SidePanelHelp header={CustomEndpointsTitle} description={<CustomEndpointsDescription />} body={<CustomEndpointsBody />} />
);

export default CustomEndpointsSidePanelHelp;
