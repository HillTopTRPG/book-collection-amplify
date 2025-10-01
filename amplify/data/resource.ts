import {a, type ClientSchema, defineData} from '@aws-amplify/backend'

const schema = a.schema({
  Collection: a
    .model({
      isbn: a.string().required(),
      status: a.string().required(),
    })
    .authorization((allow) => [allow.owner()]),
  FilterSet: a
    .model({
      name: a.string().required(),
      fetch: a.string().required(),
      filters: a.string().required(),
      collectionId: a.string().required(),
    })
    .authorization((allow) => [allow.owner()]),
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
