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
  t.plan(6)
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

  const originalClose = valkey.close
  valkey.close = () => {
    t.assert.ok('valkey client closed')
    originalClose.call(valkey)
  }

  const replacementClient = { close: t.mock.fn() }
  fastify.valkey = replacementClient

  await fastify.close()
  t.assert.strictEqual(replacementClient.close.mock.callCount(), 0)
  await t.assert.rejects(valkey.get('closeClient enabled key1'))
})

test('Client should be close if closeClient is enabled, namespace', async (t) => {
  t.plan(6)
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

  const originalClose = valkey.close
  valkey.close = () => {
    t.assert.ok('valkey client closed')
    originalClose.call(valkey)
  }

  const replacementClient = { close: t.mock.fn() }
  fastify.valkey.close_client_enabled = replacementClient

  await fastify.close()
  t.assert.strictEqual(replacementClient.close.mock.callCount(), 0)
  await t.assert.rejects(valkey.get('closeClient enabled namespace key1'))
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

test('Should throw when namespace is not a non-empty string', async (t) => {
  t.plan(2)

  for (const namespace of ['', 0]) {
    const fastify = Fastify()

    fastify.register(fastifyValkey, {
      addresses: [{ host: '127.0.0.1', port: 6379 }],
      namespace
    })

    await t.assert.rejects(fastify.ready(), new Error("'namespace' must be a non-empty string"))
    await fastify.close()
  }
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

  await t.assert.rejects(fastify.ready(), new Error('@fastify/valkey-glide has already been registered; use a namespace for every client when registering multiple clients'))
})

test('Should throw when adding a namespaced instance after an unnamed instance', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify
    .register(fastifyValkey, {
      addresses: [{ host: '127.0.0.1', port: 6379 }]
    })
    .register(fastifyValkey, {
      addresses: [{ host: '127.0.0.1', port: 6379 }],
      namespace: 'named'
    })

  await t.assert.rejects(fastify.ready(), new Error('@fastify/valkey-glide has already been registered; use a namespace for every client when registering multiple clients'))
})

test('Should throw when adding an unnamed instance after a namespaced instance', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify
    .register(fastifyValkey, {
      addresses: [{ host: '127.0.0.1', port: 6379 }],
      namespace: 'named'
    })
    .register(fastifyValkey, {
      addresses: [{ host: '127.0.0.1', port: 6379 }]
    })

  await t.assert.rejects(fastify.ready(), new Error('@fastify/valkey-glide has already been registered; use a namespace for every client when registering multiple clients'))
})

test('Should allow a child namespaced instance to shadow an inherited unnamed instance', async (t) => {
  t.plan(4)

  const fastify = Fastify()
  t.after(() => fastify.close())

  const parentClient = { close () {} }
  const childClient = { close () {} }
  let childInstance

  fastify
    .register(fastifyValkey, {
      client: parentClient
    })
    .register(function (instance, _options, next) {
      childInstance = instance
      instance.register(fastifyValkey, {
        client: childClient,
        namespace: 'named'
      })
      next()
    })

  await fastify.ready()

  t.assert.strictEqual(fastify.valkey, parentClient)
  t.assert.notStrictEqual(childInstance.valkey, parentClient)
  t.assert.strictEqual(childInstance.valkey.named, childClient)
  t.assert.strictEqual(fastify.valkey.named, undefined)
})

test('Should allow a child unnamed instance to shadow an inherited namespace map', async (t) => {
  t.plan(3)

  const fastify = Fastify()
  t.after(() => fastify.close())

  const parentClient = { close () {} }
  const childClient = { close () {} }
  let childInstance

  fastify
    .register(fastifyValkey, {
      client: parentClient,
      namespace: 'named'
    })
    .register(function (instance, _options, next) {
      childInstance = instance
      instance.register(fastifyValkey, {
        client: childClient
      })
      next()
    })

  await fastify.ready()

  t.assert.strictEqual(fastify.valkey.named, parentClient)
  t.assert.strictEqual(childInstance.valkey, childClient)
  t.assert.strictEqual(childInstance.valkey.named, undefined)
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

test('Should keep child namespace registrations encapsulated', async (t) => {
  t.plan(7)

  const fastify = Fastify()
  t.after(() => fastify.close())

  const parentClient = { close () {} }
  const parentSharedClient = { close () {} }
  const childClient = { close () {} }
  const childSharedClient = { close () {} }
  let childInstance

  fastify
    .register(fastifyValkey, {
      client: parentClient,
      namespace: 'parent'
    })
    .register(fastifyValkey, {
      client: parentSharedClient,
      namespace: 'shared'
    })
    .register(function (instance, _options, next) {
      childInstance = instance
      instance
        .register(fastifyValkey, {
          client: childClient,
          namespace: 'child'
        })
        .register(fastifyValkey, {
          client: childSharedClient,
          namespace: 'shared'
        })
      next()
    })

  await fastify.ready()

  t.assert.notStrictEqual(childInstance.valkey, fastify.valkey)
  t.assert.strictEqual(fastify.valkey.parent, parentClient)
  t.assert.strictEqual(fastify.valkey.shared, parentSharedClient)
  t.assert.strictEqual(fastify.valkey.child, undefined)
  t.assert.strictEqual(childInstance.valkey.parent, parentClient)
  t.assert.strictEqual(childInstance.valkey.child, childClient)
  t.assert.strictEqual(childInstance.valkey.shared, childSharedClient)
})

test('Should throw when trying to connect on an invalid host', async (t) => {
  t.plan(1)

  const fastify = Fastify({ pluginTimeout: 20000 })
  t.after(() => fastify.close())

  fastify.register(fastifyValkey, {
    addresses: [{ host: 'invalid_host', port: 9999 }],
    connectionBackoff: {
      numberOfRetries: 0
    }
  })

  await t.assert.rejects(fastify.ready())
})

test("Should create and close a cluster client when clientMode is 'cluster'", async (t) => {
  t.plan(3)

  const fastify = Fastify()
  const { GlideClusterClient } = require('@valkey/valkey-glide')
  const fakeClient = {
    close: t.mock.fn()
  }

  t.mock.method(GlideClusterClient, 'createClient', async (options) => {
    t.assert.deepStrictEqual(options, {
      addresses: [{ host: '127.0.0.1', port: 6379 }],
      periodicChecks: 'disabled'
    })
    return fakeClient
  })

  fastify.register(fastifyValkey, {
    clientMode: 'cluster',
    addresses: [{ host: '127.0.0.1', port: 6379 }],
    periodicChecks: 'disabled'
  })

  await fastify.ready()
  t.assert.strictEqual(fastify.valkey, fakeClient)
  await fastify.close()
  t.assert.strictEqual(fakeClient.close.mock.callCount(), 1)
})

test('Should throw when clientMode is invalid', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyValkey, {
    clientMode: 'invalid_mode',
    addresses: [{ host: '127.0.0.1', port: 6379 }]
  })

  await t.assert.rejects(fastify.ready(), new Error("Invalid clientMode. Expected 'standalone' or 'cluster'"))
})

test('Should throw when client creation options are used with an existing client', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyValkey, {
    client: { close () {} },
    clientMode: 'cluster'
  })

  await t.assert.rejects(fastify.ready(), new Error("'client' cannot be combined with client creation options"))
})

test('Should allow Fastify registration options with an existing client', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())
  const client = { close () {} }

  fastify.register(fastifyValkey, {
    client,
    prefix: '/ignored',
    logLevel: 'debug',
    logSerializers: {
      valkey: String
    }
  })

  await fastify.ready()
  t.assert.strictEqual(fastify.valkey, client)
})

test('Should throw when client does not provide a close method', async (t) => {
  const invalidClients = [null, false, 0, 'client', {}]
  t.plan(invalidClients.length)

  for (const client of invalidClients) {
    const fastify = Fastify()

    fastify.register(fastifyValkey, { client })

    await t.assert.rejects(fastify.ready(), new Error("'client' must be an object with a close() method"))
    await fastify.close()
  }
})

test('Should throw when closeClient is not a boolean', async (t) => {
  const invalidCloseClientValues = ['true', 1, null]
  t.plan(invalidCloseClientValues.length)

  for (const closeClient of invalidCloseClientValues) {
    const fastify = Fastify()

    fastify.register(fastifyValkey, {
      client: { close () {} },
      closeClient
    })

    await t.assert.rejects(fastify.ready(), new Error("'closeClient' must be a boolean"))
    await fastify.close()
  }
})

test('Should throw when closeClient is used with a managed client', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyValkey, {
    addresses: [{ host: '127.0.0.1', port: 6379 }],
    closeClient: false
  })

  await t.assert.rejects(fastify.ready(), new Error("'closeClient' can only be used with 'client'"))
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

test('Should throw when @fastify/valkey is initialized with an option that makes valkey throw', { skip: process.platform === 'darwin' }, async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyValkey, { addresses: [] })

  await t.assert.rejects(fastify.ready())
})

test('Should throw when @fastify/valkey is initialized with a namespace and an option that makes valkey throw', { skip: process.platform === 'darwin' }, async (t) => {
  t.plan(1)

  const fastify = Fastify({ pluginTimeout: 20000 })
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
