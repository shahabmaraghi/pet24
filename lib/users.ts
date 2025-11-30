// User management with file-based persistence
// In production, you would use a real database like PostgreSQL, MongoDB, etc.

import bcrypt from 'bcryptjs'
import { type Collection, WithId } from 'mongodb'
import { loadJsonFile, saveJsonFile } from './storage'
import { getDb, mongoEnabled } from './mongodb'

export interface User {
  id: string
  email: string
  name: string
  password: string // hashed
  role: 'user' | 'admin'
  createdAt: string
}

type UserDocument = Omit<User, 'id'> & { _id: string }

    const defaultUsers: User[] = [
      {
    id: 'admin-default',
    email: 'admin@example.com'.toLowerCase().trim(),
    name: 'مدیر سیستم',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
        createdAt: new Date().toISOString(),
      },
    ]

const USERS_FILE = 'users.json'
let usersCache: User[] = loadJsonFile<User[]>(USERS_FILE, defaultUsers)

function refreshUsersFromJson() {
  usersCache = loadJsonFile<User[]>(USERS_FILE, defaultUsers)
}

function persistUsersToJson() {
  saveJsonFile(USERS_FILE, usersCache)
}

function getUserByEmailFromJson(email: string): User | undefined {
  refreshUsersFromJson()
  const normalizedEmail = email.toLowerCase().trim()
  return usersCache.find((user) => user.email.toLowerCase().trim() === normalizedEmail)
}

function getUserByIdFromJson(id: string): User | undefined {
  refreshUsersFromJson()
  return usersCache.find((user) => user.id === id)
}

function getAllUsersFromJson(): User[] {
  refreshUsersFromJson()
  return usersCache.map((user) => ({
    ...user,
    password: '***hidden***',
  }))
}

async function createUserInJson(
  email: string,
  name: string,
  password: string,
  role: 'user' | 'admin'
): Promise<User> {
  refreshUsersFromJson()
  const normalizedEmail = email.toLowerCase().trim()
  if (getUserByEmailFromJson(normalizedEmail)) {
    throw new Error('کاربری با این ایمیل قبلاً ثبت نام کرده است')
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const now = new Date().toISOString()
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    name: name.trim(),
    password: hashedPassword,
    role,
    createdAt: now,
  }

  usersCache.push(newUser)
  persistUsersToJson()
  return newUser
}

async function verifyPasswordInJson(email: string, password: string): Promise<User | null> {
  const user = getUserByEmailFromJson(email)
  if (!user) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.password)
  return isValid ? user : null
}

let usersCollectionPromise: Promise<Collection<UserDocument>> | null = null

async function getUsersCollection() {
  if (!usersCollectionPromise) {
    usersCollectionPromise = (async () => {
      const db = await getDb()
      const collection = db.collection<UserDocument>('users')
      await collection.createIndex({ email: 1 }, { unique: true })

      const adminEmail = defaultUsers[0].email
      const existingAdmin = await collection.findOne({ email: adminEmail })
      if (!existingAdmin) {
        await collection.insertOne({
          _id: defaultUsers[0].id,
          email: adminEmail,
          name: defaultUsers[0].name,
          password: defaultUsers[0].password,
          role: defaultUsers[0].role,
          createdAt: defaultUsers[0].createdAt,
        })
      }

      return collection
    })()
  }

  return usersCollectionPromise
}

function mapUser(doc: WithId<UserDocument>): User {
  return {
    id: doc._id,
    email: doc.email,
    name: doc.name,
    password: doc.password,
    role: doc.role,
    createdAt: doc.createdAt,
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (!mongoEnabled) {
    return getUserByEmailFromJson(email)
  }

  try {
    const normalizedEmail = email.toLowerCase().trim()
    const collection = await getUsersCollection()
    const doc = await collection.findOne({ email: normalizedEmail })
    return doc ? mapUser(doc) : undefined
  } catch (error) {
    console.error('MongoDB error fetching user by email, using JSON fallback:', error)
    return getUserByEmailFromJson(email)
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (!mongoEnabled) {
    return getUserByIdFromJson(id)
  }

  try {
    const collection = await getUsersCollection()
    const doc = await collection.findOne({ _id: id })
    return doc ? mapUser(doc) : undefined
  } catch (error) {
    console.error('MongoDB error fetching user by id, using JSON fallback:', error)
    return getUserByIdFromJson(id)
  }
}

export async function getAllUsers(): Promise<User[]> {
  if (!mongoEnabled) {
    return getAllUsersFromJson()
  }

  try {
    const collection = await getUsersCollection()
    const docs = await collection.find().sort({ createdAt: -1 }).toArray()
    return docs.map((doc) => ({
      ...mapUser(doc),
      password: '***hidden***',
    }))
  } catch (error) {
    console.error('MongoDB error fetching users, using JSON fallback:', error)
    return getAllUsersFromJson()
  }
}

export async function createUser(
  email: string,
  name: string,
  password: string,
  role: 'user' | 'admin' = 'user'
): Promise<User> {
  if (!mongoEnabled) {
    return createUserInJson(email, name, password, role)
  }
  
  try {
    const collection = await getUsersCollection()
    const normalizedEmail = email.toLowerCase().trim()
  
    const existingUser = await collection.findOne({ email: normalizedEmail })
  if (existingUser) {
      throw new Error('کاربری با این ایمیل قبلاً ثبت نام کرده است')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const now = new Date().toISOString()
    const id = `user-${Date.now()}`
    const newDoc: UserDocument = {
      _id: id,
      email: normalizedEmail,
    name: name.trim(),
    password: hashedPassword,
    role,
      createdAt: now,
    }

    await collection.insertOne(newDoc)
    return mapUser(newDoc)
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new Error('کاربری با این ایمیل قبلاً ثبت نام کرده است')
    }
    console.error('MongoDB error creating user, using JSON fallback:', error)
    return createUserInJson(email, name, password, role)
  }
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  if (!mongoEnabled) {
    return verifyPasswordInJson(email.toLowerCase().trim(), password)
  }

  const normalizedEmail = email.toLowerCase().trim()
  const user = await getUserByEmail(normalizedEmail)

  if (!user) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return null
  }

  return user
}

