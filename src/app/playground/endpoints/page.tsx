'use client';

import React, { useState, useEffect } from 'react';
import { Page, PageBreadcrumb, PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import {
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  DataListAction
} from '@patternfly/react-core/dist/dynamic/components/DataList';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/next/components/Modal';
import { Breadcrumb, BreadcrumbItem, Modal, TextContent } from '@patternfly/react-core/components/';
import { Form, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { InputGroup } from '@patternfly/react-core/dist/dynamic/components/InputGroup';
import EyeIcon from '@patternfly/react-icons/dist/dynamic/icons/eye-icon';
import EyeSlashIcon from '@patternfly/react-icons/dist/dynamic/icons/eye-slash-icon';
import { v4 as uuidv4 } from 'uuid';
import { AppLayout } from '@/components/AppLayout';
import { Endpoint } from '@/types';

interface ExtendedEndpoint extends Endpoint {
  isApiKeyVisible?: boolean;
}

const EndpointsPage: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ExtendedEndpoint[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<Partial<ExtendedEndpoint> | null>(null);
  const [url, setUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const storedEndpoints = localStorage.getItem('endpoints');
    if (storedEndpoints) {
      setEndpoints(JSON.parse(storedEndpoints));
    }
  }, []);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const removeTrailingSlash = (inputUrl: string): string => {
    if (typeof inputUrl !== 'string') {
      throw new Error('Invalid url');
    }
    if (inputUrl.slice(-1) === '/') {
      return inputUrl.slice(0, -1);
    }
    return inputUrl;
  };

  const handleSaveEndpoint = () => {
    const updatedUrl = removeTrailingSlash(url);
    if (currentEndpoint) {
      const updatedEndpoint: ExtendedEndpoint = {
        id: currentEndpoint.id || uuidv4(),
        url: updatedUrl,
        modelName: modelName,
        apiKey: apiKey,
        isApiKeyVisible: false
      };

      const updatedEndpoints = currentEndpoint.id
        ? endpoints.map((ep) => (ep.id === currentEndpoint.id ? updatedEndpoint : ep))
        : [...endpoints, updatedEndpoint];

      setEndpoints(updatedEndpoints);
      localStorage.setItem('endpoints', JSON.stringify(updatedEndpoints));
      setCurrentEndpoint(null);
      setUrl('');
      setModelName('');
      setApiKey('');
      handleModalToggle();
    }
  };

  const handleDeleteEndpoint = (id: string) => {
    const updatedEndpoints = endpoints.filter((ep) => ep.id !== id);
    setEndpoints(updatedEndpoints);
    localStorage.setItem('endpoints', JSON.stringify(updatedEndpoints));
  };

  const handleEditEndpoint = (endpoint: ExtendedEndpoint) => {
    setCurrentEndpoint(endpoint);
    setUrl(endpoint.url);
    setModelName(endpoint.modelName);
    setApiKey(endpoint.apiKey);
    handleModalToggle();
  };

  const handleAddEndpoint = () => {
    setCurrentEndpoint({ id: '', url: '', modelName: '', apiKey: '', isApiKeyVisible: false });
    setUrl('');
    setModelName('');
    setApiKey('');
    handleModalToggle();
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

  useEffect(() => {}, [url]);

  return (
    <AppLayout>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
          <BreadcrumbItem isActive>Custom Model Endpoints</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10' }}>
          Custom Model Endpoints
        </Title>
        <TextContent>
          <br />
          Manage your own customer model endpoints. If you have a custom model that is served by an endpoint, you can add it here. This will allow you
          to use the custom model in the playground chat.
        </TextContent>
      </PageSection>
      <Page>
        <PageSection style={{ backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title headingLevel="h1">Manage Endpoints</Title>
            <Button onClick={handleAddEndpoint}>Add Endpoint</Button>
          </div>
          <DataList aria-label="Endpoints list">
            {endpoints.map((endpoint) => (
              <DataListItem key={endpoint.id}>
                <DataListItemRow wrapModifier="breakWord">
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="url">
                        <strong>URL:</strong> {endpoint.url}
                      </DataListCell>,
                      <DataListCell key="modelName">
                        <strong>Model Name:</strong> {endpoint.modelName}
                      </DataListCell>,
                      <DataListCell key="apiKey">
                        <strong>API Key:</strong> {renderApiKey(endpoint.apiKey, endpoint.isApiKeyVisible || false)}
                        <Button variant="link" onClick={() => toggleApiKeyVisibility(endpoint.id)}>
                          {endpoint.isApiKeyVisible ? <EyeSlashIcon /> : <EyeIcon />}
                        </Button>
                      </DataListCell>
                    ]}
                  />
                  <DataListAction aria-labelledby="endpoint-actions" id="endpoint-actions" aria-label="Actions">
                    <Button variant="primary" onClick={() => handleEditEndpoint(endpoint)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteEndpoint(endpoint.id)}>
                      Delete
                    </Button>
                  </DataListAction>
                </DataListItemRow>
              </DataListItem>
            ))}
          </DataList>
        </PageSection>
        {isModalOpen && (
          <Modal
            title={currentEndpoint?.id ? 'Edit Endpoint' : 'Add Endpoint'}
            isOpen={isModalOpen}
            onClose={handleModalToggle}
            variant={ModalVariant.medium}
            actions={[
              <Button key="save" variant="primary" onClick={handleSaveEndpoint}>
                Save
              </Button>,
              <Button key="cancel" variant="link" onClick={handleModalToggle}>
                Cancel
              </Button>
            ]}
          >
            <Form>
              <FormGroup label="URL" isRequired fieldId="url">
                <TextInput isRequired type="text" id="url" name="url" value={url} onChange={(_, value) => setUrl(value)} placeholder="Enter URL" />
              </FormGroup>
              <FormGroup label="Model Name" isRequired fieldId="modelName">
                <TextInput
                  isRequired
                  type="text"
                  id="modelName"
                  name="modelName"
                  value={modelName}
                  onChange={(_, value) => setModelName(value)}
                  placeholder="Enter Model Name"
                />
              </FormGroup>
              <FormGroup label="API Key" isRequired fieldId="apiKey">
                <InputGroup>
                  <TextInput
                    isRequired
                    type="password"
                    id="apiKey"
                    name="apiKey"
                    value={apiKey}
                    onChange={(_, value) => setApiKey(value)}
                    placeholder="Enter API Key"
                  />
                </InputGroup>
              </FormGroup>
            </Form>
          </Modal>
        )}
      </Page>
    </AppLayout>
  );
};

export default EndpointsPage;
