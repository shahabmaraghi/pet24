// User management with file-based persistence
// In production, you would use a real database like PostgreSQL, MongoDB, etc.

import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // hashed
  role: 'user' | 'admin';
  createdAt: string;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(USERS_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load users from file
function loadUsers(): User[] {
  ensureDataDir()
  if (!fs.existsSync(USERS_FILE)) {
    // Create default admin user if file doesn't exist
    const defaultUsers: User[] = [
      {
        id: "1",
        email: "admin@example.com".toLowerCase().trim(),
        name: "مدیر سیستم",
        password: bcrypt.hashSync("admin123", 10),
        role: "admin",
        createdAt: new Date().toISOString(),
      },
    ]
    saveUsers(defaultUsers)
    return defaultUsers
  }

  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

// Save users to file
function saveUsers(users: User[]) {
  ensureDataDir()
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving users:', error)
  }
}

// Initialize users array
let users: User[] = loadUsers()

export async function getUserByEmail(email: string): Promise<User | undefined> {
  // Reload users from file to get latest data
  users = loadUsers()
  const normalizedEmail = email.toLowerCase().trim();
  return users.find(user => user.email.toLowerCase().trim() === normalizedEmail);
}

export async function getUserById(id: string): Promise<User | undefined> {
  // Reload users from file to get latest data
  users = loadUsers()
  return users.find(user => user.id === id);
}

export function getAllUsers(): User[] {
  // Reload users from file to get latest data
  users = loadUsers()
  return users.map(user => ({
    ...user,
    password: '***hidden***', // Don't expose passwords
  }));
}

export async function createUser(
  email: string,
  name: string,
  password: string,
  role: 'user' | 'admin' = 'user'
): Promise<User> {
  // Reload users from file to get latest data
  users = loadUsers()
  
  // Normalize email before checking/storing
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if user already exists
  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error('کاربری با این ایمیل قبلاً ثبت نام کرده است');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: Date.now().toString(),
    email: normalizedEmail, // Store normalized email
    name: name.trim(),
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users) // Save to file
  return newUser;
}

export async function verifyPassword(
  email: string,
  password: string
): Promise<User | null> {
  // Reload users from file to get latest data
  users = loadUsers()
  
  // Email is already normalized in getUserByEmail, but normalize here too for safety
  const normalizedEmail = email.toLowerCase().trim();
  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    console.log('User not found:', normalizedEmail);
    console.log('Available users:', users.map(u => u.email));
    return null;
  }

  console.log('User found, comparing password...');
  const isValid = await bcrypt.compare(password, user.password);
  console.log('Password comparison result:', isValid);
  if (!isValid) {
    return null;
  }

  return user;
}
