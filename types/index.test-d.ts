import Fastify, { FastifyInstance } from 'fastify'
import { GlideClient, GlideClusterClient } from '@valkey/valkey-glide'
import { expectAssignable, expectError, expectType } from 'tsd'
import fastifyValkey, { FastifyValkey, FastifyValkeyPluginOptions, FastifyValkeyNamespacedInstance, } from '..'

const app:FastifyInstance = Fastify()
const valkey: GlideClient = await GlideClient.createClient({ addresses: [{ host: '127.0.0.1', port: 6379 }] })
const valkeyCluster: GlideClusterClient = await GlideClusterClient.createClient({ addresses: [{ host: '127.0.0.1', port: 6379 }] })

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

expectAssignable<FastifyValkeyPluginOptions>({
  client: valkeyCluster,
})

expectError(app.register(fastifyValkey, {
  namespace: 'three',
  unknownOption: 'this should trigger a typescript error'
}))

// Plugin property available
app.after(() => {
  expectAssignable<GlideClient | GlideClusterClient>(app.valkey)
  expectType<FastifyValkey>(app.valkey)

  expectAssignable<FastifyValkeyNamespacedInstance>(app.valkey)
  expectType<GlideClient | GlideClusterClient>(app.valkey.one)
  expectType<GlideClient | GlideClusterClient>(app.valkey.two)
})
