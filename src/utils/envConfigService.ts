import { EnvConfigType } from '@/types';

export const fetchEnvConfig = async (): Promise<EnvConfigType> => {
  try {
    const res = await fetch('/api/envConfig');
    const envConfig = await res.json();

    return {
      graniteApi: envConfig.GRANITE_API,
      graniteModelName: envConfig.GRANITE_MODEL_NAME,
      merliniteApi: envConfig.MERLINITE_API,
      merliniteModelName: envConfig.MERLINITE_MODEL_NAME,
      upstreamRepoOwner: envConfig.UPSTREAM_REPO_OWNER,
      upstreamRepoName: envConfig.UPSTREAM_REPO_NAME,
      taxonomyRootDir: envConfig.TAXONOMY_ROOT_DIR,
      taxonomyKnowledgeDocumentRepo: envConfig.TAXONOMY_KNOWLEDGE_DOCUMENT_REPO,
      apiServer: envConfig.API_SERVER,
      isDevMode: envConfig.ENABLE_DEV_MODE === 'true'
    };
  } catch (error) {
    console.error(`Error fetching ENV config: `, error);
    return {
      graniteApi: '',
      graniteModelName: '',
      merliniteApi: '',
      merliniteModelName: '',
      upstreamRepoOwner: '',
      upstreamRepoName: '',
      taxonomyRootDir: '',
      taxonomyKnowledgeDocumentRepo: '',
      apiServer: '',
      isDevMode: false
    };
  }
};
