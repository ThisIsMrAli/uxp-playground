/** Partial JSON schema for UXP manifest v5, written from Adobe's manifest docs. Used for editor hints only. */
const size = { type: 'object', properties: { width: { type: 'number' }, height: { type: 'number' } }, required: ['width', 'height'] };
const label = { oneOf: [{ type: 'string' }, { type: 'object', properties: { default: { type: 'string' } }, required: ['default'] }] };
const host = {
  type: 'object',
  properties: {
    app: { enum: ['PS', 'ID', 'premierepro', 'ame'], description: 'Host application' },
    minVersion: { type: 'string', pattern: '^\\d+(\\.\\d+){0,2}$' },
    maxVersion: { type: 'string' },
    data: { type: 'object' }
  },
  required: ['app']
};
export const manifestSchema = {
  type: 'object',
  properties: {
    manifestVersion: { enum: [4, 5], description: 'Use 5 for the v5 permission model' },
    id: { type: 'string' },
    name: { type: 'string' },
    version: { type: 'string', pattern: '^\\d+(\\.\\d+){0,2}$' },
    main: { type: 'string' },
    host: { oneOf: [host, { type: 'array', items: host }] },
    entrypoints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { enum: ['panel', 'command'] },
          id: { type: 'string' },
          label,
          minimumSize: size,
          maximumSize: size,
          preferredDockedSize: size,
          preferredFloatingSize: size,
          icons: { type: 'array' }
        },
        required: ['type', 'id']
      }
    },
    icons: { type: 'array' },
    requiredPermissions: {
      type: 'object',
      properties: {
        network: { type: 'object', properties: { domains: { oneOf: [{ const: 'all' }, { type: 'array', items: { type: 'string' } }] } } },
        clipboard: { enum: ['read', 'readAndWrite'] },
        localFileSystem: { enum: ['request', 'plugin', 'fullAccess'] },
        launchProcess: { type: 'object', properties: { schemes: { type: 'array', items: { type: 'string' } }, extensions: { type: 'array', items: { type: 'string' } } } },
        ipc: { type: 'object', properties: { enablePluginCommunication: { type: 'boolean' } } },
        webview: { type: 'object', properties: { allow: { enum: ['yes'] }, domains: { oneOf: [{ const: 'all' }, { type: 'array', items: { type: 'string' } }] } } },
        allowCodeGenerationFromStrings: { type: 'boolean' },
        enableUserInfo: { type: 'boolean' }
      }
    }
  },
  required: ['manifestVersion', 'id', 'name', 'version', 'host', 'entrypoints']
};
