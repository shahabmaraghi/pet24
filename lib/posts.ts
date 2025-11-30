import { loadJsonFile, saveJsonFile } from './storage'

// Simple file-based persistence for blog posts.

export interface Post {
  id: string;
  title: string;
  content: string;
  image?: string; // Image URL
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper function to generate image URL based on post title
function generateImageUrl(title: string): string {
  // Map Persian keywords to English for Unsplash
  const keywordMap: { [key: string]: string } = {
    'گربه': 'cat',
    'سگ': 'dog',
    'حیوان': 'pet',
    'پت': 'pet',
    'خرگوش': 'rabbit',
    'پرنده': 'bird',
    'ماهی': 'fish',
    'همستر': 'hamster',
    'خوک': 'guinea-pig',
  }
  
  // Find matching keyword
  let keyword = 'pet'
  for (const [persian, english] of Object.entries(keywordMap)) {
    if (title.includes(persian)) {
      keyword = english
      break
    }
  }
  
  // Using Unsplash Source API for pet images
  return `https://source.unsplash.com/800x600/?${keyword},animal`
}

const POSTS_FILE = 'posts.json'

const defaultPosts: Post[] = [
  {
    id: "1",
    title: "خوش آمدید به فروشگاه حیوانات خانگی",
    content: "این اولین پست وبلاگ ماست. در اینجا می‌توانید مطالب مفیدی درباره نگهداری از حیوانات خانگی پیدا کنید.",
    image: "https://source.unsplash.com/800x600/?pet,cat",
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

let posts: Post[] = loadJsonFile<Post[]>(POSTS_FILE, defaultPosts)

function refreshPosts() {
  posts = loadJsonFile<Post[]>(POSTS_FILE, defaultPosts)
}

function persistPosts() {
  saveJsonFile(POSTS_FILE, posts)
}

export function getAllPosts(): Post[] {
  refreshPosts()
  return [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getPublishedPosts(): Post[] {
  return getAllPosts().filter((post) => post.published)
}

export function getPostById(id: string): Post | undefined {
  refreshPosts()
  return posts.find((post) => post.id === id)
}

export function createPost(title: string, content: string, published: boolean = false, image?: string): Post {
  refreshPosts()
  const newPost: Post = {
    id: Date.now().toString(),
    title,
    content,
    image: image || generateImageUrl(title),
    published,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  posts.push(newPost);
  persistPosts()
  return newPost;
}

export function updatePost(id: string, title: string, content: string, published: boolean, image?: string): Post | null {
  refreshPosts()
  const postIndex = posts.findIndex(post => post.id === id);
  if (postIndex === -1) return null;
  
  posts[postIndex] = {
    ...posts[postIndex],
    title,
    content,
    image: image !== undefined ? image : posts[postIndex].image,
    published,
    updatedAt: new Date().toISOString(),
  };
  persistPosts()
  return posts[postIndex];
}

export function deletePost(id: string): boolean {
  refreshPosts()
  const postIndex = posts.findIndex(post => post.id === id);
  if (postIndex === -1) return false;
  posts.splice(postIndex, 1);
  persistPosts()
  return true;
}

