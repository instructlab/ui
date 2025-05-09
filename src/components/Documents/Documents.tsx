// src/components/Documents/Documents.tsx
import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AlertProps,
  PageSection,
  Title,
  Content,
  Button,
  AlertGroup,
  Alert,
  AlertVariant,
  AlertActionCloseButton,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import XsExternalLinkAltIcon from '@/components/Common/XsExternalLinkAltIcon';
import DocumentUploadArea from '@/components/Documents/DocumentUploadArea';
import MyDocuments from '@/components/Documents/MyDocuments';
import { KnowledgeFile } from '@/types';

export interface AlertItem {
  title: string;
  variant: AlertProps['variant'];
  key: React.Key;
}

const helpLinkUrl = `https://docs.instructlab.ai/user-interface/ui_overview`;

const Documents: React.FC = () => {
  const [documents, setDocuments] = React.useState<KnowledgeFile[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);

  const fetchDocuments = React.useCallback(async () => {
    // TODO: Fetch documents...
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

  const addAlert = React.useCallback((title: string, variant: AlertProps['variant']) => {
    const alertKey = uuidv4();
    const newAlert: AlertItem = { title, variant, key: alertKey };
    setAlerts((prevAlerts) => [...prevAlerts, newAlert]);
  }, []);

  const removeAlert = (alertToRemove: AlertItem) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.key !== alertToRemove.key));
  };

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
            <Content component="p">
              Resources such as, textbooks, technical manuals, encyclopedias, journals, or websites, are used as the knowledge source for training
              your model.
            </Content>
            <Button
              variant="link"
              isInline
              component="a"
              href={helpLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              icon={<XsExternalLinkAltIcon />}
              iconPosition="end"
            >
              Learn about best practices related to documents.
            </Button>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }} style={{ overflowY: 'hidden' }}>
            <DocumentUploadArea existingFiles={documents} onUploaded={addDocuments} addAlert={addAlert} />
          </FlexItem>
        </Flex>
      </PageSection>
      <MyDocuments documents={documents} isLoading={isLoading} removeDocument={handleRemove} />
      <AlertGroup isToast isLiveRegion>
        {alerts.map((alert) => (
          <Alert
            variant={alert.variant ? AlertVariant[alert.variant] : undefined}
            title={alert.title}
            timeout={true}
            actionClose={<AlertActionCloseButton title={alert.title} onClose={() => removeAlert(alert)} />}
            key={alert.key}
          />
        ))}
      </AlertGroup>
    </>
  );
};

export default Documents;
