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

enum ModelEndpointStatus {
  AVAILABLE = "available",
  UNAVAILABLE = "unavailable",
  UNKNOWN = "unknown",
  UNINITIALIZED = "uninitialized"
}

async function checkEndpointStatus(
  endpointURL: string,
  modelName: string,
  apiKey: string
): Promise<ModelEndpointStatus> {
  let headers;
  if (apiKey != "") {
    headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };
  } else {
    headers = {
      "Content-Type": "application/json",
    };
  }
  try {
    const response = await fetch(`${endpointURL}/v1/models/${modelName}`, {
      headers: headers
    });
    if (response.ok) {
      return ModelEndpointStatus.AVAILABLE;
    } else {
      return ModelEndpointStatus.UNAVAILABLE;
    }
  } catch (error) {
    return ModelEndpointStatus.UNKNOWN;
  }
}

interface ExtendedEndpoint extends Endpoint {
  isApiKeyVisible?: boolean;
  status?: ModelEndpointStatus;
}

const EndpointsPage: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ExtendedEndpoint[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<Partial<ExtendedEndpoint> | null>(null);
  const [endpointName, setEndpointName] = useState('');
  const [endpointDescription, setEndpointDescription] = useState('');
  const [url, setUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [endpointStatus, setEndpointStatus] = useState('');

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

  async function handleSaveEndpoint () {
    const updatedUrl = removeTrailingSlash(url);
    const status = await checkEndpointStatus(updatedUrl, modelName, apiKey)
    if (currentEndpoint) {
      const updatedEndpoint: ExtendedEndpoint = {
        id: currentEndpoint.id || uuidv4(),
        name: endpointName,
        description: endpointDescription,
        url: updatedUrl,
        modelName: modelName,
        modelDescription: modelDescription,
        apiKey: apiKey,
        isApiKeyVisible: false,
        status: status,
      };

      const updatedEndpoints = currentEndpoint.id
        ? endpoints.map((ep) => (ep.id === currentEndpoint.id ? updatedEndpoint : ep))
        : [...endpoints, updatedEndpoint];

      setEndpoints(updatedEndpoints);
      localStorage.setItem('endpoints', JSON.stringify(updatedEndpoints));
      setCurrentEndpoint(null);
      setEndpointName('');
      setEndpointDescription('');
      setUrl('');
      setModelName('');
      setModelDescription('');
      setApiKey('');
      setEndpointStatus(ModelEndpointStatus.UNINITIALIZED)
      handleModalToggle();
    }
  };

  const handleDeleteEndpoint = (id: string) => {
    const updatedEndpoints = endpoints.filter((ep) => ep.id !== id);
    setEndpoints(updatedEndpoints);
    localStorage.setItem('endpoints', JSON.stringify(updatedEndpoints));
  };

  async function handleEditEndpoint (endpoint: ExtendedEndpoint) {
    const updatedUrl = removeTrailingSlash(endpoint.url);
    const status = await checkEndpointStatus(updatedUrl, endpoint.modelName, endpoint.apiKey)
    setCurrentEndpoint(endpoint);
    setEndpointName(endpoint.name)
    setEndpointDescription(endpoint.description)
    setUrl(updatedUrl);
    setModelName(endpoint.modelName);
    setModelDescription(endpoint.modelDescription);
    setApiKey(endpoint.apiKey);
    setEndpointStatus(status)
    handleModalToggle();
  };

  const handleAddEndpoint = () => {
    setCurrentEndpoint({ id: '', name: '', description: '', url: '', modelName: '', modelDescription: '', apiKey: '', isApiKeyVisible: false, status: ModelEndpointStatus.UNINITIALIZED});
    setEndpointName('');
    setEndpointDescription('');
    setUrl('');
    setModelName('');
    setModelDescription('');
    setApiKey('');
    setEndpointStatus(ModelEndpointStatus.UNINITIALIZED)
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
                    <DataListCell key="name">
                    <strong>Endpoint Name:</strong> {endpoint.name}
                    </DataListCell>,
                    <DataListCell key="description">
                      <strong>Endpoint Description:</strong> {endpoint.description}
                    </DataListCell>,
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
