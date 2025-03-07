import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { t_global_font_size_xs as XsFontSize, t_global_icon_color_subtle as SubtleIconColor } from '@patternfly/react-tokens';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';

interface Props {
  headerContent?: React.ReactNode;
  bodyContent: React.ReactNode;
  ariaLabel?: string;
}

const WizardFormGroupLabelHelp: React.FC<Props> = ({ headerContent, bodyContent, ariaLabel = 'More info' }) => {
  const labelHelpRef = React.useRef(null);

  return (
    <Popover triggerRef={labelHelpRef} headerContent={headerContent} bodyContent={bodyContent}>
      <Button ref={labelHelpRef} isInline variant="link" aria-label={ariaLabel}>
        <OutlinedQuestionCircleIcon style={{ fontSize: XsFontSize.var, color: SubtleIconColor.var }} />
      </Button>
    </Popover>
  );
};

export default WizardFormGroupLabelHelp;
