import { MongoClient, Db, Collection } from 'mongodb';
import { CACHE_TTL } from '@/lib/constants';

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient | undefined;
  mongoDb: Db | undefined;
};

function getUri(): string {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL environment variable is required');
  return uri;
}

let client: MongoClient;
let db: Db;

function getClient(): MongoClient {
  if (!client) {
    client =
      globalForMongo.mongoClient ??
      new MongoClient(getUri());
    if (process.env.NODE_ENV !== 'production') globalForMongo.mongoClient = client;
  }
  return client;
}

function getDb(): Db {
  if (!db) {
    db = globalForMongo.mongoDb ?? getClient().db();
    if (process.env.NODE_ENV !== 'production') globalForMongo.mongoDb = db;
  }
  return db;
}

export const mongoCache = {
  collection(name: string): Collection {
    return getDb().collection(name);
  },

  async set(collection: string, key: string, data: unknown, ttlSec: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    await getDb().collection(collection).updateOne(
      { _id: key as any },
      {
        $set: { data, expiresAt },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  },

  async get<T = unknown>(collection: string, key: string): Promise<T | null> {
    const doc = await getDb().collection(collection).findOne({ _id: key as any });
    if (!doc) return null;
    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
      await getDb().collection(collection).deleteOne({ _id: key as any });
      return null;
    }
    return doc.data as T;
  },

  async delete(collection: string, key: string): Promise<void> {
    await getDb().collection(collection).deleteOne({ _id: key as any });
  },

  async ensureIndexes(): Promise<void> {
    const collections = [
      { name: 'cache_sessions', ttl: CACHE_TTL.SESSION },
      { name: 'cache_auth_state', ttl: CACHE_TTL.AUTH_STATE },
      { name: 'cache_rate_limit', ttl: CACHE_TTL.RATE_LIMIT },
      { name: 'cache_progress', ttl: CACHE_TTL.PROGRESS },
      { name: 'cache_share_session', ttl: CACHE_TTL.SHARE_SESSION },
      { name: 'cache_peer', ttl: CACHE_TTL.PEER },
    ];

    for (const c of collections) {
      await getDb().collection(c.name).createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      );
    }
  },

  getDb,
  getClient,
};
