import { FeatureFlagsType } from '@/types';

export const fetchFeatureFlags = async (): Promise<FeatureFlagsType> => {
  try {
    const res = await fetch('/api/envConfig');
    const envConfig = await res.json();
    return {
      docConversionEnabled: envConfig.ENABLE_DOC_CONVERSION === 'true',
      skillFeaturesEnabled: envConfig.ENABLE_SKILLS_FEATURES === 'true',
      playgroundFeaturesEnabled: envConfig.ENABLE_PLAYGROUND_FEATURES === 'true',
      experimentalFeaturesEnabled: envConfig.EXPERIMENTAL_FEATURES === 'true'
    };
  } catch (error) {
    console.error(`Error fetching ENV config: `, error);
    return {
      docConversionEnabled: false,
      skillFeaturesEnabled: false,
      playgroundFeaturesEnabled: false,
      experimentalFeaturesEnabled: false
    };
  }
};
