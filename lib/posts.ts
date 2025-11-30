import { type Collection, WithId } from 'mongodb'
import { loadJsonFile, saveJsonFile } from './storage'
import { getDb, mongoEnabled } from './mongodb'

export interface Post {
  id: string
  title: string
  content: string
  image?: string // Image URL
  published: boolean
  createdAt: string
  updatedAt: string
}

function generateImageUrl(title: string): string {
  const keywordMap: Record<string, string> = {
    گربه: 'cat',
    سگ: 'dog',
    حیوان: 'pet',
    پت: 'pet',
    خرگوش: 'rabbit',
    پرنده: 'bird',
    ماهی: 'fish',
    همستر: 'hamster',
    خوک: 'guinea-pig',
  }

  let keyword = 'pet'
  for (const [persian, english] of Object.entries(keywordMap)) {
    if (title.includes(persian)) {
      keyword = english
      break
    }
  }
  
  return `https://source.unsplash.com/800x600/?${keyword},animal`
}

const defaultPosts: Post[] = [
  {
    id: 'post-1',
    title: 'خوش آمدید به فروشگاه حیوانات خانگی',
    content:
      'این اولین پست وبلاگ ماست. در اینجا می‌توانید مطالب مفیدی درباره نگهداری از حیوانات خانگی پیدا کنید.',
    image: 'https://source.unsplash.com/800x600/?pet,cat',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

type PostDocument = Omit<Post, 'id'> & { _id: string }

const POSTS_FILE = 'posts.json'
let postsCache: Post[] = loadJsonFile<Post[]>(POSTS_FILE, defaultPosts)

function refreshPostsFromJson() {
  postsCache = loadJsonFile<Post[]>(POSTS_FILE, defaultPosts)
}

function persistPostsToJson() {
  saveJsonFile(POSTS_FILE, postsCache)
}

function getAllPostsFromJson(): Post[] {
  refreshPostsFromJson()
  return [...postsCache].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

function getPublishedPostsFromJson(): Post[] {
  return getAllPostsFromJson().filter((post) => post.published)
}

function getPostByIdFromJson(id: string): Post | undefined {
  refreshPostsFromJson()
  return postsCache.find((post) => post.id === id)
}

function createPostInJson(
  title: string,
  content: string,
  published: boolean,
  image?: string
): Post {
  refreshPostsFromJson()
  const now = new Date().toISOString()
  const newPost: Post = {
    id: Date.now().toString(),
    title,
    content,
    image: image || generateImageUrl(title),
    published,
    createdAt: now,
    updatedAt: now,
  }

  postsCache.push(newPost)
  persistPostsToJson()
  return newPost
}

function updatePostInJson(
  id: string,
  title: string,
  content: string,
  published: boolean,
  image?: string
): Post | null {
  refreshPostsFromJson()
  const index = postsCache.findIndex((post) => post.id === id)
  if (index === -1) {
    return null
  }

  postsCache[index] = {
    ...postsCache[index],
    title,
    content,
    image: image !== undefined ? image : postsCache[index].image,
    published,
    updatedAt: new Date().toISOString(),
  }

  persistPostsToJson()
  return postsCache[index]
}

function deletePostInJson(id: string): boolean {
  refreshPostsFromJson()
  const index = postsCache.findIndex((post) => post.id === id)
  if (index === -1) {
    return false
  }

  postsCache.splice(index, 1)
  persistPostsToJson()
  return true
}

let postsCollectionPromise: Promise<Collection<PostDocument>> | null = null

async function getPostsCollection() {
  if (!postsCollectionPromise) {
    postsCollectionPromise = (async () => {
      const db = await getDb()
      const collection = db.collection<PostDocument>('posts')
      const count = await collection.estimatedDocumentCount()
      if (count === 0) {
        await collection.insertMany(
          defaultPosts.map(({ id, ...post }) => ({
            _id: id,
            ...post,
          }))
        )
      }
      return collection
    })()
  }
  return postsCollectionPromise
}

function mapPost(doc: WithId<PostDocument>): Post {
  return {
    id: doc._id,
    title: doc.title,
    content: doc.content,
    image: doc.image,
    published: doc.published,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function getAllPosts(): Promise<Post[]> {
  if (!mongoEnabled) {
    return getAllPostsFromJson()
  }

  try {
    const collection = await getPostsCollection()
    const docs = await collection.find().sort({ createdAt: -1 }).toArray()
    return docs.map(mapPost)
  } catch (error) {
    console.error('MongoDB error fetching posts, using JSON fallback:', error)
    return getAllPostsFromJson()
  }
}

export async function getPublishedPosts(): Promise<Post[]> {
  if (!mongoEnabled) {
    return getPublishedPostsFromJson()
  }

  try {
    const collection = await getPostsCollection()
    const docs = await collection
      .find({ published: true })
      .sort({ createdAt: -1 })
      .toArray()
    return docs.map(mapPost)
  } catch (error) {
    console.error('MongoDB error fetching published posts, using JSON fallback:', error)
    return getPublishedPostsFromJson()
  }
}

export async function getPostById(id: string): Promise<Post | undefined> {
  if (!mongoEnabled) {
    return getPostByIdFromJson(id)
  }

  try {
    const collection = await getPostsCollection()
    const doc = await collection.findOne({ _id: id })
    return doc ? mapPost(doc) : undefined
  } catch (error) {
    console.error('MongoDB error fetching post by id, using JSON fallback:', error)
    return getPostByIdFromJson(id)
  }
}

export async function createPost(
  title: string,
  content: string,
  published: boolean = false,
  image?: string
): Promise<Post> {
  if (!mongoEnabled) {
    return createPostInJson(title, content, published, image)
  }

  try {
    const collection = await getPostsCollection()
    const now = new Date().toISOString()
    const id = `post-${Date.now()}`
    const doc: PostDocument = {
      _id: id,
      title,
      content,
      image: image || generateImageUrl(title),
      published,
      createdAt: now,
      updatedAt: now,
    }
    await collection.insertOne(doc)
    return mapPost(doc)
  } catch (error) {
    console.error('MongoDB error creating post, using JSON fallback:', error)
    return createPostInJson(title, content, published, image)
  }
}

export async function updatePost(
  id: string,
  title: string,
  content: string,
  published: boolean,
  image?: string
): Promise<Post | null> {
  if (!mongoEnabled) {
    return updatePostInJson(id, title, content, published, image)
  }

  try {
    const collection = await getPostsCollection()
    const update: Partial<PostDocument> = {
    title,
    content,
    published,
    updatedAt: new Date().toISOString(),
    }

    if (image !== undefined) {
      update.image = image
    }

    const updatedDoc = await collection.findOneAndUpdate(
      { _id: id },
      { $set: update },
      { returnDocument: 'after' }
    )

    if (!updatedDoc) {
      return null
    }

    return mapPost(updatedDoc)
  } catch (error) {
    console.error('MongoDB error updating post, using JSON fallback:', error)
    return updatePostInJson(id, title, content, published, image)
  }
}

export async function deletePost(id: string): Promise<boolean> {
  if (!mongoEnabled) {
    return deletePostInJson(id)
  }

  try {
    const collection = await getPostsCollection()
    const result = await collection.deleteOne({ _id: id })
    return result.deletedCount === 1
  } catch (error) {
    console.error('MongoDB error deleting post, using JSON fallback:', error)
    return deletePostInJson(id)
  }
}

