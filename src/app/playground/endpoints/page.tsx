'use client';

import React, {  ReactNode, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppLayout } from '@/components/AppLayout';
import { Endpoint, EndpointRequiredFields } from '@/types';
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
  Dropdown,
  DropdownList,
  DropdownItem,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  InputGroup,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  PageBreadcrumb,
  PageSection,
  Popover,
  TextInput,
  Title
} from '@patternfly/react-core';
import { BanIcon, CheckCircleIcon, EyeSlashIcon, EllipsisVIcon , EyeIcon, QuestionCircleIcon } from '@patternfly/react-icons';


interface ModelEndpointStatus {
  status: string;
  icon: ReactNode;
}

const availableModelEndpointStatus: ModelEndpointStatus = {
  status: "available",
  icon: <CheckCircleIcon style={{color: "var(--pf-t--global--border--color--status--success--default)" }}/>,
};

const unavailableModelEndpointStatus: ModelEndpointStatus = {
  status: "unavailable",
  icon: <BanIcon style={{ color: "var(--pf-t--global--icon--color--status--danger--default)" }}/>,
};

const unknownModelEndpointStatus: ModelEndpointStatus = {
  status: "unknown",
  icon: <QuestionCircleIcon style={{color: "var(--pf-t--global--icon--color--disabled)"}} />,
};


async function checkEndpointStatus(
  endpointURL: string,
  modelName: string,
  apiKey: string
): Promise<ModelEndpointStatus> {
  console.log("checking the model endpoint")
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
      return availableModelEndpointStatus;
    } else {
      return unavailableModelEndpointStatus;
    }
  } catch (error) {
    return unknownModelEndpointStatus;
  }
}

interface ExtendedEndpoint extends Endpoint {
  isApiKeyVisible?: boolean;
  status?: ModelEndpointStatus;
  optionsOpen?: boolean;
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
  const [endpointStatus, setEndpointStatus] = useState(unknownModelEndpointStatus);
  const [endpointOptionsOpen, setEndpointOptionsOpen] = React.useState<boolean>(false);
  const [deleteEndpointModalOpen, setDeleteEndpointModalOpen] = useState(false)

  useEffect(() => {
    const storedEndpoints = localStorage.getItem('endpoints');
    if (storedEndpoints) {
      setEndpoints(JSON.parse(storedEndpoints));
    }
  }, []);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleEndpointOptionsToggle = (endpoint: ExtendedEndpoint) => {
    console.log("endpoint has been toggled: ", endpoint.id)
    console.log("endpoint's setting open?", !endpoint.optionsOpen)
    console.log("endpoint options open before?: ", endpointOptionsOpen)
    setEndpointOptionsOpen(!endpointOptionsOpen)
    console.log("endpoint options open before?: ", endpointOptionsOpen)
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

const validateEndpointData = (endpoint: ExtendedEndpoint): boolean => {
  let returnValue = true
  EndpointRequiredFields.forEach((requiredField) => {
    if (endpoint[requiredField]?.trim().length == 0) {
      returnValue = false
    }
  })
  return returnValue
}

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
      if (validateEndpointData(updatedEndpoint) == true) {
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
        setEndpointStatus(unknownModelEndpointStatus)
        handleModalToggle();
      } else {
        alert("error: please make sure all the required fields are set!")
      }
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
    setEndpointDescription(endpoint.description || '')
    setUrl(updatedUrl);
    setModelName(endpoint.modelName);
    setModelDescription(endpoint.modelDescription || '');
    setApiKey(endpoint.apiKey);
    setEndpointStatus(status)
    handleModalToggle();
  };

  const handleAddEndpoint = () => {
    setCurrentEndpoint({ id: '', name: '', description: '', url: '', modelName: '', modelDescription: '', apiKey: '', isApiKeyVisible: false, status: unknownModelEndpointStatus});
    setEndpointName('');
    setEndpointDescription('');
    setUrl('');
    setModelName('');
    setModelDescription('');
    setApiKey('');
    setEndpointStatus(unknownModelEndpointStatus)
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
        <Flex justifyContent={{ default: 'justifyContentSpaceEvenly' }} style={{ width: "90%" }}>
          <FlexItem style={{ marginLeft: "auto" }}>
            <Button onClick={handleAddEndpoint}>Add Custom Endpoint</Button>
          </FlexItem>
        </Flex>
        <DataList aria-label="Endpoints list">
          <DataListItem key="property-headers" style={{ width: "90%" }}>
            <DataListItemRow wrapModifier="breakWord">
              <DataListItemCells dataListCells={[
                  <DataListCell key="nameHeader">
                    <strong>Endpoint Name</strong>
                  </DataListCell>,
                  <DataListCell key="statusHeader">
                  <strong>Endpoint Status</strong>
                  </DataListCell>,
                  <DataListCell key="urlHeader">
                    <strong>URL</strong>
                  </DataListCell>,
                  <DataListCell key="modelNameHeader">
                    <strong>Model Name</strong>
                  </DataListCell>,
                  <DataListCell key="apiKeyHeader">
                    <strong>API Key</strong>
                  </DataListCell>
                ]}
              />
            </DataListItemRow>
          </DataListItem>
          {endpoints.map((endpoint) => (
            <DataListItem key={endpoint.id} style={{ padding: "0 0 0 0"}}>
              <DataListItemRow wrapModifier="breakWord" style={{ padding: "0 0 0 0"}}>
                <DataListItemCells
                  dataListCells={[
                    <DataListCell style={{ paddingLeft: "12px" }} key="name"> 
                      <h4> {endpoint.name} </h4>
                      <br/>
                      <p> {endpoint.description} </p>
                    </DataListCell>,
                    <DataListCell style={{ paddingLeft: "12px" }} key="status"> {endpoint.status?.status} {endpoint.status?.icon} </DataListCell>,
                    <DataListCell style={{ paddingLeft: "12px" }} key="url"> {endpoint.url} </DataListCell>,
                    <DataListCell style={{ paddingLeft: "12px" }} key="modelName">
                      <h4> {endpoint.modelName} </h4>
                      <br/>
                      <p> {endpoint.modelDescription} </p>
                    </DataListCell>,
                    <DataListCell style={{ paddingLeft: "12px" }} key="apiKey">
                      {renderApiKey(endpoint.apiKey, endpoint.isApiKeyVisible || false)}
                      <Button variant="link" onClick={() => toggleApiKeyVisibility(endpoint.id)}>
                        {endpoint.isApiKeyVisible ? <EyeSlashIcon /> : <EyeIcon />}
                      </Button>
                    </DataListCell>
                  ]}
                />
                <DataListAction aria-labelledby="endpoint-actions" id="endpoint-actions" aria-label="Actions">
                  <Button variant="secondary" onClick={() => console.log("stubbing disable")}>
                    disable
                  </Button>
                  <Button variant="secondary" onClick={() => setEndpointOptionsOpen(true)}>
                    <EllipsisVIcon/>
                  </Button>
                  {/* {deleteEndpointModalOpen ? (
                    <Modal
                      variant={ModalVariant.medium}
                      isOpen={isModalOpen}
                      onClose={handleModalToggle}
                      aria-labelledby="confirm-delete-custom-model-endpoint"
                      aria-describedby="show-yaml-body-variant"
                    >
                      <ModalHeader titleIconVariant="warning" title="Delete custom model endpoint?" labelId="confirm-delete-custom-model-endpoint-title" />
                      <ModalBody id="delete-custom-model-endpoint">
                        some text here
                      </ModalBody>
                    </Modal>
                  ) : null} */}
                  {endpointOptionsOpen ? (
                    <Dropdown
                      onOpenChange={(isEndpointOptionsOpen) => setEndpointOptionsOpen(isEndpointOptionsOpen)}
                      onSelect={() => setEndpointOptionsOpen(false)}
                      toggle={(toggleRef) => (
                        <MenuToggle
                          aria-label="actions"
                          variant="plain"
                          ref={toggleRef}
                          onClick={() => setEndpointOptionsOpen(!endpointOptionsOpen)}
                          isExpanded={endpointOptionsOpen}
                        >
                          <p> SOMETHING SHOW UP</p>
                          <EllipsisVIcon />
                        </MenuToggle>                   
                      )}
                      isOpen={endpointOptionsOpen}
                      ouiaId="ModelEndpointDropdown"
                    >
                    <DropdownList>
                      <DropdownItem >Clear chat</DropdownItem>
                      {/* {onClose ? <DropdownItem onClick={onClose}>Close chat</DropdownItem> : null} */}
                    </DropdownList>
                    </Dropdown>
                  ) : null }
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
            <div style={{ marginBottom: "1rem" }}>
              <p>
                Add a custom model endpoint for chat the interface. Use it to compare or interact with remote hosted models.
              </p>
            </div>
            <Form>
              <FormGroup label="Endpoint Name" isRequired fieldId="endpointName">
                <TextInput
                  isRequired
                  type="text"
                  id="endpointName"
                  name="endpointName"
                  value={endpointName}
                  onChange={(_, value) => setEndpointName(value)}
                  placeholder="Enter name"
                />
              </FormGroup>
              <FormGroup label="Endpoint Description" fieldId="endpointDescription">
                <TextInput
                  type="text"
                  id="endpointDescription"
                  name="endpointDescription"
                  value={endpointDescription}
                  onChange={(_, value) => setEndpointDescription(value)}
                  placeholder="Enter description"
                />
              </FormGroup>
              <FormGroup
                label="URL"
                isRequired
                fieldId="url"
                labelHelp={
                  <Popover
                    headerContent="Which URL do I use?"
                    bodyContent="This should be the full endpoint of what you want to use for chat inference. For example, with OpenAI this would be: `https://api.openai.com/v1/chat/completions` (IE. it should include the path)."
                  >
                    <Button variant="plain" aria-label="More info">
                      <QuestionCircleIcon />
                    </Button>
                  </Popover>
                }
              >
                <TextInput
                  isRequired
                  type="text"
                  id="url"
                  name="url"
                  value={url}
                  onChange={(_, value) => setUrl(value)}
                  placeholder="Enter URL"
                />
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
              <FormGroup label="Model Description" fieldId="modelDescription">
                <TextInput
                  type="text"
                  id="modelDescription"
                  name="modelDescription"
                  value={modelDescription}
                  onChange={(_, value) => setModelDescription(value)}
                  placeholder="Enter description"
                />
              </FormGroup>
              <FormGroup label="API Key" isRequired fieldId="apiKey" labelHelp={
                <Popover
                headerContent="What is an API Key?"
                bodyContent="An API key is a unique identifier used to authenticate requests to an API."
                >
                  <Button variant="plain" aria-label="More info">
                    <QuestionCircleIcon />
                  </Button>
                </Popover>
              }>
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
