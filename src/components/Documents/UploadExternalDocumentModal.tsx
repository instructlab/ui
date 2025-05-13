// src/components/Contribute/Knowledge/UploadFromGitModal.tsx
'use client';
import React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  Button,
  Content,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  Spinner,
  TextInput,
  ValidatedOptions
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

const getUrlValidation = (urlStr: string) => {
  const url = urlStr.trim();
  if (url.length === 0) {
    return ValidatedOptions.error;
  }
  try {
    new URL(url);
    return ValidatedOptions.default;
  } catch (e) {
    return ValidatedOptions.warning;
  }
};

interface Props {
  onAddFile: (newFile: File) => void;
  onClose: () => void;
}

export const UploadExternalDocumentModal: React.FunctionComponent<Props> = ({ onAddFile, onClose }) => {
  const [enterUrl, setEnterUrl] = React.useState<boolean>(true);
  const [externalUrl, setExternalUrl] = React.useState<string>('');
  const [validExternalUrl, setValidExternalUrl] = React.useState<ValidatedOptions>();
  const [repositoryURL, setRepositoryURL] = React.useState<string>('');
  const [commitSHA, setCommitSHA] = React.useState<string>('');
  const [documentName, setDocumentName] = React.useState<string>('');
  const [validRepo, setValidRepo] = React.useState<ValidatedOptions>();
  const [validCommit, setValidCommit] = React.useState<ValidatedOptions>();
  const [validDocumentName, setValidDocumentName] = React.useState<ValidatedOptions>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  const validateUrl = (urlStr: string) => setValidExternalUrl(getUrlValidation(urlStr));

  const validateRepo = (repoStr: string) => setValidRepo(getUrlValidation(repoStr));

  const validateCommit = (commitStr: string) => {
    const commit = commitStr.trim();
    setValidCommit(commit.length > 0 ? ValidatedOptions.default : ValidatedOptions.error);
  };

  const validateDocumentName = (document: string) => {
    const documentNameStr = document.trim();
    setValidDocumentName(documentNameStr.length > 0 ? ValidatedOptions.default : ValidatedOptions.error);
  };

  const onSave = async () => {
    setIsLoading(true);
    setDownloadError(null);
    const remoteFileURL = enterUrl ? externalUrl : `${repositoryURL.replace('github.com', 'raw.githubusercontent.com')}/${commitSHA}/${documentName}`;

    try {
      // Call the API to get the document
      const res = await fetch('/api/convert-http', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: {
            from_formats: ['docx', 'pptx', 'html', 'image', 'pdf', 'asciidoc', 'md', 'xlsx'],
            to_formats: ['md'],
            image_export_mode: 'placeholder',
            table_mode: 'fast',
            abort_on_error: false,
            return_as_file: false,
            do_table_structure: true,
            include_images: false
          },
          http_sources: [{ url: remoteFileURL }]
        })
      });

      if (!res.ok) {
        // Check if it's a 503 => offline service
        if (res.status === 503) {
          console.error('Conversion service offline, unable to download file.');
          setDownloadError('The file conversion service is offline. Only local Markdown files can be accepted until service is restored.');
        } else {
          console.error(`Conversion service responded with status ${res.status}`);
          setDownloadError(`Could not convert file, service error: ${res.statusText}`);
        }
        setIsLoading(false);
        return;
      }

      // 3) We expect JSON-wrapped markdown => { content: "..." }
      const data = await res.json();
      const mdContent = data.content.document.md_content;

      // 4) Create a new `.md` File object
      let fileName = documentName;
      if (enterUrl) {
        const parts = externalUrl.split('/');
        fileName = parts[parts.length - 1];
      }
      const newName = fileName.replace(/\.[^/.]+$/, '') + '.md';
      const mdBlob = new Blob([mdContent], { type: 'text/markdown' });
      const mdFile = new File([mdBlob], newName, { type: 'text/markdown' });

      onAddFile(mdFile);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Conversion error:', error);
      } else {
        console.error('Unknown conversion error:', error);
      }
      setDownloadError('An unknown error occurred during file conversion.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValid =
    !isLoading &&
    (enterUrl
      ? validExternalUrl === ValidatedOptions.default
      : validDocumentName === ValidatedOptions.default && validRepo === ValidatedOptions.default && validCommit === ValidatedOptions.default);

  return (
    <Modal
      variant="small"
      isOpen
      aria-label="upload an external file"
      onClose={() => onClose()}
      aria-labelledby="file-upload-label"
      aria-describedby="file-upload-description"
    >
      <ModalHeader aria-label="file-upload-label" title="Upload an external document" />
      <ModalBody>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Content aria-label="git-upload-description">Enter the document details below.</Content>
          </FlexItem>
          <FlexItem>
            <Form>
              <Radio name="urlOption" id="url-radio" label="Enter URL" isChecked={enterUrl} onChange={() => setEnterUrl(true)} />
              {enterUrl ? (
                <FormGroup isRequired fieldId="external-url" label="URL">
                  <TextInput
                    id="repo-url"
                    isRequired
                    type="text"
                    aria-label="repository url"
                    value={externalUrl}
                    validated={validExternalUrl}
                    onChange={(_event, value) => setExternalUrl(value)}
                    onBlur={() => validateUrl(externalUrl)}
                  />
                  {validExternalUrl && validExternalUrl !== ValidatedOptions.default ? (
                    <FormHelperText>
                      <HelperText>
                        {validExternalUrl === ValidatedOptions.error ? (
                          <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                            Required field
                          </HelperTextItem>
                        ) : (
                          <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                            Enter a valid URL
                          </HelperTextItem>
                        )}
                      </HelperText>
                    </FormHelperText>
                  ) : null}
                </FormGroup>
              ) : null}
              <Radio name="repoOption" id="repo-radio" label="Enter git repositiory" isChecked={!enterUrl} onChange={() => setEnterUrl(false)} />
              {!enterUrl ? (
                <>
                  <FormGroup isRequired fieldId="doc-name" label="Document name">
                    <TextInput
                      id="doc-name"
                      isRequired
                      type="text"
                      aria-label="document name"
                      validated={validDocumentName}
                      value={documentName}
                      onChange={(_event, value) => setDocumentName(value)}
                      onBlur={() => validateDocumentName(documentName)}
                    />
                    {validDocumentName === ValidatedOptions.error ? (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                            Required field
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    ) : null}
                  </FormGroup>
                  <FormGroup isRequired fieldId="repo-url" label="Repository URL">
                    <TextInput
                      id="repo-url"
                      isRequired
                      type="text"
                      aria-label="repository url"
                      value={repositoryURL}
                      validated={validRepo}
                      onChange={(_event, value) => setRepositoryURL(value)}
                      onBlur={() => validateRepo(repositoryURL)}
                    />
                    {validRepo && validRepo !== ValidatedOptions.default ? (
                      <FormHelperText>
                        <HelperText>
                          {validRepo === ValidatedOptions.error ? (
                            <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                              Required field
                            </HelperTextItem>
                          ) : (
                            <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                              Enter a valid URL
                            </HelperTextItem>
                          )}
                        </HelperText>
                      </FormHelperText>
                    ) : null}
                  </FormGroup>
                  <FormGroup isRequired fieldId="commit-sha" label="Commit SHA">
                    <TextInput
                      id="commit-sha"
                      isRequired
                      type="text"
                      value={commitSHA}
                      validated={validCommit}
                      onChange={(_event, value) => setCommitSHA(value)}
                      onBlur={() => validateCommit(commitSHA)}
                    />
                    {validCommit === ValidatedOptions.error ? (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                            Required field
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    ) : null}
                  </FormGroup>
                </>
              ) : null}
            </Form>
          </FlexItem>
          {isLoading ? (
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} gap={{ default: 'gapMd' }}>
              <FlexItem>
                <Spinner size="lg" />
              </FlexItem>
              <FlexItem>Uploading and converting files to Markdown file format…</FlexItem>
            </Flex>
          ) : null}
          {downloadError ? (
            <FlexItem>
              <Alert
                isInline
                variant="danger"
                title="Error downloading file"
                actionClose={
                  <AlertActionCloseButton
                    onClose={() => {
                      setDownloadError(null);
                    }}
                  />
                }
              >
                <p>{downloadError}</p>
              </Alert>
            </FlexItem>
          ) : null}
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button key="save" variant="primary" isDisabled={!isValid} onClick={() => onSave()}>
          Upload
        </Button>
        <Button key="close" variant="secondary" isDisabled={isLoading} onClick={() => onClose()}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UploadExternalDocumentModal;
