import * as React from 'react';
import { Truncate } from '@patternfly/react-core';
import TruncatedText from '@/components/Common/TruncatedText';

type TableRowTitleDescriptionProps = {
  title: React.ReactNode;
  description?: string;
  truncateDescriptionLines?: number;
};

const TableRowTitleDescription: React.FC<TableRowTitleDescriptionProps> = ({ title, description, truncateDescriptionLines }) => {
  const descriptionNode = description ? (
    <span data-testid="table-row-title-description" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
      {truncateDescriptionLines !== undefined ? (
        <TruncatedText maxLines={truncateDescriptionLines} content={description} />
      ) : (
        <Truncate content={description} />
      )}
    </span>
  ) : null;

  return (
    <div>
      <div>{title}</div>
      {descriptionNode}
    </div>
  );
};

export default TableRowTitleDescription;
