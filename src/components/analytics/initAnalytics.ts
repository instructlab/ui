'use client'

import { TrackingApi } from '@patternfly/chatbot/src/tracking/tracking_api';
import { getTrackingProviders } from '@patternfly/chatbot';

declare global {
  interface Window {
    analytics: TrackingApi;
  }
}

export const initAnalytics = () : TrackingApi => {
  console.log('initAnalytics');

  if (window.analytics) {
    return window.analytics;
  }

  let api: TrackingApi ;
  fetch('/api/analyticsConfig', {
    method: 'GET'
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      api = getTrackingProviders(data);
      window.analytics = api;
      return api;
    })
    .catch((error) => {
      console.error(error);
      api = getTrackingProviders({ console: true })
      window.analytics = api;
      return api;
    });

  // Should not be reached, but lint complains otherwise
  return getTrackingProviders({ console: true });
};
