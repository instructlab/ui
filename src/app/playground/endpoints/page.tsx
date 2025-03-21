'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppLayout } from '@/components/AppLayout';
import { Endpoint } from '@/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  DataList,
  DataListAction,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  InputGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  PageBreadcrumb,
  PageSection,
  TextInput,
  Title
} from '@patternfly/react-core';
import { EyeSlashIcon, EyeIcon } from '@patternfly/react-icons';

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
    window.analytics.trackSingleItem(currentEndpoint ? 'Model Endpoint edited' : 'Model Endpoint added', {})
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
      <PageBreadcrumb hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
          <BreadcrumbItem isActive>Custom Model Endpoints</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection hasBodyWrapper={false}>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl" style={{ paddingTop: '5' }}>
              Custom Model Endpoints
            </Title>
          </FlexItem>
        </Flex>
        <Content>
          <br />
          Manage your own customer model endpoints. If you have a custom model that is served by an endpoint, you can add it here. This will allow you
          to use the custom model in the playground chat.
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Flex justifyContent={{ default: 'justifyContentFlexEnd' }} alignItems={{ default: 'alignItemsFlexEnd' }}>
          <FlexItem>
            <Button onClick={handleAddEndpoint}>Add Custom Endpoint</Button>
          </FlexItem>
        </Flex>
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
          variant={ModalVariant.medium}
          title={currentEndpoint?.id ? 'Edit Endpoint' : 'Add Endpoint'}
          isOpen={isModalOpen}
          onClose={() => handleModalToggle()}
          aria-labelledby="endpoint-modal-title"
          aria-describedby="endpoint-body-variant"
        >
          <ModalHeader title={currentEndpoint?.id ? 'Edit Endpoint' : 'Add Endpoint'} labelId="endpoint-modal-title" titleIconVariant="info" />
          <ModalBody id="endpoint-body-variant">
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
          </ModalBody>
          <ModalFooter>
            <Button key="save" variant="primary" onClick={handleSaveEndpoint}>
              Save
            </Button>
            <Button key="cancel" variant="link" onClick={handleModalToggle}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </AppLayout>
  );
};

export default EndpointsPage;
