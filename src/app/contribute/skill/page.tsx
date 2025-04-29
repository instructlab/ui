// src/app/contribute/skill/page.tsx
'use client';
import { AppLayout } from '@/components/AppLayout';
import { SkillFormGithub } from '@/components/Contribute/Skill/Github/index';
import { SkillFormNative } from '@/components/Contribute/Skill/Native/index';
import { t_global_spacer_xl as XlSpacerSize } from '@patternfly/react-tokens';
import { Flex, Spinner } from '@patternfly/react-core';
import { useEffect, useState } from 'react';

const SkillFormPage: React.FunctionComponent = () => {
  const [deploymentType, setDeploymentType] = useState<string | undefined>();
  const [loaded, setLoaded] = useState<boolean>();

  useEffect(() => {
    let canceled = false;

    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      if (!canceled) {
        setDeploymentType(envConfig.DEPLOYMENT_TYPE);
        setLoaded(true);
      }
    };

    getEnvVariables();

    return () => {
      canceled = true;
    };
  }, []);
  return (
    <AppLayout className="contribute-page">
      {loaded ? (
        <>{deploymentType === 'native' ? <SkillFormNative /> : <SkillFormGithub />}</>
      ) : (
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: XlSpacerSize.var }}>
          <Spinner size="xl" />
        </Flex>
      )}
    </AppLayout>
  );
};

export default SkillFormPage;
