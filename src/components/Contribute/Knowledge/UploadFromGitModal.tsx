// src/components/Contribute/Knowledge/UploadFromGitModal.tsx
'use client';
import React from 'react';
import {
  Modal,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Content,
  Form,
  FormGroup,
  TextInput,
  Flex,
  FlexItem,
  Alert,
  AlertActionCloseButton,
  Spinner,
  ValidatedOptions
} from '@patternfly/react-core';

interface Props {
  onAddFile: (newFile: File) => void;
  onClose: () => void;
}

export const UploadFromGitModal: React.FunctionComponent<Props> = ({ onAddFile, onClose }) => {
  const [repositoryURL, setRepositoryURL] = React.useState<string>('');
  const [commitSHA, setCommitSHA] = React.useState<string>('');
  const [documentName, setDocumentName] = React.useState<string>('');
  const [validRepo, setValidRepo] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validCommit, setValidCommit] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validDocumentName, setValidDocumentName] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  const validateRepo = (repoStr: string) => {
    const repo = repoStr.trim();
    if (repo.length === 0) {
      setValidRepo(ValidatedOptions.error);
      return;
    }
    try {
      new URL(repo);
      setValidRepo(ValidatedOptions.success);
      return;
    } catch (e) {
      setValidRepo(ValidatedOptions.warning);
      return;
    }
  };

  const validateCommit = (commitStr: string) => {
    const commit = commitStr.trim();
    setValidCommit(commit.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateDocumentName = (document: string) => {
    const documentNameStr = document.trim();
    setValidDocumentName(documentNameStr.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const onSave = async () => {
    setIsLoading(true);
    setDownloadError(null);
    const remoteFileURL = `${repositoryURL.replace('github.com', 'raw.githubusercontent.com')}/${commitSHA}/${documentName}`;
    console.log(`Uploading: ${remoteFileURL}`);

    try {
      // Call the API to get the document
      const res = await fetch('/api/native/convert-http', {
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
      const newName = documentName.replace(/\.[^/.]+$/, '') + '.md';
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

  return (
    <Modal
      variant="small"
      isOpen
      aria-label="upload from git repository"
      onClose={() => onClose()}
      aria-labelledby="unsupported-file-modal-title"
      aria-describedby="unsupported-file-body-variant"
    >
      <ModalHeader title="Document details" />
      <ModalBody>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Content>Enter the document details below.</Content>
          </FlexItem>
          <FlexItem>
            <Form>
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
              </FormGroup>
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
                // eslint-disable-next-line no-console
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
        <Button key="save" variant="primary" isDisabled={isLoading} onClick={() => onSave()}>
          Upload
        </Button>
        <Button key="close" variant="secondary" isDisabled={isLoading} onClick={() => onClose()}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UploadFromGitModal;
