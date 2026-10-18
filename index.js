'use strict'

const fp = require('fastify-plugin')
const { GlideClient, GlideClusterClient } = require('@valkey/valkey-glide')

const namespaceMaps = new WeakSet()

async function fastifyValkey (fastify, options) {
  const { namespace, client: suppliedClient, closeClient, ...valkeyOptions } = options

  const hasSuppliedClient = suppliedClient !== undefined
  let client = suppliedClient

  delete valkeyOptions.prefix
  delete valkeyOptions.logLevel
  delete valkeyOptions.logSerializers

  if (namespace !== undefined && (typeof namespace !== 'string' || namespace.length === 0)) {
    throw new Error("'namespace' must be a non-empty string")
  }

  if (hasSuppliedClient && (suppliedClient === null || typeof suppliedClient !== 'object' || typeof suppliedClient.close !== 'function')) {
    throw new Error("'client' must be an object with a close() method")
  }

  if (closeClient !== undefined && typeof closeClient !== 'boolean') {
    throw new Error("'closeClient' must be a boolean")
  }

  if (hasSuppliedClient && Object.keys(valkeyOptions).length > 0) {
    throw new Error("'client' cannot be combined with client creation options")
  }

  if (!hasSuppliedClient && closeClient !== undefined) {
    throw new Error("'closeClient' can only be used with 'client'")
  }

  if (namespace) {
    const hasOwnValkey = Object.hasOwn(fastify, 'valkey')

    if (!hasOwnValkey) {
      const parentNamespaceMap = namespaceMaps.has(fastify.valkey) ? fastify.valkey : null
      const namespaceMap = Object.create(parentNamespaceMap)
      namespaceMaps.add(namespaceMap)
      fastify.decorate('valkey', namespaceMap)
    } else if (!namespaceMaps.has(fastify.valkey)) {
      throw new Error('@fastify/valkey-glide has already been registered; use a namespace for every client when registering multiple clients')
    }

    if (Object.hasOwn(fastify.valkey, namespace)) {
      throw new Error(`Valkey '${namespace}' instance namespace has already been registered`)
    }

    const closeNamedInstance = (_fastify) => { client.close() }

    client = await setupClient(fastify, client, closeClient, valkeyOptions, closeNamedInstance)

    fastify.valkey[namespace] = client
  } else {
    if (Object.hasOwn(fastify, 'valkey')) {
      throw new Error('@fastify/valkey-glide has already been registered; use a namespace for every client when registering multiple clients')
    }

    const close = (_fastify) => { client.close() }

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
    const { clientMode = 'standalone', ...clientOptions } = valkeyOptions

    if (clientMode === 'standalone') {
      client = await GlideClient.createClient(clientOptions)
    } else if (clientMode === 'cluster') {
      client = await GlideClusterClient.createClient(clientOptions)
    } else {
      throw new Error("Invalid clientMode. Expected 'standalone' or 'cluster'")
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
