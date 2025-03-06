import * as React from 'react';
import { FormGroupLabelHelp, Popover } from '@patternfly/react-core';

interface Props {
  headerContent?: React.ReactNode;
  bodyContent: React.ReactNode;
  ariaLabel?: string;
}

const WizardFormGroupLabelHelp: React.FC<Props> = ({ headerContent, bodyContent, ariaLabel = 'More info' }) => {
  const labelHelpRef = React.useRef(null);

  return (
    <Popover triggerRef={labelHelpRef} headerContent={headerContent} bodyContent={bodyContent}>
      <FormGroupLabelHelp ref={labelHelpRef} aria-label={ariaLabel} />
    </Popover>
  );
};

export default WizardFormGroupLabelHelp;
