// src/app/contribute/skill/page.tsx
'use client';
import React from 'react';
import { Flex, Spinner } from '@patternfly/react-core';
import { t_global_spacer_xl as XlSpacerSize } from '@patternfly/react-tokens/dist/esm/t_global_spacer_xl';
import { AppLayout } from '@/components/AppLayout';
import { useEnvConfig } from '@/context/EnvConfigContext';
import SkillWizard from '@/components/Contribute/Skill/SkillWizard/SkillWizard';

const SkillFormPage: React.FunctionComponent = () => {
  const {
    loaded,
    envConfig: { isGithubMode }
  } = useEnvConfig();

  return (
    <AppLayout className="contribute-page">
      {loaded ? (
        <SkillWizard isGithubMode={isGithubMode} />
      ) : (
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: XlSpacerSize.var }}>
          <Spinner size="xl" />
        </Flex>
      )}
    </AppLayout>
  );
};

export default SkillFormPage;
