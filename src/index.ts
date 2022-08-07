import Fastify, { FastifyReply, FastifyRequest } from 'fastify'
import { buildSchema } from 'graphql'
import mercurius, { IResolvers, MercuriusLoaders } from 'mercurius'
import { codegenMercurius, loadSchemaFiles } from 'mercurius-codegen'
export const app = Fastify({
  logger: false,
})

const t4 = loadSchemaFiles('src/graphql/schema/**/*.gql', {
  watchOptions: {
    enabled: true,
    onChange(schema) {
      console.log("chnage been made to schema")
      app.graphql.replaceSchema(buildSchema(schema.join('\n')))
      app.graphql.defineResolvers(resolvers)

      console.log("about to code gen")
      codegenMercurius(app, {
        targetPath: './src/graphql/generated1.ts',
        operationsGlob: './src/graphql/operations/example.gql',
      }).catch(console.error)
      console.log("schema:", schema)
    },
  },
})
const schema = t4.schema
console.log(t4)
const buildContext = async (req: FastifyRequest, _reply: FastifyReply) => {
  return {
    authorization: req.headers.authorization,
  }
}

type PromiseType<T> = T extends PromiseLike<infer U> ? U : T

declare module 'mercurius' {
  interface MercuriusContext
    extends PromiseType<ReturnType<typeof buildContext>> { }
}

const dogs = [
  { name: 'Max' },
  { name: 'Charlie' },
  { name: 'Buddy' },
  { name: 'Max' },
  { name: 'Bulba', owner: { name: "amelia" } }
]

const owners: Record<string, { name: string }> = {
  Max: {
    name: 'Jennifer',
  },
  Charlie: {
    name: 'Sarah',
  },
  Buddy: {
    name: 'Tracy',
  },
  Bulba: {
    name: ""
  }
}

const resolvers: IResolvers = {
  Query: {
    Hello(root, args, ctx, info) {
      // root ~ {}
      root
      // args ~ {}
      args
      // ctx.authorization ~ string | undefined
      ctx.authorization
      // info ~ GraphQLResolveInfo
      info
      console.log("hello is called")
      return 'world'
    },
    dogs() {
      console.log("dog have been call")
      console.log(dogs)
      return dogs
    },
  },
  Mutation: {
    add(root, { x, y }, ctx, info) {
      // root ~ {}
      root
      // x ~ string
      x
      // x ~ string
      y
      // ctx.authorization ~ string | undefined
      ctx.authorization
      // info ~ GraphQLResolveInfo
      info

      return x + y
    },
    adddog(_root, { name, owner }, _ctx, _info) {
      dogs.push({ name: name })
      owners[name] = { name: owner }
    }
  }
}

const loaders: MercuriusLoaders = {
  Dog: {
    // async name(queries, _ctx) {
    //   console.log("name loader called", queries)
    //   return ["tako", "pettan", "manaide", "bhumibol"]
    // },
    async owner(queries, _ctx) {
      console.log("dog loader iscalled", queries)
      const t3 = queries.map((element) => { return element.obj.owner != null ? element.obj.owner : owners[element.obj.name] })
      console.log(t3)
      return t3
    },

  },
  Human: {
    async name(queries, _ctx) {
      console.log("name loader is called")
      console.log(queries)
      return queries.map((element) => { return element.obj.name })
    }
  },
  String: {
    async string(queries, _ctx) {
      console.log(queries)
      return queries
    },
    async(queries, _ctx) {
      console.log("__ is called")
    }
  }
}

app.register(mercurius, {
  schema,
  resolvers,
  loaders,
  context: buildContext,
  subscription: true,
  graphiql: true,
})

codegenMercurius(app, {
  targetPath: './src/graphql/generated.ts',
  operationsGlob: './src/graphql/operations/*.gql',
  watchOptions: {
    enabled: process.env.NODE_ENV === 'development',
  },
}).catch(console.error)


// app.listen(8000)