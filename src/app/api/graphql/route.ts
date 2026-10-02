import { createSchema, createYoga } from 'graphql-yoga';
import { typeDefs } from '@/lib/graphql/typeDefs';
import { resolvers } from '@/lib/graphql/resolvers';
import { createContext } from '@/lib/graphql/context';

const schema = createSchema({
  typeDefs,
  resolvers,
});

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  // C-4: Disable introspection and GraphiQL in production to prevent schema discovery
  maskedErrors: process.env.NODE_ENV === 'production',
  graphiql: process.env.NODE_ENV !== 'production',
  context: async ({ request }) => {
    return createContext(request);
  },
});

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };
