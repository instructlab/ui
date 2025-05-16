// src/components/Documents/Documents.tsx
import * as React from 'react';
import { PageSection, Title, Flex, FlexItem } from '@patternfly/react-core';
import { KnowledgeFile } from '@/types';
import { useAlerts } from '@/context/AlertContext';
import DocumentsSidePanelHelp from '@/components/SidePanelContents/DocumentsSidePanelHelp';
import DocumentUploadArea from '@/components/Documents/DocumentUploadArea';
import MyDocuments from '@/components/Documents/MyDocuments';
import PageDescriptionWithHelp from '@/components/Common/PageDescriptionWithHelp';

const Documents: React.FC = () => {
  const { addAlert } = useAlerts();
  const [documents, setDocuments] = React.useState<KnowledgeFile[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const fetchDocuments = React.useCallback(async () => {
    try {
      const response = await fetch('/api/documents/list', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      setDocuments(result.files);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const addDocuments = React.useCallback(
    async (newDocuments: KnowledgeFile[]) => {
      try {
        const newFiles: { fileName: string; fileContent?: string }[] = newDocuments.map((doc) => ({
          fileName: doc.filename,
          fileContent: doc.content
        }));

        const response = await fetch('/api/documents/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newFiles })
        });
        if (response.ok) {
          await fetchDocuments();
        } else {
          const errorText = await response.text();
          addAlert(`Unable to add document${newDocuments.length !== 1 ? 's' : ` '${newDocuments[0].filename}'`}. ${errorText}`, 'danger');
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        addAlert(`Unable to add document${newDocuments.length !== 1 ? 's' : ''}. ${(error as Error).message || 'Unknown error.'}`, 'danger');
      }
    },
    [addAlert, fetchDocuments]
  );

  const handleRemove = React.useCallback(
    async (document: KnowledgeFile) => {
      try {
        const response = await fetch('/api/documents/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: document.filename })
        });
        if (response.ok) {
          await fetchDocuments();
        } else {
          const errorText = await response.text();
          addAlert(`Unable to remove document ${document.filename}. ${errorText}`, 'danger');
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        addAlert(`Unable to remove document '${document.filename}'. ${(error as Error).message || 'Unknown error.'}`, 'danger');
      }
    },
    [addAlert, fetchDocuments]
  );

  return (
    <>
      <PageSection>
        <Flex
          direction={{ default: 'column' }}
          gap={{ default: 'gapLg' }}
          flexWrap={{ default: 'nowrap' }}
          style={{ height: '100%', overflowY: 'hidden' }}
        >
          <FlexItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} gap={{ default: 'gapLg' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  Documents
                </Title>
              </FlexItem>
              {/* TODO: any actions available at the top level? */}
            </Flex>
          </FlexItem>
          <FlexItem>
            <PageDescriptionWithHelp
              description="Resources such as, textbooks, technical manuals, encyclopedias, journals, or websites, are used as the knowledge source for training
              your model."
              helpText="Learn how to add documents to knowledge contributions"
              sidePanelContent={<DocumentsSidePanelHelp />}
            />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }} style={{ overflowY: 'hidden' }}>
            <DocumentUploadArea existingFiles={documents} onUploaded={addDocuments} />
          </FlexItem>
        </Flex>
      </PageSection>
      <MyDocuments documents={documents} isLoading={isLoading} removeDocument={handleRemove} />
    </>
  );
};

export default Documents;
