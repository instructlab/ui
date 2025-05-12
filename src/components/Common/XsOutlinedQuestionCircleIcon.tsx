import * as React from 'react';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { t_global_font_size_xs as FontSizeXs } from '@patternfly/react-tokens';
import { t_global_icon_color_subtle as SubtleIconColor } from '@patternfly/react-tokens';

const XsOutlinedQuestionCircleIcon: React.FC = () => (
  <OutlinedQuestionCircleIcon style={{ width: FontSizeXs.var, height: FontSizeXs.var, color: SubtleIconColor.var }} />
);

export default XsOutlinedQuestionCircleIcon;
