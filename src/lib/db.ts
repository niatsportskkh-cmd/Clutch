import { MongoClient, type Db } from 'mongodb'

const uri = process.env.MONGODB_URI
if (!uri) throw new Error('Missing env var MONGODB_URI')

// cached on globalThis so dev HMR and warm Vercel lambdas reuse one pool
const g = globalThis as unknown as { _mongo?: MongoClient; _indexes?: Promise<void> }
export const client = (g._mongo ??= new MongoClient(uri))
export const db: Db = client.db(process.env.MONGODB_DB)

export const ensureIndexes = () =>
  (g._indexes ??= Promise.all([
    db.collection('tournaments').createIndex({ slug: 1 }, { unique: true }),
    db.collection('registrations').createIndex(
      { tournamentId: 1, userId: 1 },
      { unique: true, partialFilterExpression: { status: 'confirmed' } },
    ),
    db.collection('registrations').createIndex({ tournamentId: 1, createdAt: 1 }),
  ]).then(() => undefined))
