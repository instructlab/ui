import React from 'react';
import { Content, Popover, Button } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import {
  t_global_spacer_sm as SmallSpacerSize,
  t_global_font_size_xs as XsFontSize,
  t_global_icon_color_subtle as SubtleIconColor
} from '@patternfly/react-tokens';

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
            <Button isInline variant="link" aria-label="more info">
              <OutlinedQuestionCircleIcon style={{ fontSize: XsFontSize.var, color: SubtleIconColor.var }} />
            </Button>
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
