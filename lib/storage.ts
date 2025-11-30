import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')
const CAN_WRITE =
  process.env.DATA_PERSIST === 'true' || process.env.NODE_ENV !== 'production'

function ensureDataDir() {
  if (!CAN_WRITE) {
    return
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
  } catch (error) {
    console.warn('Unable to create data directory, continuing in read-only mode:', error)
  }
}

export function getDataFilePath(filename: string) {
  ensureDataDir()
  return path.join(DATA_DIR, filename)
}

export function loadJsonFile<T>(filename: string, fallback: T): T {
  const filePath = getDataFilePath(filename)

  if (!fs.existsSync(filePath)) {
    if (CAN_WRITE) {
      saveJsonFile(filename, fallback)
    }
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
  if (!CAN_WRITE) {
    return
  }

  const filePath = getDataFilePath(filename)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error(`Failed to save ${filename}:`, error)
  }
}

