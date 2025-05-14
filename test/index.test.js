'use strict'

const whyIsNodeRunning = require('why-is-node-running')
const { test } = require('node:test')
const Fastify = require('fastify')
const fastifyValkey = require('..')

test.beforeEach(async () => {
  const fastify = Fastify()

  fastify.register(fastifyValkey, {
    addresses: [{ host: '127.0.0.1', port: 6379 }]
  })
  await fastify.ready()
  await fastify.valkey.flushall()
  await fastify.close()
})

test('Plugin should decorate instance as fastify.valkey', async (t) => {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(fastifyValkey, {
    addresses: [{ host: '127.0.0.1', port: 6379 }]
  })

  await fastify.ready()
  t.assert.ok(fastify.valkey)

  await fastify.close()
})

test('fastify.valkey should be functional valkey client', async (t) => {
  t.plan(1)
  const fastify = Fastify()

  fastify.register(fastifyValkey, {
    addresses: [{ host: '127.0.0.1', port: 6379 }]
  })

  await fastify.ready()

  await fastify.valkey.set('functional client key', 'functional client value')
  const val = await fastify.valkey.get('functional client key')
  t.assert.strictEqual(val, 'functional client value')

  await fastify.close()
})

test('fastify.valkey.test namespace should exist', async (t) => {
  t.plan(2)

  const fastify = Fastify()
  fastify.register(fastifyValkey, {
    addresses: [{ host: '127.0.0.1', port: 6379 }],
    namespace: 'test'
  })

  await fastify.ready()

  t.assert.ok(fastify.valkey)
  t.assert.ok(fastify.valkey.test)

  await fastify.close()
})

test('fastify.valkey.test should be functional valkey client', async (t) => {
  t.plan(1)
  const fastify = Fastify()

  fastify.register(fastifyValkey, {
    addresses: [{ host: '127.0.0.1', port: 6379 }],
    namespace: 'test'
  })

  await fastify.ready()

  await fastify.valkey.test.set('functional client namespace key', 'functional client namespace value')
  const val = await fastify.valkey.test.get('functional client namespace key')
  t.assert.strictEqual(val, 'functional client namespace value')

  await fastify.close()
})

test('Promises support', async (t) => {
  t.plan(1)
  const fastify = Fastify()

  fastify.register(fastifyValkey, {
    addresses: [{ host: '127.0.0.1', port: 6379 }]
  })

  await fastify.ready()

  await fastify.valkey.set('test promises key', 'test promises value')
  const val = await fastify.valkey.get('test promises key')
  t.assert.strictEqual(val, 'test promises value')

  await fastify.close()
})

test('Should accept custom valkey client that is already connected', async (t) => {
  t.plan(4)
  const fastify = Fastify()
  const { GlideClient } = require('@valkey/valkey-glide')
  const valkey = await GlideClient.createClient({ addresses: [{ host: '127.0.0.1', port: 6379 }] })

  await valkey.set('custom client key1', 'custom client value1')
  const val = await valkey.get('custom client key1')
  t.assert.strictEqual(val, 'custom client value1')

  fastify.register(fastifyValkey, {
    client: valkey,
  })

  await fastify.ready()

  t.assert.deepStrictEqual(fastify.valkey, valkey)

  await fastify.valkey.set('custom client key2', 'custom client value2')
  const val2 = await fastify.valkey.get('custom client key2')
  t.assert.strictEqual(val2, 'custom client value2')

  await valkey.set('custom client key3', 'custom client value3')
  const val3 = await fastify.valkey.get('custom client key3')
  t.assert.strictEqual(val3, 'custom client value3')

  await fastify.close()
  fastify.valkey.close()
})

test('Client should be close if closeClient is enabled', async (t) => {
  t.plan(5)
  const fastify = Fastify()
  const { GlideClient } = require('@valkey/valkey-glide')
  const valkey = await GlideClient.createClient({ addresses: [{ host: '127.0.0.1', port: 6379 }] })

  await valkey.set('closeClient enabled key1', 'closeClient enabled value1')
  const val = await valkey.get('closeClient enabled key1')
  t.assert.strictEqual(val, 'closeClient enabled value1')

  fastify.register(fastifyValkey, {
    client: valkey,
    closeClient: true
  })

  await fastify.ready()

  t.assert.deepStrictEqual(fastify.valkey, valkey)

  await fastify.valkey.set('closeClient enabled key2', 'closeClient enabled value2')
  const val2 = await fastify.valkey.get('closeClient enabled key2')
  t.assert.strictEqual(val2, 'closeClient enabled value2')

  const originalClose = fastify.valkey.close
  fastify.valkey.close = (callback) => {
    t.assert.ok('valkey client closed')
    originalClose.call(fastify.valkey, callback)
  }

  await fastify.close()
  try {
    await valkey.get('closeClient enabled key1')
    t.fail('Client should not work after being closed')
  } catch (err) {
    t.assert.ok('Should throw error when using closed client')
  }
})

test('Client should be close if closeClient is enabled, namespace', async (t) => {
  t.plan(5)
  const fastify = Fastify()
  const { GlideClient } = require('@valkey/valkey-glide')
  const valkey = await GlideClient.createClient({ addresses: [{ host: '127.0.0.1', port: 6379 }] })

  await valkey.set('closeClient enabled namespace key1', 'closeClient enabled namespace value1')
  const val = await valkey.get('closeClient enabled namespace key1')
  t.assert.strictEqual(val, 'closeClient enabled namespace value1')

  fastify.register(fastifyValkey, {
    client: valkey,
    namespace: 'close_client_enabled',
    closeClient: true
  })

  await fastify.ready()

  t.assert.deepStrictEqual(fastify.valkey.close_client_enabled, valkey)

  await fastify.valkey.close_client_enabled.set('closeClient enabled namespace key2', 'closeClient enabled namespace value2')
  const val2 = await fastify.valkey.close_client_enabled.get('closeClient enabled namespace key2')
  t.assert.strictEqual(val2, 'closeClient enabled namespace value2')

  const originalClose = fastify.valkey.close_client_enabled.close
  fastify.valkey.close_client_enabled.close = (callback) => {
    t.assert.ok('valkey client closed')
    originalClose.call(fastify.valkey.close_client_enabled, callback)
  }

  await fastify.close()
  try {
    await valkey.close_client_enabled.get('closeClient enabled namespace key1')
    t.fail('Client should not work after being closed')
  } catch (err) {
    t.assert.ok('Should throw error when using closed client')
  }
})

test('Should throw when using duplicate connection namespaces', async (t) => {
  t.plan(1)

  const namespace = 'duplicate_namespace'

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify
    .register(fastifyValkey, {
      addresses: [{ host: '127.0.0.1', port: 6379 }],
      namespace
    })
    .register(fastifyValkey, {
      addresses: [{ host: '127.0.0.1', port: 6379 }],
      namespace
    })

  await t.assert.rejects(fastify.ready(), new Error(`Valkey '${namespace}' instance namespace has already been registered`))
})

test('Should throw when trying to register multiple instances without giving a namespace', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify
    .register(fastifyValkey, {
      addresses: [{ host: '127.0.0.1', port: 6379 }],
    })
    .register(fastifyValkey, {
      addresses: [{ host: '127.0.0.1', port: 6379 }],
    })

  await t.assert.rejects(fastify.ready(), new Error('@fastify/valkey has already been registered'))
})

test('Should not throw within different contexts with same namespace', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(function (instance, _options, next) {
    instance.register(fastifyValkey, {
      addresses: [{ host: '127.0.0.1', port: 6379 }],
      namespace: 'same namespace'
    })
    next()
  })

  fastify.register(function (instance, _options, next) {
    instance
      .register(fastifyValkey, {
        addresses: [{ host: '127.0.0.1', port: 6379 }],
        namespace: 'same namespace'
      })
      .register(fastifyValkey, {
        addresses: [{ host: '127.0.0.1', port: 6379 }],
        namespace: 'same namespace2'
      })
    next()
  })

  await fastify.ready()
  t.assert.ok(fastify)
})

test('Should throw when trying to connect on an invalid host', async (t) => {
  t.plan(1)

  const fastify = Fastify({ pluginTimeout: 20000 })
  t.after(() => fastify.close())

  fastify.register(fastifyValkey, {
    addresses: [{ host: 'invalid_host' }],
    connectionBackoff: {
      numberOfRetries: 0
    }
  })

  await t.assert.rejects(fastify.ready())
})

test('Should be able to register multiple namespaced @fastify/valkey instances', async t => {
  t.plan(3)

  const fastify = Fastify()
  t.after(() => fastify.close())

  await fastify.register(fastifyValkey, {
    addresses: [{ host: '127.0.0.1', port: 6379 }],
    namespace: 'multiple_namespace1'
  })

  await fastify.register(fastifyValkey, {
    addresses: [{ host: '127.0.0.1', port: 6379 }],
    namespace: 'multiple_namespace2'
  })

  await fastify.ready()
  t.assert.ok(fastify.valkey)
  t.assert.ok(fastify.valkey.multiple_namespace1)
  t.assert.ok(fastify.valkey.multiple_namespace2)
})

test('Should throw when @fastify/valkey is initialized with an option that makes valkey throw', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyValkey, { addresses: [] })

  await t.assert.rejects(fastify.ready())
})

test('Should throw when @fastify/valkey is initialized with a namespace and an option that makes valkey throw', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyValkey, {
    addresses: [],
    namespace: 'fail'
  })

  await t.assert.rejects(fastify.ready())
})

setInterval(() => {
  whyIsNodeRunning()
}, 5000).unref()
