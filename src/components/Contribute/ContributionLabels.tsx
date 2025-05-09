import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { CatalogIcon, PficonTemplateIcon, TaskIcon } from '@patternfly/react-icons';

import './ContributionLabels.scss';

interface LabelProps {
  isCompact?: boolean;
}

const KnowledgeContributionLabel: React.FC<LabelProps> = ({ isCompact }) => (
  <Label className="knowledge-contribution-label" icon={<CatalogIcon />} variant="outline" isCompact={isCompact}>
    Knowledge
  </Label>
);

const SkillContributionLabel: React.FC<LabelProps> = ({ isCompact }) => (
  <Label className="skill-contribution-label" icon={<TaskIcon />} variant="outline" isCompact={isCompact}>
    Skill
  </Label>
);

const DraftContributionLabel: React.FC<LabelProps> = ({ isCompact }) => (
  <Label key="draft" variant="outline" icon={<PficonTemplateIcon />} isCompact={isCompact}>
    Draft
  </Label>
);

const NewContributionLabel: React.FC<LabelProps> = ({ isCompact = true }) => (
  <Label className="new-contribution-label" isCompact={isCompact}>
    NEW
  </Label>
);

export { KnowledgeContributionLabel, SkillContributionLabel, NewContributionLabel, DraftContributionLabel };
