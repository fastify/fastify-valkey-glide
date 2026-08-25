import { FastifyPluginAsync } from 'fastify'
import { GlideClient, GlideClusterClient, GlideClientConfiguration, GlideClusterClientConfiguration, } from '@valkey/valkey-glide'

type FastifyValkeyPluginType = FastifyPluginAsync<fastifyValkey.FastifyValkeyPluginOptions>

// Keep option variants mutually exclusive as GLIDE adds configuration keys.
type UnionKeys<T> = T extends unknown ? keyof T : never
type StrictUnion<T, TAll = T> = T extends unknown ? T & Partial<Record<Exclude<UnionKeys<TAll>, keyof T>, never>> : never

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

  export type FastifyValkeyPluginOptions = StrictUnion<
    {
      client: ValkeyClient;
      namespace?: string;
      /**
       * @default false
       */
      closeClient?: boolean;
    } | ({
      namespace?: string;
      /**
       * @default 'standalone'
       */
      clientMode?: 'standalone';
    } & GlideClientConfiguration) | ({
      namespace?: string;
      clientMode: 'cluster';
    } & GlideClusterClientConfiguration)
  >
  export const fastifyValkey: FastifyValkeyPluginType
  export { fastifyValkey as default }
}

declare function fastifyValkey (...params: Parameters<FastifyValkeyPluginType>): ReturnType<FastifyValkeyPluginType>
export = fastifyValkey
