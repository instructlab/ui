// src/components/Contribute/Knowledge/Native/DocumentInformation/DocumentInformation.tsx
import React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { UploadFile } from '@/components/Contribute/Knowledge/UploadFile';
import WizardPageHeader from '@/components/Common/WizardPageHeader';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { ActionGroupAlertContent } from '@/components/Contribute/types';

const GITHUB_KNOWLEDGE_FILES_URL = '/api/github/knowledge-files';
const NATIVE_GIT_KNOWLEDGE_FILES_URL = '/api/native/git/knowledge-files';

interface Props {
  isGithubMode: boolean;
  setKnowledgeDocumentRepositoryUrl: (val: string) => void;
  setKnowledgeDocumentCommit: (val: string) => void;
  setDocumentName: (val: string) => void;
  filesToUpload: File[];
  setFilesToUpload: (val: File[]) => void;
  setActionGroupAlertContent: (alertContent: ActionGroupAlertContent | undefined) => void;
}

const DocumentInformation: React.FC<Props> = ({
  isGithubMode,
  setKnowledgeDocumentRepositoryUrl,
  setKnowledgeDocumentCommit,
  setDocumentName,
  filesToUpload,
  setFilesToUpload,
  setActionGroupAlertContent
}) => {
  const handleDocumentUpload = async () => {
    if (filesToUpload.length > 0) {
      const alertInfo: ActionGroupAlertContent = {
        title: 'Document upload(s) in progress!',
        message: 'Document upload(s) is in progress. You will be notified once the upload successfully completes.',
        waitAlert: true,
        success: true,
        timeout: true
      };
      setActionGroupAlertContent(alertInfo);

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

            const alertInfo: ActionGroupAlertContent = {
              success: true,
              title: 'Document uploaded successfully!',
              message: 'Documents have been submitted to local taxonomy knowledge docs repo to be referenced in the knowledge submission.',
              url: result.prUrl,
              isUrlExternal: true,
              urlText: 'View it here',
              timeout: true
            };
            setActionGroupAlertContent(alertInfo);
          } else {
            console.error('Knowledge document upload failed:', response.statusText);
            const alertInfo: ActionGroupAlertContent = {
              success: false,
              title: 'Failed to upload document!',
              message: `This upload failed. ${response.statusText}`,
              timeout: true
            };
            setActionGroupAlertContent(alertInfo);
          }
        } catch (error) {
          console.error('Knowledge document upload encountered an error:', error);
          const alertInfo: ActionGroupAlertContent = {
            success: false,
            title: 'Failed to upload document!',
            message: `This upload failed. ${(error as Error).message}`,
            timeout: true
          };
          setActionGroupAlertContent(alertInfo);
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
    </Flex>
  );
};

export default DocumentInformation;
