import React, { useState } from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup, FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { UploadFile } from './../UploadFile';
import { Alert, AlertActionLink, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { KnowledgeFormData } from '..';
import { checkKnowledgeFormCompletion } from '../validation';

interface Props {
  knowledgeFormData: KnowledgeFormData;
  setDisableAction: React.Dispatch<React.SetStateAction<boolean>>;
  knowledgeDocumentRepositoryUrl: string;
  setKnowledgeDocumentRepositoryUrl: React.Dispatch<React.SetStateAction<string>>;
  knowledgeDocumentCommit: string;
  setKnowledgeDocumentCommit: React.Dispatch<React.SetStateAction<string>>;
  documentName: string;
  setDocumentName: React.Dispatch<React.SetStateAction<string>>;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const DocumentInformation: React.FC<Props> = ({
  knowledgeFormData,
  setDisableAction,
  knowledgeDocumentRepositoryUrl,
  setKnowledgeDocumentRepositoryUrl,
  knowledgeDocumentCommit,
  setKnowledgeDocumentCommit,
  documentName,
  setDocumentName,
  uploadedFiles,
  setUploadedFiles
}) => {
  const [useFileUpload, setUseFileUpload] = useState(true);

  const [successAlertTitle, setSuccessAlertTitle] = useState<string | undefined>();
  const [successAlertMessage, setSuccessAlertMessage] = useState<string | undefined>();
  const [successAlertLink, setSuccessAlertLink] = useState<string | undefined>();

  const [failureAlertTitle, setFailureAlertTitle] = useState<string | undefined>();
  const [failureAlertMessage, setFailureAlertMessage] = useState<string | undefined>();

  const [validRepo, setValidRepo] = useState<ValidatedOptions>();
  const [validCommit, setValidCommit] = useState<ValidatedOptions>();
  const [validDocumentName, setValidDocumentName] = useState<ValidatedOptions>();

  const validateRepo = (repo: string) => {
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

  const validateCommit = (commit: string) => {
    if (commit.length > 0) {
      setValidCommit(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    }
    setDisableAction(true);
    setValidCommit(ValidatedOptions.error);
    return;
  };

  const validateDocumentName = (documentName: string) => {
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
    setDocumentName(files.map((file) => file.name).join(', ')); // Populate the patterns field
  };

  const handleDocumentUpload = async () => {
    if (uploadedFiles.length > 0) {
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
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ files: fileContents })
        });

        if (!response.ok) {
          setFailureAlertTitle('Failed to upload document');
          setFailureAlertMessage(`This upload failed. ${response.statusText}`);
          new Error(response.statusText || 'Failed to upload document');
          return;
        }

        const result = await response.json();

        setKnowledgeDocumentRepositoryUrl(result.repoUrl);
        setKnowledgeDocumentCommit(result.commitSha);
        setDocumentName(result.documentNames.join(', ')); // Populate the patterns field
        console.log('Files uploaded:', result.documentNames);
        setSuccessAlertTitle('Document uploaded successfully!');
        setSuccessAlertMessage('Documents have been uploaded to your repo to be referenced in the knowledge submission.');
        setSuccessAlertLink(result.prUrl);
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

  return (
    <FormFieldGroupExpandable
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <p>
                Document Info <span style={{ color: 'red' }}>*</span>
              </p>
            ),
            id: 'doc-info-id'
          }}
          titleDescription="Add the relevant document's information"
        />
      }
    >
      <FormGroup>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant={useFileUpload ? 'primary' : 'secondary'}
            className={useFileUpload ? 'button-active' : 'button-secondary'}
            onClick={() => setUseFileUpload(true)}
          >
            Automatically Upload Documents
          </Button>
          <Button
            variant={useFileUpload ? 'secondary' : 'primary'}
            className={!useFileUpload ? 'button-active' : 'button-secondary'}
            onClick={() => setUseFileUpload(false)}
          >
            Manually Enter Document Details
          </Button>
        </div>
      </FormGroup>

      {!useFileUpload ? (
        <FormGroup key={'doc-info-details-id'}>
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
                  Repo URL is required.
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
                  Document name is required.
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>
      ) : (
        <>
          <UploadFile onFilesChange={handleFilesChange} />
          <Button variant="primary" onClick={handleDocumentUpload}>
            Submit Files
          </Button>
          <FormHelperText></FormHelperText>
        </>
      )}

      {successAlertTitle && successAlertMessage && successAlertLink && (
        <Alert
          variant="success"
          title={successAlertTitle}
          actionClose={<AlertActionCloseButton onClose={onCloseSuccessAlert} />}
          actionLinks={
            <>
              <AlertActionLink component="a" href={successAlertLink} target="_blank" rel="noopener noreferrer">
                View it here
              </AlertActionLink>
            </>
          }
        >
          {successAlertMessage}
        </Alert>
      )}

      {failureAlertTitle && failureAlertMessage && (
        <Alert variant="danger" title={failureAlertTitle} actionClose={<AlertActionCloseButton onClose={onCloseFailureAlert} />}>
          {failureAlertMessage}
        </Alert>
      )}
    </FormFieldGroupExpandable>
  );
};

export default DocumentInformation;
