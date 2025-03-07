// src/components/Contribute/Knowledge/Native/DocumentInformation/DocumentInformation.tsx
import React from 'react';
import { Alert, AlertActionLink, AlertActionCloseButton, AlertGroup, Button, Flex, FlexItem, Form, FormGroup } from '@patternfly/react-core';
import { UploadFile } from '@/components/Contribute/Knowledge/UploadFile';
import WizardPageHeader from '@/components/Common/WizardPageHeader';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';

const GITHUB_KNOWLEDGE_FILES_URL = '/api/github/knowledge-files';
const NATIVE_GIT_KNOWLEDGE_FILES_URL = '/api/native/git/knowledge-files';

interface Props {
  isGithubMode: boolean;
  setKnowledgeDocumentRepositoryUrl: (val: string) => void;
  setKnowledgeDocumentCommit: (val: string) => void;
  setDocumentName: (val: string) => void;
  filesToUpload: File[];
  setFilesToUpload: (val: File[]) => void;
}

interface AlertInfo {
  type: 'success' | 'danger' | 'info';
  title: string;
  message: string;
  link?: string;
}

const DocumentInformation: React.FC<Props> = ({
  isGithubMode,
  setKnowledgeDocumentRepositoryUrl,
  setKnowledgeDocumentCommit,
  setDocumentName,
  filesToUpload,
  setFilesToUpload
}) => {
  const [alertInfo, setAlertInfo] = React.useState<AlertInfo | undefined>();

  const updateAlertInfo = (newInfo: AlertInfo) => {
    // In order to restart the timer, we must re-create the Alert not re-use it. Clear it for one round then set the new info
    setAlertInfo(undefined);
    requestAnimationFrame(() => setAlertInfo(newInfo));
  };

  const handleDocumentUpload = async () => {
    if (filesToUpload.length > 0) {
      const alertInfo: AlertInfo = {
        type: 'info',
        title: 'Document upload(s) in progress!',
        message: 'Document upload(s) is in progress. You will be notified once the upload successfully completes.'
      };
      updateAlertInfo(alertInfo);

      const fileContents: { fileName: string; fileContent: string }[] = [];

      await Promise.all(
        filesToUpload.map(
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

      if (fileContents.length === filesToUpload.length) {
        try {
          const response = await fetch(isGithubMode ? GITHUB_KNOWLEDGE_FILES_URL : NATIVE_GIT_KNOWLEDGE_FILES_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: fileContents })
          });

          if (response.status === 201 || response.ok) {
            const result = await response.json();
            setKnowledgeDocumentRepositoryUrl(result.repoUrl);
            setKnowledgeDocumentCommit(result.commitSha);
            setDocumentName(result.documentNames.join(', ')); // Populate the patterns
            setFilesToUpload([]);

            const alertInfo: AlertInfo = {
              type: 'success',
              title: 'Document uploaded successfully!',
              message: 'Documents have been submitted to local taxonomy knowledge docs repo to be referenced in the knowledge submission.'
            };
            if (result.prUrl !== '') {
              alertInfo.link = result.prUrl;
            }
            updateAlertInfo(alertInfo);
          } else {
            console.error('Knowledge document upload failed:', response.statusText);
            const alertInfo: AlertInfo = {
              type: 'danger',
              title: 'Failed to upload document!',
              message: `This upload failed. ${response.statusText}`
            };
            updateAlertInfo(alertInfo);
          }
        } catch (error) {
          console.error('Knowledge document upload encountered an error:', error);
          const alertInfo: AlertInfo = {
            type: 'danger',
            title: 'Failed to upload document!',
            message: `This upload failed. ${(error as Error).message}`
          };
          updateAlertInfo(alertInfo);
        }
      }
    }
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <WizardPageHeader
          title="Upload documents"
          description={
            <>
              Resources such as, textbooks, technical manuals, encyclopedias, journals, or websites, are used as the knowledge source for training
              your model.{' '}
              <Button
                variant="link"
                isInline
                href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples"
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkAltIcon />}
                iconPosition="end"
              >
                Learn about accepted sources
              </Button>
            </>
          }
        />
      </FlexItem>
      <FlexItem>
        <UploadFile filesToUpload={filesToUpload} setFilesToUpload={setFilesToUpload} />
      </FlexItem>
      <FlexItem>
        <Button variant="primary" onClick={handleDocumentUpload} isDisabled={filesToUpload.length === 0}>
          Submit Files
        </Button>
      </FlexItem>
      <AlertGroup isToast isLiveRegion>
        {alertInfo ? (
          <Alert
            timeout
            variant={alertInfo.type}
            title={alertInfo.title}
            actionClose={<AlertActionCloseButton onClose={() => setAlertInfo(undefined)} />}
            actionLinks={
              alertInfo.link && (
                <AlertActionLink component="a" href={alertInfo.link} target="_blank" rel="noopener noreferrer">
                  View it here
                </AlertActionLink>
              )
            }
            onTimeout={() => setAlertInfo(undefined)}
          >
            {alertInfo.message}
          </Alert>
        ) : null}
      </AlertGroup>
    </Flex>
  );
};

export default DocumentInformation;
