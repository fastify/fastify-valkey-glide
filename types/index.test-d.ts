import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { GlideClient, GlideClusterClient } from '@valkey/valkey-glide'
import { expectAssignable, expectType } from 'tsd'
import fastifyValkey from '..'
import type { FastifyValkey, FastifyValkeyPluginOptions, FastifyValkeyNamespacedInstance, } from '..'

const appDefault: FastifyInstance = Fastify()
const appNamespaced: FastifyInstance = Fastify()
const appCluster: FastifyInstance = Fastify()
const valkey: GlideClient = await GlideClient.createClient({ addresses: [{ host: '127.0.0.1', port: 6379 }] })
const valkeyCluster: GlideClusterClient = await GlideClusterClient.createClient({ addresses: [{ host: '127.0.0.1', port: 6379 }] })

appDefault.register(fastifyValkey, { addresses: [{ host: '127.0.0.1', port: 6379 }] })

appNamespaced.register(fastifyValkey, {
  client: valkey,
  closeClient: true,
  namespace: 'one'
})

appNamespaced.register(fastifyValkey, {
  namespace: 'two',
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})

appCluster.register(fastifyValkey, {
  clientMode: 'cluster',
  addresses: [{ host: '127.0.0.1', port: 6379 }]
})

expectAssignable<FastifyValkeyPluginOptions>({
  client: valkeyCluster,
})

expectAssignable<FastifyValkeyPluginOptions>({
  clientMode: 'cluster',
  addresses: [{ host: '127.0.0.1', port: 6379 }],
})

const invalidOptions: FastifyValkeyPluginOptions = {
  namespace: 'three',
  // @ts-expect-error unknownOption is not part of the plugin options
  unknownOption: 'this should trigger a typescript error'
}

expectType<FastifyValkeyPluginOptions>(invalidOptions)

// Plugin property available
appDefault.after(() => {
  expectType<FastifyValkey>(appDefault.valkey)

  expectAssignable<FastifyValkeyNamespacedInstance | GlideClient | GlideClusterClient>(appDefault.valkey)

  // @ts-expect-error root valkey access requires narrowing before namespace lookup
  const rootNamespaceLookup = appDefault.valkey.one
  // @ts-expect-error root valkey access requires narrowing before client method calls
  appDefault.valkey.get('key')

  rootNamespaceLookup satisfies unknown
})

appNamespaced.after(() => {
  expectType<FastifyValkey>(appNamespaced.valkey)

  expectAssignable<FastifyValkeyNamespacedInstance | GlideClient | GlideClusterClient>(appNamespaced.valkey)

  const namespacedValkey = appNamespaced.valkey as FastifyValkeyNamespacedInstance
  expectType<GlideClient | GlideClusterClient>(namespacedValkey.one)
  expectType<GlideClient | GlideClusterClient>(namespacedValkey.two)
})
