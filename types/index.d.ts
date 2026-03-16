import { FastifyPluginCallback } from 'fastify'
import type { GlideClient, GlideClusterClient, GlideClientConfiguration, GlideClusterClientConfiguration, } from '@valkey/valkey-glide'

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

  export type FastifyValkey = ValkeyClient | FastifyValkeyNamespacedInstance

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
      clientMode?: 'standalone';
    } & GlideClientConfiguration) | ({
      namespace?: string;
      clientMode: 'cluster';
    } & GlideClusterClientConfiguration)
  export const fastifyValkey: FastifyValkeyPluginType
  export { fastifyValkey as default }
}

declare function fastifyValkey (...params: Parameters<FastifyValkeyPluginType>): ReturnType<FastifyValkeyPluginType>
export = fastifyValkey
