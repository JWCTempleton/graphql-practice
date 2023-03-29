const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

let persons = [
  {
    name: "Jacob Templeton",
    phone: "925-555-5555",
    street: "123 Fake St",
    city: "Concord",
    id: "3d594650-3436-11e9-bc57-8b80ba54c431",
  },
  {
    name: "Jamie Baldwin",
    phone: "925-444-4444",
    street: "123 New St",
    city: "Moraga",
    id: "3d599470-3436-11e9-bc57-8b80ba54c431",
  },
  {
    name: "Eugene Duke",
    phone: "925-333-3333",
    street: "123 Main St",
    city: "Vallejo",
    id: "3d599471-3436-11e9-bc57-8b80ba54c431",
  },
];

const typeDefs = `
  type Person {
    name: String!
    phone: String
    street: String!
    city: String! 
    id: ID!
  }

  type Query {
    personCount: Int!
    allPersons: [Person!]!
    findPerson(name: String!): Person
  }
`;

//resolvers correspond to the queries described in the schema
//there is a field under Query for every query described in the schema
const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: () => persons,
    findPerson: (root, args) => persons.find((p) => p.name === args.name),
  },
};

//typeDefs contains the GraphQL schema
//resolvers define how GraphQL queries are responded to
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
