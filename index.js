'use strict'

const fp = require('fastify-plugin')
const { GlideClient, GlideClusterClient } = require('@valkey/valkey-glide')

const NAMESPACE_CONTAINER_MARKER = Symbol('fastify.valkey.namespace.container')

async function fastifyValkey (fastify, options) {
  const { namespace, closeClient = false, ...valkeyOptions } = options

  if (namespace === '') {
    throw new Error('Invalid namespace. Expected a non-empty string when namespace is provided')
  }

  let client = options.client || null

  if (namespace) {
    if (!fastify.valkey) {
      const namespaceContainer = Object.create(null)
      namespaceContainer[NAMESPACE_CONTAINER_MARKER] = true
      fastify.decorate('valkey', namespaceContainer)
    } else if (!fastify.valkey[NAMESPACE_CONTAINER_MARKER]) {
      throw new Error('@fastify/valkey-glide has already been registered')
    }
    if (fastify.valkey[namespace]) {
      throw new Error(`Valkey '${namespace}' instance namespace has already been registered`)
    }

    const closeNamedInstance = (fastify) => { fastify.valkey[namespace].close() }

    client = await setupClient(fastify, client, closeClient, valkeyOptions, closeNamedInstance)

    fastify.valkey[namespace] = client
  } else {
    if (fastify.valkey) {
      throw new Error('@fastify/valkey-glide has already been registered')
    }

    const close = (fastify) => { fastify.valkey.close() }

    client = await setupClient(fastify, client, closeClient, valkeyOptions, close)

    fastify.decorate('valkey', client)
  }
}

async function setupClient (fastify, client, closeClient, valkeyOptions, closeInstance) {
  if (client) {
    if (closeClient === true) {
      fastify.addHook('onClose', closeInstance)
    }
  } else {
    const { clientMode = 'standalone', ...options } = valkeyOptions
    if (clientMode !== 'standalone' && clientMode !== 'cluster') {
      throw new Error("Invalid clientMode. Expected 'standalone' or 'cluster'")
    }

    if (clientMode === 'cluster') {
      client = await GlideClusterClient.createClient(options)
    } else {
      client = await GlideClient.createClient(options)
    }

    fastify.addHook('onClose', closeInstance)
  }
  return client
}

module.exports = fp(fastifyValkey, {
  fastify: '5.x',
  name: '@fastify/valkey-glide'
})
module.exports.default = fastifyValkey
module.exports.fastifyValkey = fastifyValkey
