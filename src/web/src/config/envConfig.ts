// src/web/src/config/envConfig.ts
let API_PORT

if (process.env.NODE_ENV === 'test') {
  console.log('***INSIDE A TEST***')
  API_PORT = process.env.VITE_API_PORT || '3000'
} else {
  console.log('***INSIDE VITE***')
  // Use import.meta.env for normal application runtime
  API_PORT = import.meta.env.VITE_API_PORT || '3000'
}

console.log('***API_PORT***', API_PORT)

export { API_PORT }
