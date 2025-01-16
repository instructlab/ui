// src/components/Contribute/Knowledge/Native/DocumentInformation/DocumentInformation.tsx
import React, { useEffect, useState } from 'react';
import { UploadFile } from '@/components/Contribute/Knowledge/UploadFile';
import { checkKnowledgeFormCompletion } from '@/components/Contribute/Knowledge/validation';
import { KnowledgeFormData } from '@/types';
import {
  ValidatedOptions,
  FormFieldGroupHeader,
  FormGroup,
  Button,
  Modal,
  ModalVariant,
  TextInput,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Alert,
  AlertActionCloseButton,
  AlertActionLink
} from '@patternfly/react-core';
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

interface AlertInfo {
  type: 'success' | 'danger' | 'info';
  title: string;
  message: string;
  link?: string;
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

  const [successAlertTitle, setSuccessAlertTitle] = useState<string | undefined>();
  const [successAlertMessage, setSuccessAlertMessage] = useState<string | undefined>();
  const [successAlertLink, setSuccessAlertLink] = useState<string | undefined>();

  const [failureAlertTitle, setFailureAlertTitle] = useState<string | undefined>();
  const [failureAlertMessage, setFailureAlertMessage] = useState<string | undefined>();
  const [alertInfo, setAlertInfo] = useState<AlertInfo | undefined>();

  const [validRepo, setValidRepo] = useState<ValidatedOptions>(ValidatedOptions.default);
  const [validCommit, setValidCommit] = useState<ValidatedOptions>(ValidatedOptions.default);
  const [validDocumentName, setValidDocumentName] = useState<ValidatedOptions>(ValidatedOptions.default);

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
    const documentNameStr = document.trim();
    if (documentNameStr.length > 0) {
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
        try {
          const response = await fetch('/api/native/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: fileContents })
          });

          if (response.status === 201) {
            const result = await response.json();
            console.log('Files uploaded result:', result);

            setSuccessAlertTitle('Document uploaded successfully!');
            setSuccessAlertMessage('Documents have been uploaded to your repo to be referenced in the knowledge submission.');
            if (result.prUrl && result.prUrl.trim() !== '') {
              setSuccessAlertLink(result.prUrl);
            } else {
              setSuccessAlertLink(undefined);
            }
          } else {
            console.error('Upload failed:', response.statusText);
            setFailureAlertTitle('Failed to upload document');
            setFailureAlertMessage(`This upload failed. ${response.statusText}`);
          }
        } catch (error) {
          console.error('Upload error:', error);
          setFailureAlertTitle('Failed to upload document');
          setFailureAlertMessage(`This upload failed. ${(error as Error).message}`);
        }
      }
    }
  };

  const onCloseSuccessAlert = () => {
    setSuccessAlertTitle(undefined);
    setSuccessAlertMessage(undefined);
    setSuccessAlertLink(undefined);
  };

  const onCloseFailureAlert = () => {
    setFailureAlertTitle(undefined);
    setFailureAlertMessage(undefined);
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
    <div>
      <FormFieldGroupHeader
        titleText={{
          text: (
            <p>
              Document Information <span style={{ color: 'red' }}>*</span>
            </p>
          ),
          id: 'doc-info-id'
        }}
        titleDescription="Add the relevant document's information"
      />
      <FormGroup>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant={useFileUpload ? 'primary' : 'secondary'}
            className={useFileUpload ? 'button-active' : 'button-secondary'}
            onClick={handleAutomaticUpload}
          >
            Automatically Upload Documents
          </Button>
          <Button
            variant={useFileUpload ? 'secondary' : 'primary'}
            className={!useFileUpload ? 'button-active' : 'button-secondary'}
            onClick={handleManualUpload}
          >
            Manually Enter Document Details
          </Button>
        </div>
      </FormGroup>
      <Modal variant={ModalVariant.medium} title="Data Loss Warning" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <p>{modalText}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <Button variant="secondary" onClick={handleModalContinue}>
            Continue
          </Button>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
      {!useFileUpload ? (
        <>
          <FormGroup isRequired key={'doc-info-details-id'} label="Repo URL or Server Side File Path">
            <TextInput
              isRequired
              // TODO: once all of the different potential filepaths/url/types are determined, add back stricter validation
              type="text"
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
        <>
          <UploadFile onFilesChange={handleFilesChange} />
          <Button variant="primary" onClick={handleDocumentUpload} isDisabled={uploadedFiles.length === 0}>
            Submit Files
          </Button>
        </>
      )}

      {/* Informational Alert */}
      {alertInfo && (
        <Alert variant={alertInfo.type} title={alertInfo.title} actionClose={<AlertActionCloseButton onClose={() => setAlertInfo(undefined)} />}>
          {alertInfo.message}
          {alertInfo.link && (
            <AlertActionLink href={alertInfo.link} target="_blank" rel="noopener noreferrer">
              View it here
            </AlertActionLink>
          )}
        </Alert>
      )}

      {/* Success Alert */}
      {successAlertTitle && successAlertMessage && (
        <Alert
          variant="success"
          title={successAlertTitle}
          actionClose={<AlertActionCloseButton onClose={onCloseSuccessAlert} />}
          actionLinks={
            successAlertLink ? (
              <AlertActionLink component="a" href={successAlertLink} target="_blank" rel="noopener noreferrer">
                View it here
              </AlertActionLink>
            ) : null
          }
        >
          {successAlertMessage}
        </Alert>
      )}

      {/* Failure Alert */}
      {failureAlertTitle && failureAlertMessage && (
        <Alert variant="danger" title={failureAlertTitle} actionClose={<AlertActionCloseButton onClose={onCloseFailureAlert} />}>
          {failureAlertMessage}
        </Alert>
      )}
    </div>
  );
};

export default DocumentInformation;
