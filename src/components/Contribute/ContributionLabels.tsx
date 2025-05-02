import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { CatalogIcon } from '@patternfly/react-icons';

import './ContributionLabels.scss';

const KnowledgeContributionLabel: React.FC = () => (
  <Label className="knowledge-contribution-label" icon={<CatalogIcon />} variant="outline">
    Knowledge
  </Label>
);

import { TaskIcon } from '@patternfly/react-icons';

const SkillContributionLabel: React.FC = () => (
  <Label className="skill-contribution-label" icon={<TaskIcon />} variant="outline">
    Skills
  </Label>
);

const NewContributionLabel: React.FC = () => (
  <Label className="new-contribution-label" isCompact>
    NEW
  </Label>
);

export { KnowledgeContributionLabel, SkillContributionLabel, NewContributionLabel };
