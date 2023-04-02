const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { GraphQLError } = require("graphql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const Person = require("./models/person");
const User = require("./models/user");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log("connecting to", MONGODB_URI);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connection to MongoDB:", error.message);
  });

// let persons = [
//   {
//     name: "Jacob Templeton",
//     phone: "925-555-5555",
//     street: "123 Fake St",
//     city: "Concord",
//     id: "3d594650-3436-11e9-bc57-8b80ba54c431",
//   },
//   {
//     name: "Jamie Baldwin",
//     phone: "925-444-4444",
//     street: "123 New St",
//     city: "Moraga",
//     id: "3d599470-3436-11e9-bc57-8b80ba54c431",
//   },
//   {
//     name: "Eugene Duke",
//     phone: "925-333-3333",
//     street: "123 Main St",
//     city: "Vallejo",
//     id: "3d599471-3436-11e9-bc57-8b80ba54c431",
//   },
// ];

const typeDefs = `

  type Address {  
    street: String!  
    city: String! 
}

  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  type User {
    username: String!
    password: String!
    friends: [Person!]!
    id: ID!
  }

  type Token {
    value: String!
  }

  enum YesNo {  
    YES  
    NO
}

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person!]!    
    findPerson(name: String!): Person
    me: User
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(    
        name: String!    
        phone: String!  
        ): Person
    createUser(
        username: String!
        password: String!
        ): User
    login(
        username: String!
        password: String!
        ): Token
  }
`;

//resolvers correspond to the queries described in the schema
//there is a field under Query for every query described in the schema
// const resolvers = {
//   //   Query: {
//   //     personCount: () => persons.length,
//   //     allPersons: (root, args) => {
//   //       if (!args.phone) {
//   //         return persons;
//   //       }
//   //       const byPhone = (person) =>
//   //         args.phone === "YES" ? person.phone : !person.phone;
//   //       return persons.filter(byPhone);
//   //     },
//   //     findPerson: (root, args) => persons.find((p) => p.name === args.name),
//   //   },
//   Query: {
//     personCount: async () => Person.collection.countDocuments(),
//     allPersons: async (root, args) => {
//       if (!args.phone) {
//         return Person.find({});
//       }

//       return Person.find({ phone: { $exists: args.phone === "YES" } });
//     },
//     findPerson: async (root, args) => Person.findOne({ name: args.name }),
//   },

//   //objects saved in the array do not have an address field,
//   //the default resolver is not sufficient.
//   //add a resolver for the address field of Person type
//   Person: {
//     address: ({ street, city }) => {
//       return {
//         street,
//         city,
//       };
//     },
//   },
//   //mutation adds the object given to it as a parameter args
//   //to the array persons, and returns the object it added to the array
//   Mutation: {
//     // addPerson: (root, args) => {
//     //   if (persons.find((p) => p.name === args.name)) {
//     //     throw new GraphQLError("Name must be unique", {
//     //       extensions: {
//     //         code: "BAD_USER_INPUT",
//     //         invalidArgs: args.name,
//     //       },
//     //     });
//     addPerson: async (root, args) => {
//       const person = new Person({ ...args });
//       try {
//         await person.save();
//       } catch (error) {
//         throw new GraphQLError("Saving user failed", {
//           extensions: {
//             code: "BAD_USER_INPUT",
//             invalidArgs: args.name,
//             error,
//           },
//         });
//       }

//       return person;
//     },

//     //   const person = { ...args, id: uuid() };
//     //   persons = persons.concat(person);
//     //   return person;
//     // },
//     // editNumber: (root, args) => {
//     //   const person = persons.find((p) => p.name === args.name);
//     //   if (!person) {
//     //     return null;
//     //   }
//     editNumber: async (root, args) => {
//       const person = await Person.findOne({ name: args.name });
//       person.phone = args.phone;
//       try {
//         await person.save();
//       } catch (error) {
//         throw new GraphQLError("Editing number failed", {
//           extensions: {
//             code: "BAD_USER_INPUT",
//             invalidArgs: args.name,
//             error,
//           },
//         });
//       }

//       return person;
//     },
//   },

//   //   const updatedPerson = { ...person, phone: args.phone };
//   //   persons = persons.map((p) => (p.name === args.name ? updatedPerson : p));
//   //   return updatedPerson;
// };
const resolvers = {
  Query: {
    personCount: async () => Person.collection.countDocuments(),
    allPersons: async (root, args) => {
      if (!args.phone) {
        return Person.find({});
      }

      return Person.find({ phone: { $exists: args.phone === "YES" } });
    },
    findPerson: async (root, args) => Person.findOne({ name: args.name }),
    //returns the logged-in user it receives in the
    //currentUser field of the third parameter of the resolver, context
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Person: {
    address: ({ street, city }) => {
      return {
        street,
        city,
      };
    },
  },

  Mutation: {
    addPerson: async (root, args) => {
      const person = new Person({ ...args });
      try {
        await person.save();
      } catch (error) {
        throw new GraphQLError("Saving user failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
            error,
          },
        });
      }

      return person;
    },
    editNumber: async (root, args) => {
      const person = await Person.findOne({ name: args.name });
      person.phone = args.phone;
      try {
        await person.save();
      } catch (error) {
        throw new GraphQLError("Editing number failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
            error,
          },
        });
      }

      return person;
    },
    createUser: async (root, args) => {
      const saltRounds = 10;
      const passwordHash = await await bcrypt.hash(args.password, saltRounds);
      const stringHash = passwordHash.toString();
      const user = new User({
        username: args.username,
        password: stringHash,
      });
      console.log("user", user);
      console.log("password", typeof stringHash);

      try {
        await user.save();
      } catch (error) {
        throw new GraphQLError("Creating the user failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
            error,
          },
        });
      }
      return user;
    },

    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      const passwordCorrect =
        user === null
          ? false
          : await bcrypt.compare(args.password, user.password);

      if (!(user && passwordCorrect)) {
        throw new GraphQLError("wrong credentials", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, process.env.SECRET) };
    },
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
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.startsWith("Bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), process.env.SECRET);
      const currentUser = await User.findById(decodedToken.id).populate(
        "friends"
      );
      return { currentUser };
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
