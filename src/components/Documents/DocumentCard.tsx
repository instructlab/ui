// src/components/Documents/DocumentCard.tsx
import * as React from 'react';
import {
  Card,
  CardBody,
  Flex,
  FlexItem,
  CardHeader,
  CardTitle,
  Button,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  GalleryItem
} from '@patternfly/react-core';
import { KnowledgeFile } from '@/types';
import TruncatedText from '@/components/Common/TruncatedText';
import TableRowTitleDescription from '@/components/Table/TableRowTitleDescription';
import { getFormattedLastUpdatedDate } from '@/components/Documents/const';
import DocumentActions from '@/components/Documents/DocumentActions';
import MarkdownFileViewer from '@/components/Documents/MarkdownFileViewer';

interface Props {
  document: KnowledgeFile;
  onRemove: () => void;
}

const DocumentCard: React.FC<Props> = ({ document, onRemove }) => {
  const [showDocumentViewer, setShowDocumentViewer] = React.useState<boolean>(false);

  return (
    <GalleryItem key={document.filename}>
      <Card className="document-card">
        <CardHeader
          actions={{
            actions: <DocumentActions document={document} onRemove={onRemove} />
          }}
        >
          <CardTitle>
            <TableRowTitleDescription
              title={
                <Button component="a" variant="link" isInline onClick={() => setShowDocumentViewer(true)}>
                  <TruncatedText maxLines={2} content={document.filename} />
                </Button>
              }
            />
          </CardTitle>
        </CardHeader>
        <CardBody>
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Last updated</DescriptionListTerm>
                  <DescriptionListDescription>
                    {getFormattedLastUpdatedDate(new Date(document.commitDate ? Date.parse(document.commitDate) : Date.now()))}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </FlexItem>
          </Flex>
        </CardBody>
      </Card>
      {showDocumentViewer ? <MarkdownFileViewer markdownFile={document} handleCloseModal={() => setShowDocumentViewer(false)} /> : null}
    </GalleryItem>
  );
};

export default DocumentCard;
