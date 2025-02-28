import * as React from 'react';
import { Content } from '@patternfly/react-core';

interface Props {
  title: React.ReactNode;
  description: React.ReactNode;
}

const PageHeader: React.FC<Props> = ({ title, description }) => (
  <div>
    <Content component="h4">{title}</Content>
    <Content component="p">{description}</Content>
  </div>
);

export default PageHeader;
