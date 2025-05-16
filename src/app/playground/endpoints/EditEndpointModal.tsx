'use client';

import React from 'react';
import { Endpoint, ModelEndpointStatus } from '@/types';
import {
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Popover,
  TextInput,
  ValidatedOptions
} from '@patternfly/react-core';
import { ExclamationCircleIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { fetchEndpointStatus } from '@/services/modelService';

const removeTrailingSlash = (inputUrl: string): string => {
  if (inputUrl.slice(-1) === '/') {
    return inputUrl.slice(0, -1);
  }
  return inputUrl;
};

const validateUrl = (link: string): boolean => {
  try {
    new URL(link);
    return true;
  } catch (e) {
    return false;
  }
};

interface Props {
  endpoint: Endpoint;
  onClose: (endpoint?: Endpoint) => void;
}

const EditEndpointModal: React.FC<Props> = ({ endpoint, onClose }) => {
  const [endpointName, setEndpointName] = React.useState<string>(endpoint.name || '');
  const [endpointDescription, setEndpointDescription] = React.useState<string>(endpoint.description || '');
  const [url, setUrl] = React.useState<string>(endpoint.url || '');
  const [modelName, setModelName] = React.useState<string>(endpoint.modelName || '');
  const [modelDescription, setModelDescription] = React.useState<string>(endpoint.modelDescription || '');
  const [apiKey, setApiKey] = React.useState<string>(endpoint.apiKey || '');
  const [nameTouched, setNameTouched] = React.useState<boolean>();
  const [urlTouched, setUrlTouched] = React.useState<boolean>();
  const [modelNameTouched, setModelNameTouched] = React.useState<boolean>();
  const [apiKeyTouched, setApiKeyTouched] = React.useState<boolean>();

  const validName = endpointName.trim().length > 0;
  const validUrl = validateUrl(url);
  const validModelName = modelName.trim().length > 0;
  const validApiKey = apiKey.trim().length > 0;

  const isValid = validName && validUrl && validModelName && validApiKey;

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen
      onClose={() => onClose()}
      aria-labelledby="endpoint-modal-title"
      aria-describedby="endpoint-body-variant"
    >
      <ModalHeader
        title={endpoint?.id ? `Edit ${endpoint.name}` : 'Add a custom model endpoint'}
        labelId="endpoint-modal-title"
        description={
          endpoint?.id
            ? 'Update the model endpoint details below.'
            : 'Add a custom model endpoint to interact with and test a fine-tuned model using the chat interface.'
        }
      />
      <ModalBody>
        <Form>
          <FormGroup label="Endpoint name" isRequired fieldId="endpointName">
            <TextInput
              isRequired
              type="text"
              id="endpointName"
              name="endpointName"
              value={endpointName}
              onChange={(_, value) => setEndpointName(value)}
              placeholder="Enter name"
              onBlur={() => setNameTouched(true)}
            />
            {nameTouched && !validName ? (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            ) : null}
          </FormGroup>
          <FormGroup label="Endpoint description" fieldId="endpointDescription">
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
                <Button variant="link" isInline aria-label="More info">
                  <OutlinedQuestionCircleIcon />
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
              onBlur={() => setUrlTouched(true)}
            />
            {urlTouched && !validUrl ? (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                    Please enter a valid URL.
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            ) : null}
          </FormGroup>
          <FormGroup label="Model name" isRequired fieldId="modelName">
            <TextInput
              isRequired
              type="text"
              id="modelName"
              name="modelName"
              value={modelName}
              onChange={(_, value) => setModelName(value)}
              placeholder="Enter model name"
              onBlur={() => setModelNameTouched(true)}
            />
            {modelNameTouched && !validModelName ? (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            ) : null}
          </FormGroup>
          <FormGroup label="Model description" fieldId="modelDescription">
            <TextInput
              type="text"
              id="modelDescription"
              name="modelDescription"
              value={modelDescription}
              onChange={(_, value) => setModelDescription(value)}
              placeholder="Enter description"
            />
          </FormGroup>
          <FormGroup
            label="API Key"
            isRequired
            fieldId="apiKey"
            labelHelp={
              <Popover headerContent="What is an API Key?" bodyContent="An API key is a unique identifier used to authenticate requests to an API.">
                <Button variant="link" isInline aria-label="More info">
                  <OutlinedQuestionCircleIcon />
                </Button>
              </Popover>
            }
          >
            <TextInput
              isRequired
              type="password"
              id="apiKey"
              name="apiKey"
              value={apiKey}
              onChange={(_, value) => setApiKey(value)}
              placeholder="Enter API key"
              onBlur={() => setApiKeyTouched(true)}
            />
            {apiKeyTouched && !validApiKey ? (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            ) : null}
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="save"
          variant="primary"
          isDisabled={!isValid}
          onClick={async () => {
            const updatedUrl = removeTrailingSlash(url);
            const newEndpoint = {
              id: endpoint.id,
              name: endpointName,
              description: endpointDescription,
              url: updatedUrl,
              modelName: modelName,
              modelDescription: modelDescription,
              apiKey: apiKey,
              status: ModelEndpointStatus.unknown,
              enabled: true
            };
            newEndpoint.status = await fetchEndpointStatus(newEndpoint);
            onClose(newEndpoint);
          }}
        >
          {endpoint.id ? 'Save' : 'Add'}
        </Button>
        <Button key="cancel" variant="link" onClick={() => onClose()}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditEndpointModal;
