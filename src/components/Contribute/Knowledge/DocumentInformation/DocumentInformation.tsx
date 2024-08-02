import React, { useState } from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup, FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { UploadFile } from './../UploadFile';
import { Alert, AlertActionLink, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';

interface Props {
  knowledgeDocumentRepositoryUrl: string | undefined;
  setKnowledgeDocumentRepositoryUrl: React.Dispatch<React.SetStateAction<string | undefined>>;
  knowledgeDocumentCommit: string | undefined;
  setKnowledgeDocumentCommit: React.Dispatch<React.SetStateAction<string | undefined>>;
  documentName: string | undefined;
  setDocumentName: React.Dispatch<React.SetStateAction<string | undefined>>;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const DocumentInformation: React.FC<Props> = ({
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
        <FormFieldGroupHeader titleText={{ text: 'Document Info', id: 'doc-info-id' }} titleDescription="Add the relevant document's information" />
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
            placeholder="Enter repo url where document exists"
            value={knowledgeDocumentRepositoryUrl}
            onChange={(_event, value) => setKnowledgeDocumentRepositoryUrl(value)}
          />
          <TextInput
            isRequired
            type="text"
            aria-label="commit"
            placeholder="Enter the commit sha of the document in that repo"
            value={knowledgeDocumentCommit}
            onChange={(_event, value) => setKnowledgeDocumentCommit(value)}
          />
          <TextInput
            isRequired
            type="text"
            aria-label="patterns"
            placeholder="Enter the documents name (comma separated)"
            value={documentName}
            onChange={(_event, value) => setDocumentName(value)}
          />
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
