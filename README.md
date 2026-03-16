# @fastify/valkey-glide

Fastify Valkey connection plugin, with this you can share the same Valkey connection in every part of your server.

Using [`@valkey/valkey-glide`](https://github.com/valkey-io/valkey-glide) client under the hood.
Valkey Glide is an open-source Valkey client library. it is one of the official client libraries for Valkey, and it supports all Valkey commands.

### Compatibility
| Plugin version | Fastify version |
| ---------------|-----------------|
|      `0.x`     |      `^5.x`     |

For Valkey and Redis DB compatibility look [here](https://github.com/valkey-io/valkey-glide?tab=readme-ov-file#supported-engine-versions)

## Usage

Add it to your project with `register` and you are done!

### Upgrade notes

- Mixed mode registrations are rejected within the same Fastify instance tree. You cannot mix one default instance and namespaced instances under the same root Fastify instance.
- `clientMode` is validated. Only `'standalone'` and `'cluster'` are accepted.
- If `namespace` is provided, it must be a non-empty string.
- TypeScript: `fastify.valkey` is typed as a union (`ValkeyClient | FastifyValkeyNamespacedInstance`). Depending on your usage, you may need to narrow or cast before calling root client methods (for example, `.get`) or namespace properties.

### Create a new Valkey Client

The `options` that you pass to `register` will be passed to the Valkey client.

```js
import Fastify from 'fastify'
import fastifyValkey from '@fastify/valkey-glide'

const fastify = Fastify()

// create by specifying address
fastify.register(fastifyValkey, {
  addresses: [{ host: '127.0.0.1' }]
})

// OR with more options
fastify.register(fastifyValkey, {
  addresses: [{ host: '127.0.0.1', port: 6379 }],
  credentials: {username: "user1", password: "password"},
  useTLS: true
})

// OR create a managed cluster client
fastify.register(fastifyValkey, {
  clientMode: 'cluster',
  addresses: [{ host: '127.0.0.1', port: 6379 }],
  periodicChecks: 'enabledDefaultConfigs'
})
```

### Accessing the Valkey Client

Once you have registered your plugin, you can access the Valkey client via `fastify.valkey`.

Clients created by this plugin are automatically closed when the fastify instance is closed.

```js
import Fastify from 'fastify'
import fastifyValkey from '@fastify/valkey-glide'

const fastify = Fastify({ logger: true })

fastify.register(fastifyValkey, {
  addresses: [{ host: '127.0.0.1', port: 6379 }],
})

fastify.post('/foo', async (request, reply) => {
  await fastify.valkey.set(request.body.key, request.body.value)
  reply.send({ status: 'ok' })
})

fastify.get('/foo', async (request, reply) => {
  const val = await fastify.valkey.get(request.query.key)
  reply.send(val)
})

try {
  await fastify.listen({ port: 3000 })
  console.log(`server listening on ${fastify.server.address().port}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
```

### Using an existing Valkey client

You may also supply an existing *Valkey* client instance by passing an options
object with the `client` property set to the instance. In this case,
the client is not automatically closed when the Fastify instance is
closed.

```js
import Fastify from 'fastify'
import fastifyValkey from '@fastify/valkey-glide'
import { GlideClient } from '@valkey/valkey-glide'

const fastify = Fastify()

const client = await GlideClient.createClient({
  addresses: [{ host: 'localhost', port: 6379 }]
})

fastify.register(fastifyValkey, { client })
```

You can also supply a *Valkey Cluster* instance to the client:

```js
import Fastify from 'fastify'
import fastifyValkey from '@fastify/valkey-glide'
import { GlideClusterClient } from '@valkey/valkey-glide'

const fastify = Fastify()

const client = await GlideClusterClient.createClient({
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})

fastify.register(fastifyValkey, { client })
```

Note: by default, *@fastify/valkey-glide* will **not** automatically close the client
connection when the Fastify server shuts down.

To automatically close the client connection, set closeClient to true.

```js
fastify.register(fastifyValkey, {
  client,
  closeClient: true
})
```

## Registering multiple Valkey client instances

By using the `namespace` option you can register multiple Valkey client instances.

```js
import Fastify from 'fastify'
import fastifyValkey from '@fastify/valkey-glide'
import { GlideClient } from '@valkey/valkey-glide'

const fastify = Fastify()

const valkey = await GlideClient.createClient({
  addresses: [{ host: 'localhost', port: 6379 }]
})

fastify
  .register(fastifyValkey, {
    addresses: [{ host: '127.0.0.1', port: 6380 }],
    namespace: 'hello'
  })

fastify
  .register(fastifyValkey, {
    client: valkey,
    namespace: 'world'
  })

// Here we will use the `hello` named instance
fastify.post('/hello', async (request, reply) => {
  await fastify.valkey['hello'].set(request.body.key, request.body.value)
  reply.send({ status: 'ok' })
})

fastify.get('/hello', async (request, reply) => {
  const val = await fastify.valkey.hello.get(request.query.key)
  reply.send(val)
})

// Here we will use the `world` named instance
fastify.post('/world', async (request, reply) => {
  await fastify.valkey.world.set(request.body.key, request.body.value)
  reply.send({ status: 'ok' })
})

fastify.get('/world', async (request, reply) => {
  const val = await fastify.valkey['world'].get(request.query.key)
  reply.send(val)
})

try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
```

### Comprehensive standalone configuration example

```js
import Fastify from 'fastify'
import fastifyValkey from '@fastify/valkey-glide'
import {
  Decoder,
  GlideClientConfiguration,
  ProtocolVersion
} from '@valkey/valkey-glide'

const fastify = Fastify()

fastify.register(fastifyValkey, {
  addresses: [
    { host: '127.0.0.1', port: 6379 },
    { host: '127.0.0.2', port: 6379 }
  ],
  databaseId: 1,
  useTLS: true,
  credentials: { username: 'user1', password: 'password' },
  requestTimeout: 5000,
  protocol: ProtocolVersion.RESP3,
  clientName: 'fastify-valkey-main',
  readFrom: 'preferReplica',
  clientAz: 'us-east-1a',
  defaultDecoder: Decoder.String,
  inflightRequestsLimit: 1000,
  lazyConnect: false,
  connectionBackoff: {
    numberOfRetries: 5,
    factor: 500,
    exponentBase: 2,
    jitterPercent: 20
  },
  advancedConfiguration: {
    connectionTimeout: 1000,
    tlsAdvancedConfiguration: {
      insecure: false
    }
  },
  pubsubSubscriptions: {
    channelsAndPatterns: {
      [GlideClientConfiguration.PubSubChannelModes.Exact]: new Set(['updates'])
    },
    callback: (message, context) => {
      console.log('pubsub message', message, context)
    },
    context: { source: 'fastify' }
  }
})
```

## License

Licensed under [MIT](./LICENSE).
