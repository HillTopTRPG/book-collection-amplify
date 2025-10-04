import { a, type ClientSchema, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Collection : API Result = 1 : 1
  Collection: a
    .model({
      /** relation key */
      apiId: a.string().required(),
      status: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete'])
    ]),
  // FilterSet : API result = 1 : 1
  FilterSet: a
    .model({
      apiId: a.string().required(), // relation key
      name: a.string().required(),
      fetch: a.string().required(),
      filters: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete'])
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
