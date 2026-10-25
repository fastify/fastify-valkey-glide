# @fastify/valkey-glide

[![CI](https://github.com/fastify/fastify-valkey-glide/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fastify/fastify-valkey-glide/blob/main/.github/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@fastify/valkey-glide.svg?style=flat)](https://www.npmjs.com/package/@fastify/valkey-glide)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-brightgreen?style=flat)](https://github.com/neostandard/neostandard)

Fastify plugin for sharing a
[`@valkey/valkey-glide`](https://github.com/valkey-io/valkey-glide) client across
your application.

## Install

```sh
npm i @fastify/valkey-glide
```

### Compatibility

| Plugin version | Fastify version |
| -------------- | --------------- |
| `0.x`          | `^5.x`          |

[Valkey GLIDE's supported engine versions](https://github.com/valkey-io/valkey-glide?tab=readme-ov-file#supported-engine-versions)
determine Valkey and Redis compatibility.

## Usage

The plugin decorates Fastify with `fastify.valkey`.

### Plugin-managed client

When `client` is omitted, the plugin creates and owns a standalone client by
default:

```js
import Fastify from 'fastify'
import fastifyValkey from '@fastify/valkey-glide'

const fastify = Fastify()

fastify.register(fastifyValkey, {
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})

fastify.get('/value/:key', async (request) => {
  return fastify.valkey.get(request.params.key)
})

await fastify.listen({ port: 3000 })
```

For a cluster, use this registration instead. Cluster mode is not inferred from
GLIDE options.

```js
fastify.register(fastifyValkey, {
  clientMode: 'cluster',
  addresses: [{ host: '127.0.0.1', port: 7000 }]
})
```

Other GLIDE configuration options are passed to the selected `createClient`
method. Plugin-managed clients are closed when Fastify closes.

### Supplied client

Pass an existing `GlideClient` or `GlideClusterClient` with `client`. Do not
combine `client` with `clientMode` or GLIDE client creation options.

```js
import { GlideClient } from '@valkey/valkey-glide'

const client = await GlideClient.createClient({
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})

fastify.register(fastifyValkey, { client })
```

A supplied client remains caller-owned and is not closed by default. Set
`closeClient` to `true` to close it when Fastify closes:

```js
fastify.register(fastifyValkey, {
  client,
  closeClient: true
})
```

## Registering multiple Valkey client instances

To register multiple clients in one Fastify context, give every registration a
unique, non-empty `namespace`. `fastify.valkey` is then a map of clients instead
of a client. Do not mix namespaced and unnamed registrations in the same context.

```js
import Fastify from 'fastify'
import fastifyValkey from '@fastify/valkey-glide'

const fastify = Fastify()

fastify
  .register(fastifyValkey, {
    namespace: 'cache',
    addresses: [{ host: '127.0.0.1', port: 6379 }]
  })
  .register(fastifyValkey, {
    namespace: 'sessions',
    clientMode: 'cluster',
    addresses: [{ host: '127.0.0.1', port: 7000 }]
  })

fastify.get('/cache/:key', async (request) => {
  return fastify.valkey.cache.get(request.params.key)
})
```

[Fastify encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/)
applies to child contexts. A child may inherit or shadow parent namespaces, or
choose a different shape, without changing its parent or sibling contexts.

## License

Licensed under [MIT](./LICENSE).
