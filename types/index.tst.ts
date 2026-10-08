import Fastify, { FastifyInstance } from 'fastify'
import { GlideClient, GlideClusterClient } from '@valkey/valkey-glide'
import { expect } from 'tstyche'
import fastifyValkey, { FastifyValkey, FastifyValkeyPluginOptions, FastifyValkeyNamespacedInstance, } from '.'

const app:FastifyInstance = Fastify()
const directApp:FastifyInstance = Fastify()
const namespacedApp:FastifyInstance = Fastify()
const registerOptionsApp:FastifyInstance = Fastify()
const valkey = {} as GlideClient
const valkeyCluster = {} as GlideClusterClient
app.register(fastifyValkey, { addresses: [{ host: '127.0.0.1', port: 6379 }] })

const pluginResult = fastifyValkey(directApp, {
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})
expect(pluginResult).type.toBe<Promise<void>>()

namespacedApp.register(fastifyValkey, {
  client: valkey,
  closeClient: true,
  namespace: 'one'
})

namespacedApp.register(fastifyValkey, {
  namespace: 'two',
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})

namespacedApp.register(fastifyValkey, {
  namespace: 'cluster',
  clientMode: 'cluster',
  addresses: [{ host: '127.0.0.1', port: 6379 }],
  periodicChecks: 'enabledDefaultConfigs'
})

registerOptionsApp.register(fastifyValkey, {
  client: valkey,
  prefix: '/ignored',
  logLevel: 'debug',
  logSerializers: {
    valkey: String
  }
})

expect<FastifyValkeyPluginOptions>().type.toBeAssignableFrom({
  client: valkeyCluster
})

expect<FastifyValkeyPluginOptions>().type.toBeAssignableFrom({
  clientMode: 'cluster' as const,
  addresses: [{ host: '127.0.0.1', port: 6379 }],
  periodicChecks: 'disabled' as const
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  clientMode: 'standalone' as const,
  addresses: [{ host: '127.0.0.1', port: 6379 }],
  periodicChecks: 'disabled' as const
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  addresses: [{ host: '127.0.0.1', port: 6379 }],
  periodicChecks: 'disabled' as const
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  addresses: [{ host: '127.0.0.1', port: 6379 }],
  recoveryRequestsQueueSize: 100
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  addresses: [{ host: '127.0.0.1', port: 6379 }],
  advancedConfiguration: {
    refreshTopologyFromInitialNodes: true
  }
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  clientMode: 'invalid',
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  client: valkeyCluster,
  clientMode: 'cluster' as const,
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  client: valkey,
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  client: null
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  client: valkey,
  closeClient: 'true'
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  addresses: [{ host: '127.0.0.1', port: 6379 }],
  closeClient: false
})

expect<FastifyValkeyPluginOptions>().type.not.toBeAssignableFrom({
  namespace: 'three',
  unknownOption: 'this should trigger a typescript error'
})

// Plugin property available
app.after(() => {
  expect(app.valkey).type.toBeAssignableTo<GlideClient | GlideClusterClient>()
  expect(app.valkey).type.toBe<FastifyValkey>()
})

namespacedApp.after(() => {
  expect(namespacedApp.valkey).type.toBeAssignableTo<FastifyValkeyNamespacedInstance>()
  expect(namespacedApp.valkey.one).type.toBe<
    GlideClient | GlideClusterClient | undefined
  >()
  expect(namespacedApp.valkey.two).type.toBe<GlideClient | GlideClusterClient | undefined>()
})
