/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

export const explainerVideos: ExplainerVideo[] = [
  {
    title: 'EXPLAINER_VIDEO.SIGN_COLLECTION.TITLE',
    description: 'EXPLAINER_VIDEO.SIGN_COLLECTION.DESCRIPTION',
    ariaLabel: 'EXPLAINER_VIDEO.SIGN_COLLECTION.ARIA_LABEL',
    videoId: 'FA2dF7ZX1cfAkkrEe9ymXq',
    videoIdWithSignLanguage: 'DPnkEJZLGukHaGNepAntuR',
  },
  {
    title: 'EXPLAINER_VIDEO.SEEK_REFERENDUM.TITLE',
    description: 'EXPLAINER_VIDEO.SEEK_REFERENDUM.DESCRIPTION',
    ariaLabel: 'EXPLAINER_VIDEO.SEEK_REFERENDUM.ARIA_LABEL',
    videoId: '8j_873rJ35MD7A-S1W-EZv',
    videoIdWithSignLanguage: 'CLwHmWU-hAAZ_j8MEUtA_9',
  },
  {
    title: 'EXPLAINER_VIDEO.LAUNCH_INITIATIVE.TITLE',
    description: 'EXPLAINER_VIDEO.LAUNCH_INITIATIVE.DESCRIPTION',
    ariaLabel: 'EXPLAINER_VIDEO.LAUNCH_INITIATIVE.ARIA_LABEL',
    videoId: '9azyMdxRTP5EUyCmfwUTxm',
    videoIdWithSignLanguage: 'AFhFaw5qW7r-iwqFzxuFiL',
  },
];

export interface ExplainerVideo {
  title: string;
  description: string;
  ariaLabel: string;
  videoId: string;
  videoIdWithSignLanguage: string;
}
