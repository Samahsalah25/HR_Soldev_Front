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

// TEMPORARY STUB — base44 removed from this project.
// The app will boot again, but any code that actually calls
// base44.entities.X / base44.auth.X / etc. will throw a clear error
// at the moment it's used (not at page load), so you can migrate
// one page at a time instead of everything breaking at once.

function makeStubProxy(namespace) {
  return new Proxy({}, {
    get(_target, prop) {
      // Allow these to exist quietly without throwing, in case some
      // code just checks `if (base44.auth)` etc.
      if (typeof prop === 'symbol') return undefined;

      return (...args) => {
        throw new Error(
          `[base44 removed] "${namespace}.${String(prop)}" was called but base44 has been removed from this project. ` +
          `Replace this call with your own backend/API in this file.`
        );
      };
    }
  });
}

export const base44 = {
  entities: makeStubProxy('entities'),
  auth: makeStubProxy('auth'),
  functions: makeStubProxy('functions'),
  integrations: makeStubProxy('integrations'),
  asServiceRole: {
    entities: makeStubProxy('asServiceRole.entities'),
  },
};