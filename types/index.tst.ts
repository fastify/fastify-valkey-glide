import Fastify, { FastifyInstance } from 'fastify'
import { GlideClient, GlideClusterClient } from '@valkey/valkey-glide'
import { expect } from 'tstyche'
import fastifyValkey, { FastifyValkey, FastifyValkeyPluginOptions, FastifyValkeyNamespacedInstance, } from '.'

const app:FastifyInstance = Fastify()
const valkey = {} as GlideClient
const valkeyCluster = {} as GlideClusterClient
app.register(fastifyValkey, { addresses: [{ host: '127.0.0.1', port: 6379 }] })

app.register(fastifyValkey, {
  client: valkey,
  closeClient: true,
  namespace: 'one'
})

app.register(fastifyValkey, {
  namespace: 'two',
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})

expect({
  client: valkeyCluster,
}).type.toBeAssignableTo<FastifyValkeyPluginOptions>()

expect({
  namespace: 'three',
  unknownOption: 'this should trigger a typescript error'
}).type.not.toBeAssignableTo<FastifyValkeyPluginOptions>()

// Plugin property available
app.after(() => {
  expect(app.valkey).type.toBeAssignableTo<GlideClient | GlideClusterClient>()
  expect(app.valkey).type.toBe<FastifyValkey>()

  expect(app.valkey).type.toBeAssignableTo<FastifyValkeyNamespacedInstance>()
  expect(app.valkey.one).type.toBe<
    GlideClient | GlideClusterClient | undefined
  >()
  expect(app.valkey.two).type.toBe<GlideClient | GlideClusterClient | undefined>()
})
