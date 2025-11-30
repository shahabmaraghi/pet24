import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
export const mongoEnabled = Boolean(uri)

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const dbName = process.env.MONGODB_DB || 'pet24'

let client: MongoClient
let clientPromise: Promise<MongoClient> | undefined

function getClientPromise() {
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not configured.')
  }

  if (clientPromise) {
    return clientPromise
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri)
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    client = new MongoClient(uri)
    clientPromise = client.connect()
  }

  return clientPromise
}

export async function getDb() {
  if (!mongoEnabled) {
    throw new Error('MongoDB is not enabled. Please set MONGODB_URI.')
  }

  const connectedClient = await getClientPromise()
  return connectedClient.db(dbName)
}




