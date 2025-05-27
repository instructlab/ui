'use client';

import React from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import {
  Bullseye,
  Button,
  ClipboardCopy,
  Content,
  DataList,
  DataListAction,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  PageSection,
  Spinner,
  Truncate
} from '@patternfly/react-core';
import { BanIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import { Endpoint, ModelEndpointStatus } from '@/types';
import { fetchEndpointStatus } from '@/services/modelService';
import { AppLayout, FeaturePages } from '@/components/AppLayout';
import CustomEndpointsSidePanelHelp from '@/components/SidePanelContents/CustomEndpointsSidePanelHelp';
import EditEndpointModal from '@/app/playground/endpoints/EditEndpointModal';
import DeleteEndpointModal from '@/app/playground/endpoints/DeleteEndpoinModal';
import EndpointActions from '@/app/playground/endpoints/EndpointActions';
import PageDescriptionWithHelp from '@/components/Common/PageDescriptionWithHelp';

const iconForStatus = (status: ModelEndpointStatus) => {
  switch (status) {
    case ModelEndpointStatus.available:
      return <CheckCircleIcon style={{ color: 'var(--pf-t--global--icon--color--status--success--default)' }} />;
    case ModelEndpointStatus.unavailable:
      return <BanIcon style={{ color: 'var(--pf-t--global--icon--color--severity--undefined--default' }} />;
    case ModelEndpointStatus.disabled:
      return <BanIcon style={{ color: 'var(--pf-t--global--icon--color--severity--undefined--default' }} />;
    case ModelEndpointStatus.unknown:
      return <QuestionCircleIcon style={{ color: 'var(--pf-t--global--icon--color--severity--undefined--default' }} />;
    default:
      return <QuestionCircleIcon style={{ color: 'var(--pf-t--global--icon--color--severity--undefined--default)' }} />;
  }
};

const EmptyStateIcon: React.FC = () => <Image src="/Endpoint_empty.svg" alt="No endpoints" width={56} height={56} />;

interface ExtendedEndpoint extends Endpoint {
  isApiKeyVisible?: boolean;
}

const getEndpointsStatus = async (endpoints: ExtendedEndpoint[]): Promise<ExtendedEndpoint[]> =>
  Promise.all(
    endpoints.map(async (endpoint) => {
      const status = await fetchEndpointStatus(endpoint);

      return {
        ...endpoint,
        status
      };
    })
  );

const EndpointsPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [endpoints, setEndpoints] = React.useState<ExtendedEndpoint[]>([]);
  const [deleteEndpoint, setDeleteEndpoint] = React.useState<Endpoint | undefined>();
  const [editEndpoint, setEditEndpoint] = React.useState<Endpoint | undefined>();
  const [actionsWidth, setActionsWidth] = React.useState<number | undefined>();

  const setActionRef = (ref: HTMLElement | null) => {
    if (!ref) {
      return;
    }

    const rect = ref.getBoundingClientRect();
    const style = window.getComputedStyle(ref);
    const marginLeft = parseFloat(style.marginLeft);
    const marginRight = parseFloat(style.marginRight);

    setActionsWidth(rect.width + marginLeft + marginRight);
  };

  React.useEffect(() => {
    let canceled = false;

    const loadEndpoints = async () => {
      const storedEndpoints = localStorage.getItem('endpoints');
      if (storedEndpoints) {
        const loadedEndpoints = await getEndpointsStatus(JSON.parse(storedEndpoints));
        if (!canceled) {
          setEndpoints(loadedEndpoints);
        }
      }
      setIsLoading(false);
    };
    loadEndpoints();

    return () => {
      canceled = true;
    };
  }, []);

  React.useEffect(() => {
    async function updateEndpointStatuses() {
      const updatedEndpoints = await Promise.all(
        endpoints.map(async (endpoint) => {
          const status = await fetchEndpointStatus(endpoint);

          return {
            ...endpoint,
            status
          };
        })
      );

      setEndpoints(updatedEndpoints);
    }

    const interval = setInterval(
      () => {
        console.log('Running update endpoints');
        updateEndpointStatuses();
      },
      10 * 60 * 1000
    ); // run every 10 minutes in milliseconds

    return () => clearInterval(interval); // cleanup on unmount
  }, [endpoints]);

  const toggleEndpointEnabled = (endpointId: string) => {
    const updatedEndpoints = endpoints.map((endpoint) => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          enabled: !endpoint.enabled
        };
      }
      return endpoint;
    });
    setEndpoints(updatedEndpoints);
    localStorage.setItem('endpoints', JSON.stringify(updatedEndpoints));
  };

  const handleSaveEndpoint = async (endPoint?: Endpoint) => {
    if (endPoint) {
      const status = await fetchEndpointStatus(endPoint);
      const updatedEndpoint: ExtendedEndpoint = {
        ...endPoint,
        isApiKeyVisible: false,
        status: status,
        enabled: true
      };

      const updatedEndpoints = updatedEndpoint?.id
        ? endpoints.map((ep) => (ep.id === updatedEndpoint.id ? updatedEndpoint : ep))
        : [...endpoints, { ...updatedEndpoint, id: uuidv4() }];

      setEndpoints(updatedEndpoints);
      localStorage.setItem('endpoints', JSON.stringify(updatedEndpoints));
    }
    setEditEndpoint(undefined);
  };

  const handleDeleteEndpoint = (doDelete: boolean) => {
    if (doDelete && deleteEndpoint) {
      const updatedEndpoints = endpoints.filter((ep) => ep.id !== deleteEndpoint.id);
      setEndpoints(updatedEndpoints);
      localStorage.setItem('endpoints', JSON.stringify(updatedEndpoints));
    }

    setDeleteEndpoint(undefined);
  };

  const handleAddEndpoint = () => {
    setEditEndpoint({
      id: '',
      name: '',
      description: '',
      url: '',
      modelName: '',
      modelDescription: '',
      apiKey: '',
      status: ModelEndpointStatus.unknown,
      enabled: true
    });
  };

  const toggleApiKeyVisibility = (id: string) => {
    const updatedEndpoints = endpoints.map((ep) => {
      if (ep.id === id) {
        return { ...ep, isApiKeyVisible: !ep.isApiKeyVisible };
      }
      return ep;
    });
    setEndpoints(updatedEndpoints);
  };

  const renderApiKey = (apiKey: string, isApiKeyVisible: boolean) => {
    return isApiKeyVisible ? apiKey : '********';
  };

  return (
    <AppLayout requiredFeature={FeaturePages.Playground}>
      <PageSection>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Content component="h1">Custom model endpoints</Content>
          </FlexItem>
          {endpoints.length ? (
            <FlexItem>
              <Button onClick={handleAddEndpoint}>Add custom endpoint</Button>
            </FlexItem>
          ) : null}
        </Flex>
        <PageDescriptionWithHelp
          description="Custom model endpoints enable you to interact with and test fine-tuned models using the chat interface."
          helpText="Learn more about chatting with models"
          sidePanelContent={<CustomEndpointsSidePanelHelp />}
        />
      </PageSection>
      {isLoading ? (
        <Bullseye>
          <Spinner />
        </Bullseye>
      ) : (
        <PageSection hasBodyWrapper={false}>
          {endpoints.length ? (
            <DataList aria-label="Endpoints list">
              <DataListItem key="property-headers">
                <DataListItemRow wrapModifier="breakWord">
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="nameHeader">
                        <strong>Endpoint name</strong>
                      </DataListCell>,
                      <DataListCell key="statusHeader">
                        <strong>Status</strong>
                      </DataListCell>,
                      <DataListCell key="urlHeader">
                        <strong>URL</strong>
                      </DataListCell>,
                      <DataListCell key="modelNameHeader">
                        <strong>Model name</strong>
                      </DataListCell>,
                      <DataListCell key="apiKeyHeader">
                        <strong>API key</strong>
                      </DataListCell>
                    ]}
                  />
                  <DataListAction style={{ width: actionsWidth }} aria-labelledby="no-actions" id="no-actions" aria-label="">
                    <span />
                  </DataListAction>
                </DataListItemRow>
              </DataListItem>
              {endpoints.map((endpoint) => (
                <DataListItem key={endpoint.id}>
                  <DataListItemRow wrapModifier="breakWord">
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell key="name">
                          <Content>
                            <Truncate content={endpoint.name || ''} />
                          </Content>
                          {endpoint.description ? (
                            <Content component="small">
                              <Truncate content={endpoint.description} />
                            </Content>
                          ) : null}
                        </DataListCell>,
                        <DataListCell key="status">
                          <Flex direction={{ default: 'row' }} gap={{ default: 'gapXs' }}>
                            <FlexItem>{iconForStatus(endpoint.status)}</FlexItem>
                            <FlexItem style={{ textTransform: 'capitalize' }}>{ModelEndpointStatus[endpoint.status] || 'unknown'}</FlexItem>
                          </Flex>
                        </DataListCell>,
                        <DataListCell key="url">
                          <ClipboardCopy
                            style={{ display: 'flex', gap: 'var(--pf-t--global--spacer--xs)', flexWrap: 'nowrap', backgroundColor: 'transparent' }}
                            hoverTip="Copy"
                            clickTip="Copied to clipboard"
                            variant="inline-compact"
                            truncation
                          >
                            {endpoint.url}
                          </ClipboardCopy>
                        </DataListCell>,
                        <DataListCell key="modelName">
                          <Content>
                            <Truncate content={endpoint.modelName || ''} />
                          </Content>
                          {endpoint.modelDescription ? (
                            <Content component="small">
                              <Truncate content={endpoint.modelDescription} />
                            </Content>
                          ) : null}
                        </DataListCell>,
                        <DataListCell key="apiKey">
                          {renderApiKey(endpoint.apiKey, endpoint.isApiKeyVisible || false)}
                          <Button variant="link" onClick={() => toggleApiKeyVisibility(endpoint.id)}>
                            {endpoint.isApiKeyVisible ? <EyeSlashIcon /> : <EyeIcon />}
                          </Button>
                        </DataListCell>
                      ]}
                    />
                    <DataListAction ref={setActionRef} aria-labelledby="endpoint-actions" id="endpoint-actions" aria-label="Actions">
                      <EndpointActions
                        endpoint={endpoint}
                        onToggleEnabled={() => toggleEndpointEnabled(endpoint.id)}
                        onEdit={() => setEditEndpoint(endpoint)}
                        onDelete={() => setDeleteEndpoint(endpoint)}
                      />
                    </DataListAction>
                  </DataListItemRow>
                </DataListItem>
              ))}
            </DataList>
          ) : (
            <EmptyState headingLevel="h4" titleText="No custom model endpoints yet" icon={EmptyStateIcon}>
              <EmptyStateBody>To get started, create a custom model endpoint</EmptyStateBody>
              <EmptyStateFooter>
                <EmptyStateActions>
                  <Button variant="primary" onClick={handleAddEndpoint}>
                    Create custom model endpoint
                  </Button>
                </EmptyStateActions>
              </EmptyStateFooter>
            </EmptyState>
          )}
        </PageSection>
      )}
      {editEndpoint ? <EditEndpointModal endpoint={editEndpoint} onClose={handleSaveEndpoint} /> : null}
      {deleteEndpoint ? <DeleteEndpointModal endpoint={deleteEndpoint} onClose={handleDeleteEndpoint} /> : null}
    </AppLayout>
  );
};

export default EndpointsPage;
