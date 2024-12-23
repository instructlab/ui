import React, { useEffect, useState } from 'react';
import { UploadFile } from '@/components/Contribute/Knowledge/UploadFile';
import { checkKnowledgeFormCompletion } from '@/components/Contribute/Knowledge/validation';
import { KnowledgeFormData } from '@/types';
import { ValidatedOptions, FormFieldGroupHeader, FormGroup, Button, Modal, ModalVariant, TextInput, FormHelperText, HelperText, HelperTextItem, AlertGroup, Alert, AlertActionCloseButton, AlertActionLink, ModalHeader, ModalBody, ModalFooter } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

interface Props {
  reset: boolean;
  isEditForm?: boolean;
  knowledgeFormData: KnowledgeFormData;
  setDisableAction: React.Dispatch<React.SetStateAction<boolean>>;
  knowledgeDocumentRepositoryUrl: string;
  setKnowledgeDocumentRepositoryUrl: React.Dispatch<React.SetStateAction<string>>;
  knowledgeDocumentCommit: string;
  setKnowledgeDocumentCommit: React.Dispatch<React.SetStateAction<string>>;
  documentName: string;
  setDocumentName: React.Dispatch<React.SetStateAction<string>>;
}

const DocumentInformation: React.FC<Props> = ({
  reset,
  isEditForm,
  knowledgeFormData,
  setDisableAction,
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
  const [validRepo, setValidRepo] = useState<ValidatedOptions>();
  const [validCommit, setValidCommit] = useState<ValidatedOptions>();
  const [validDocumentName, setValidDocumentName] = useState<ValidatedOptions>();

  interface AlertInfo {
    type: 'success' | 'danger' | 'info';
    title: string;
    message: string;
    link?: string;
  }
  useEffect(() => {
    setValidRepo(ValidatedOptions.default);
    setValidCommit(ValidatedOptions.default);
    setValidDocumentName(ValidatedOptions.default);
  }, [reset]);

  useEffect(() => {
    if (isEditForm) {
      setValidRepo(ValidatedOptions.success);
      setValidCommit(ValidatedOptions.success);
      setValidDocumentName(ValidatedOptions.success);
    }
  }, [isEditForm]);

  const validateRepo = (repoStr: string) => {
    const repo = repoStr.trim();
    if (repo.length === 0) {
      setDisableAction(true);
      setValidRepo(ValidatedOptions.error);
      return;
    }
    try {
      new URL(repo);
      setValidRepo(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    } catch (e) {
      setDisableAction(true);
      setValidRepo(ValidatedOptions.warning);
      return;
    }
  };

  const validateCommit = (commitStr: string) => {
    const commit = commitStr.trim();
    if (commit.length > 0) {
      setValidCommit(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    }
    setDisableAction(true);
    setValidCommit(ValidatedOptions.error);
    return;
  };

  const validateDocumentName = (document: string) => {
    const documentName = document.trim();
    if (documentName.length > 0) {
      setValidDocumentName(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    }
    setDisableAction(true);
    setValidDocumentName(ValidatedOptions.error);
    return;
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
        const response = await fetch('/api/native/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ files: fileContents })
        });

        if (!response.ok) {
          const alertInfo: AlertInfo = {
            type: 'danger',
            title: 'Document upload failed!',
            message: `Upload failed for the added documents. ${response.statusText}`
          };
          setAlertInfo(alertInfo);
          new Error(response.statusText || 'Document upload failed');
          return;
        }

        const result = await response.json();

        setKnowledgeDocumentRepositoryUrl(result.repoUrl);
        setKnowledgeDocumentCommit(result.commitSha);
        setDocumentName(result.documentNames.join(', ')); // Populate the patterns field
        console.log('Files uploaded:', result.documentNames);

        const alertInfo: AlertInfo = {
          type: 'success',
          title: 'Document uploaded successfully!',
          message: 'Documents have been uploaded to your repo to be referenced in the knowledge submission.'
        };
        if (result.prUrl !== '') {
          alertInfo.link = result.prUrl;
        }
        setAlertInfo(alertInfo);
      }
    }
  };

  const onCloseSuccessAlert = () => {
    setAlertInfo(undefined);
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
    <div>
      <FormFieldGroupHeader titleDescription="Add the relevant document's information: " />
      <FormGroup>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant={useFileUpload ? 'primary' : 'secondary'}
            className={useFileUpload ? 'button-active' : 'button-secondary'}
            onClick={() => handleAutomaticUpload()}
          >
            Automatically Upload Documents
          </Button>
          <Button
            variant={useFileUpload ? 'secondary' : 'primary'}
            className={!useFileUpload ? 'button-active' : 'button-secondary'}
            onClick={() => handleManualUpload()}
          >
            Manually Enter Document Details
          </Button>
        </div>
      </FormGroup>
      <Modal
        variant={ModalVariant.medium}
        title="Data Loss Warning"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="file-upload-switch-modal-title"
        aria-describedby="file-upload-switch-body-variant"
      >
        <ModalHeader title="Data Loss Warning" labelId="file-upload-switch-modal-title" titleIconVariant="warning" />
        <ModalBody id="file-upload-switch-body-variant">
          <p>{modalText}</p>
        </ModalBody>
        <ModalFooter >
          <Button key="Continue" variant="secondary" onClick={() => handleModalContinue()}>
            Continue
          </Button>,
          <Button key="cancel" variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {!useFileUpload ? (
        <>
          <FormGroup isRequired key={'doc-info-details-id'} label="Repo URL">
            <TextInput
              isRequired
              type="url"
              aria-label="repo"
              validated={validRepo}
              placeholder="Enter repo url where document exists"
              value={knowledgeDocumentRepositoryUrl}
              onChange={(_event, value) => setKnowledgeDocumentRepositoryUrl(value)}
              onBlur={() => validateRepo(knowledgeDocumentRepositoryUrl)}
            />
            {validRepo === ValidatedOptions.error && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={validRepo}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
            {validRepo === ValidatedOptions.warning && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
                    Please enter a valid URL.
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup isRequired key={'doc-info-details-commit_sha'} label="Commit SHA">
            <TextInput
              isRequired
              type="text"
              aria-label="commit"
              placeholder="Enter the commit sha of the document in that repo"
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
              placeholder="Enter the documents name (comma separated)"
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
        <>
          <UploadFile onFilesChange={handleFilesChange} />
          <Button variant="primary" onClick={handleDocumentUpload}>
            Submit Files
          </Button>
        </>
      )}

      {alertInfo && (
        <AlertGroup isToast isLiveRegion>
          <Alert
            variant={alertInfo.type}
            title={alertInfo.title}
            actionClose={<AlertActionCloseButton onClose={onCloseSuccessAlert} />}
            actionLinks={
              alertInfo.link && (
                <>
                  <AlertActionLink component="a" href={alertInfo.link} rel="noopener noreferrer">
                    View it here
                  </AlertActionLink>
                </>
              )
            }
          >
            {alertInfo.message}
          </Alert>
        </AlertGroup>
      )}
    </div>
  );
};

export default DocumentInformation;
