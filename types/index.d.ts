import { FastifyPluginCallback } from 'fastify'
import { GlideClient, GlideClusterClient, GlideClientConfiguration, } from '@valkey/valkey-glide'

type FastifyValkeyPluginType = FastifyPluginCallback<fastifyValkey.FastifyValkeyPluginOptions>

declare module 'fastify' {
  interface FastifyInstance {
    valkey: fastifyValkey.FastifyValkey;
  }
}

declare namespace fastifyValkey {

  export type ValkeyClient = GlideClient | GlideClusterClient

  export interface FastifyValkeyNamespacedInstance {
    [namespace: string]: ValkeyClient;
  }

  export type FastifyValkey = FastifyValkeyNamespacedInstance & ValkeyClient

  export type FastifyValkeyPluginOptions =
    {
      client: ValkeyClient;
      namespace?: string;
      /**
       * @default false
       */
      closeClient?: boolean;
    } | ({
      namespace?: string;
    } & GlideClientConfiguration)
  export const fastifyValkey: FastifyValkeyPluginType
  export { fastifyValkey as default }
}

declare function fastifyValkey (...params: Parameters<FastifyValkeyPluginType>): ReturnType<FastifyValkeyPluginType>
export = fastifyValkey
