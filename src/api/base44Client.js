// import { createClient } from '@base44/sdk';
// import { appParams } from '@/lib/app-params';

// const { appId, token, functionsVersion, appBaseUrl } = appParams;

// //Create a client with authentication required
// export const base44 = createClient({
//   appId,
//   token,
//   functionsVersion,
//   serverUrl: '',
//   requiresAuth: false,
//   appBaseUrl
// });

import { createClient } from '@base44/sdk';

export const base44 = createClient({
  appId: "69f7177c4ad8b8c70dc86a2e",
  headers: {
    api_key: "1d7abbde0c2b49828c6b8cd6519514d2"
  }
});