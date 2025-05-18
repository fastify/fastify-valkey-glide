'use strict'

const fp = require('fastify-plugin')
const { GlideClient } = require('@valkey/valkey-glide')

async function fastifyValkey (fastify, options) {
  const { namespace, closeClient = false, ...valkeyOptions } = options

  let client = options.client || null

  if (namespace) {
    if (!fastify.valkey) {
      fastify.decorate('valkey', Object.create(null))
    }
    if (fastify.valkey[namespace]) {
      throw new Error(`Valkey '${namespace}' instance namespace has already been registered`)
    }

    const closeNamedInstance = (fastify) => { fastify.valkey[namespace].close() }

    client = await setupClient(fastify, client, closeClient, valkeyOptions, closeNamedInstance)

    fastify.valkey[namespace] = client
  } else {
    if (fastify.valkey) {
      throw new Error('@fastify/valkey has already been registered')
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
    client = await GlideClient.createClient(valkeyOptions)

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
