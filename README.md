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
```

### Accessing the Valkey Client

Once you have registered your plugin, you can access the Valkey client via `fastify.valkey`.

The client is automatically closed when the fastify instance is closed.

```js
import Fastify from 'fastify'
import fastifyValkey from '@fastify/valkey-glide'

const fastify = Fastify({ logger: true })

fastify.register(fastifyValkey, {
  addresses: [{ host: '127.0.0.1', port: 6379 }],
})

fastify.post('/foo', (request, reply) => {
  fastify.valkey.set(request.body.key, request.body.value, (err) => {
    reply.send(err || { status: 'ok' })
  })
})

fastify.get('/foo', (request, reply) => {
  fastify.valkey.get(request.query.key, (err, val) => {
    reply.send(err || val)
  })
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

To automatically close the client connection, set clientClose to true.

```js
fastify.register(fastifyValkey, { 
    client, 
    closeClient: true })
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
fastify.post('/hello', (request, reply) => {
  fastify.valkey['hello'].set(request.body.key, request.body.value, (err) => {
    reply.send(err || { status: 'ok' })
  })
})

fastify.get('/hello', (request, reply) => {
  fastify.valkey.hello.get(request.query.key, (err, val) => {
    reply.send(err || val)
  })
})

// Here we will use the `world` named instance
fastify.post('/world', (request, reply) => {
  fastify.valkey.world.set(request.body.key, request.body.value, (err) => {
    reply.send(err || { status: 'ok' })
  })
})

fastify.get('/world', (request, reply) => {
  fastify.valkey['world'].get(request.query.key, (err, val) => {
    reply.send(err || val)
  })
})

try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
```

## License

Licensed under [MIT](./LICENSE).
