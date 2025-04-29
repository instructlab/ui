// src/app/contribute/skill/page.tsx
'use client';
import React from 'react';
import { Flex, Spinner } from '@patternfly/react-core';
import { t_global_spacer_xl as XlSpacerSize } from '@patternfly/react-tokens/dist/esm/t_global_spacer_xl';
import { AppLayout } from '@/components/AppLayout';
import { SkillFormGithub } from '@/components/Contribute/Skill/Github/index';
import { SkillFormNative } from '@/components/Contribute/Skill/Native/index';
import { useEnvConfig } from '@/context/EnvConfigContext';

const SkillFormPage: React.FunctionComponent = () => {
  const {
    loaded,
    envConfig: { isGithubMode }
  } = useEnvConfig();

  return (
    <AppLayout className="contribute-page">
      {loaded ? (
        !isGithubMode ? (
          <SkillFormNative />
        ) : (
          <SkillFormGithub />
        )
      ) : (
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: XlSpacerSize.var }}>
          <Spinner size="xl" />
        </Flex>
      )}
    </AppLayout>
  );
};

export default SkillFormPage;
