import React from 'react';
import { Content, Popover, Button } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { t_global_spacer_sm as SmallSpacerSize } from '@patternfly/react-tokens';

interface Props {
  title: string;
  description?: string;
  helpInfo?: React.ReactNode;
}
const WizardSectionHeader: React.FC<Props> = ({ title, description, helpInfo }) => (
  <>
    <Content>
      {title}
      {helpInfo ? (
        <>
          {' '}
          <Popover bodyContent={helpInfo}>
            <Button isInline variant="link" aria-label="more info" icon={<OutlinedQuestionCircleIcon />} />
          </Popover>
        </>
      ) : null}
    </Content>
    {description ? (
      <Content component="small" style={{ marginTop: SmallSpacerSize.var }}>
        {description}
      </Content>
    ) : null}
  </>
);

export default WizardSectionHeader;
