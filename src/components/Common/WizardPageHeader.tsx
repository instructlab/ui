import * as React from 'react';
import { Content } from '@patternfly/react-core';

interface Props {
  title: React.ReactNode;
  description?: React.ReactNode;
}

const WizardPageHeader: React.FC<Props> = ({ title, description }) => (
  <div>
    <Content component="h3">{title}</Content>
    <Content component="p">{description}</Content>
  </div>
);

export default WizardPageHeader;
