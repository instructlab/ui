import React from 'react';
import { Button } from '@patternfly/react-core';
import { Tr, Td } from '@patternfly/react-table';
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

const DocumentTableRow: React.FC<Props> = ({ document, onRemove }) => {
  const [showDocumentViewer, setShowDocumentViewer] = React.useState<boolean>(false);

  return (
    <Tr>
      <Td modifier="truncate" dataLabel="File name">
        <TableRowTitleDescription
          title={
            <Button variant="link" isInline onClick={() => setShowDocumentViewer(true)}>
              <TruncatedText maxLines={2} content={document.filename} />
            </Button>
          }
        />
      </Td>
      <Td dataLabel="Last updated">{getFormattedLastUpdatedDate(new Date(document.commitDate ? Date.parse(document.commitDate) : Date.now()))}</Td>
      <Td isActionCell>
        <DocumentActions document={document} onRemove={onRemove} />
      </Td>
      {showDocumentViewer ? <MarkdownFileViewer markdownFile={document} handleCloseModal={() => setShowDocumentViewer(false)} /> : null}
    </Tr>
  );
};

export default DocumentTableRow;
