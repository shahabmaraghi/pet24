import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function getDataFilePath(filename: string) {
  ensureDataDir()
  return path.join(DATA_DIR, filename)
}

export function loadJsonFile<T>(filename: string, fallback: T): T {
  const filePath = getDataFilePath(filename)

  if (!fs.existsSync(filePath)) {
    saveJsonFile(filename, fallback)
    return JSON.parse(JSON.stringify(fallback))
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch (error) {
    console.error(`Failed to read ${filename}:`, error)
    return JSON.parse(JSON.stringify(fallback))
  }
}

export function saveJsonFile<T>(filename: string, data: T) {
  const filePath = getDataFilePath(filename)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error(`Failed to save ${filename}:`, error)
  }
}

