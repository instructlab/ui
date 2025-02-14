// src/components/Contribute/Knowledge/Native/DocumentInformation/DocumentInformation.tsx
import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertActionLink,
  AlertActionCloseButton,
  AlertGroup,
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
  ModalVariant,
  TextInput
} from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { UploadFile } from '@/components/Contribute/Knowledge/UploadFile';

interface Props {
  isEditForm?: boolean;
  knowledgeDocumentRepositoryUrl: string;
  setKnowledgeDocumentRepositoryUrl: (val: string) => void;
  knowledgeDocumentCommit: string;
  setKnowledgeDocumentCommit: (val: string) => void;
  documentName: string;
  setDocumentName: (val: string) => void;
}

interface AlertInfo {
  type: 'success' | 'danger' | 'info';
  title: string;
  message: string;
  link?: string;
}

const DocumentInformation: React.FC<Props> = ({
  isEditForm,
  knowledgeDocumentRepositoryUrl,
  setKnowledgeDocumentRepositoryUrl,
  knowledgeDocumentCommit,
  setKnowledgeDocumentCommit,
  documentName,
  setDocumentName
}) => {
  const [useFileUpload, setUseFileUpload] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalText, setModalText] = useState<string | undefined>();

  const [alertInfo, setAlertInfo] = useState<AlertInfo | undefined>();

  const [validRepo, setValidRepo] = useState<ValidatedOptions>(ValidatedOptions.default);
  const [validCommit, setValidCommit] = useState<ValidatedOptions>(ValidatedOptions.default);
  const [validDocumentName, setValidDocumentName] = useState<ValidatedOptions>(ValidatedOptions.default);

  useEffect(() => {
    if (isEditForm) {
      setValidRepo(ValidatedOptions.success);
      setValidCommit(ValidatedOptions.success);
      setValidDocumentName(ValidatedOptions.success);
    }
  }, [isEditForm]);

  const validateCommit = (commitStr: string) => {
    const commit = commitStr.trim();
    setValidCommit(commit.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateDocumentName = (document: string) => {
    const documentNameStr = document.trim();
    setValidDocumentName(documentNameStr.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleDocumentUpload = async () => {
    if (uploadedFiles.length > 0) {
      const alertInfo: AlertInfo = {
        type: 'info',
        title: 'Document upload(s) in progress!',
        message: 'Document upload(s) is in progress. You will be notified once the upload successfully completes.'
      };
      setAlertInfo(alertInfo);

      const fileContents: { fileName: string; fileContent: string }[] = [];

      await Promise.all(
        uploadedFiles.map(
          (file) =>
            new Promise<void>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const fileContent = e.target!.result as string;
                fileContents.push({ fileName: file.name, fileContent });
                resolve();
              };
              reader.onerror = reject;
              reader.readAsText(file);
            })
        )
      );

      if (fileContents.length === uploadedFiles.length) {
        try {
          const response = await fetch('/api/native/git/knowledge-files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: fileContents })
          });

          if (response.status === 201) {
            const result = await response.json();
            console.log('Files uploaded result:', result);
            setKnowledgeDocumentRepositoryUrl(result.repoUrl);
            setKnowledgeDocumentCommit(result.commitSha);
            setDocumentName(result.documentNames.join(', ')); // Populate the patterns field

            const alertInfo: AlertInfo = {
              type: 'success',
              title: 'Document uploaded successfully!',
              message: 'Documents have been submitted to local taxonomy knowledge docs repo to be referenced in the knowledge submission.'
            };
            setAlertInfo(alertInfo);
          } else {
            console.error('Knowledge document upload failed:', response.statusText);
            const alertInfo: AlertInfo = {
              type: 'danger',
              title: 'Failed to upload document!',
              message: `This upload failed. ${response.statusText}`
            };
            setAlertInfo(alertInfo);
          }
        } catch (error) {
          console.error('Knowledge document upload encountered an error:', error);
          const alertInfo: AlertInfo = {
            type: 'danger',
            title: 'Failed to upload document!',
            message: `This upload failed. ${(error as Error).message}`
          };
          setAlertInfo(alertInfo);
        }
      }
    }
  };

  const handleAutomaticUpload = () => {
    if (knowledgeDocumentRepositoryUrl.length > 0 || knowledgeDocumentCommit.length > 0 || documentName.length > 0) {
      setModalText('Switching to automatic upload will clear the document information. Are you sure you want to continue?');
      setIsModalOpen(true);
    } else {
      setUseFileUpload(true);
    }
  };

  const handleManualUpload = () => {
    if (uploadedFiles.length > 0) {
      setModalText('Switching to manual upload will clear the uploaded files. Are you sure you want to continue?');
      setIsModalOpen(true);
    } else {
      setUseFileUpload(false);
    }
  };

  const handleModalContinue = () => {
    if (useFileUpload) {
      setUploadedFiles([]);
    } else {
      console.log('Switching to manual entry - clearing repository and document info');
      setKnowledgeDocumentRepositoryUrl('');
      setValidRepo(ValidatedOptions.default);
      setKnowledgeDocumentCommit('');
      setValidCommit(ValidatedOptions.default);
      setDocumentName('');
      setValidDocumentName(ValidatedOptions.default);
    }
    setUseFileUpload(!useFileUpload);
    setIsModalOpen(false);
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <Content component="h4">Document Information</Content>
        <Content component="p">{`Add the relevant document's information.`}</Content>
      </FlexItem>
      <FlexItem>
        <Form>
          <FormGroup>
            <Flex gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Button
                  variant={useFileUpload ? 'primary' : 'secondary'}
                  className={useFileUpload ? 'button-active' : 'button-secondary'}
                  onClick={handleAutomaticUpload}
                >
                  Automatically Upload Documents
                </Button>
              </FlexItem>
              <FlexItem>
                <Button
                  variant={useFileUpload ? 'secondary' : 'primary'}
                  className={!useFileUpload ? 'button-active' : 'button-secondary'}
                  onClick={handleManualUpload}
                >
                  Manually Enter Document Details
                </Button>
              </FlexItem>
            </Flex>
          </FormGroup>
          {!useFileUpload ? (
            <>
              <FormGroup isRequired key={'doc-info-details-id'} label="Repo URL or Server Side File Path">
                <TextInput
                  isRequired
                  type="url"
                  aria-label="repo"
                  validated={validRepo}
                  placeholder="Enter repo URL where document exists"
                  value={knowledgeDocumentRepositoryUrl}
                  onChange={(_event, value) => setKnowledgeDocumentRepositoryUrl(value)}
                />
              </FormGroup>
              <FormGroup isRequired key={'doc-info-details-commit_sha'} label="Commit SHA">
                <TextInput
                  isRequired
                  type="text"
                  aria-label="commit"
                  placeholder="Enter the commit SHA of the document in that repo"
                  value={knowledgeDocumentCommit}
                  validated={validCommit}
                  onChange={(_event, value) => setKnowledgeDocumentCommit(value)}
                  onBlur={() => validateCommit(knowledgeDocumentCommit)}
                />
                {validCommit === ValidatedOptions.error && (
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem icon={<ExclamationCircleIcon />} variant={validCommit}>
                        Valid commit SHA is required.
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                )}
              </FormGroup>
              <FormGroup isRequired key={'doc-info-details-patterns'} label="Document names">
                <TextInput
                  isRequired
                  type="text"
                  aria-label="patterns"
                  placeholder="Enter the document names (comma separated)"
                  value={documentName}
                  validated={validDocumentName}
                  onChange={(_event, value) => setDocumentName(value)}
                  onBlur={() => validateDocumentName(documentName)}
                />
                {validDocumentName === ValidatedOptions.error && (
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem icon={<ExclamationCircleIcon />} variant={validDocumentName}>
                        Required field
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                )}
              </FormGroup>
            </>
          ) : (
            <FormGroup isRequired label="Uploaded files">
              <UploadFile onFilesChange={handleFilesChange} />
              <Button variant="primary" onClick={handleDocumentUpload} isDisabled={uploadedFiles.length === 0}>
                Submit Files
              </Button>
            </FormGroup>
          )}
        </Form>
      </FlexItem>
      {alertInfo && (
        <AlertGroup isToast isLiveRegion>
          <Alert
            timeout
            variant={alertInfo.type}
            title={alertInfo.title}
            actionClose={<AlertActionCloseButton onClose={() => setAlertInfo(undefined)} />}
          >
            {alertInfo.message}
            {alertInfo.link && (
              <AlertActionLink href={alertInfo.link} target="_blank" rel="noopener noreferrer">
                View it here
              </AlertActionLink>
            )}
          </Alert>
        </AlertGroup>
      )}
      {isModalOpen ? (
        <Modal variant={ModalVariant.medium} isOpen onClose={() => setIsModalOpen(false)}>
          <ModalHeader title="Data Loss Warning" titleIconVariant="warning" />
          <ModalBody>{modalText}</ModalBody>
          <ModalFooter>
            <Button key="Continue" variant="secondary" onClick={handleModalContinue}>
              Continue
            </Button>
            <Button key="cancel" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}
    </Flex>
  );
};

export default DocumentInformation;
