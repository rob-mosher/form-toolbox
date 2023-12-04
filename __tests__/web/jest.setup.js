console.log('************ jest.setup.js ************')
import dotenv from 'dotenv';
dotenv.config('../../.env');
process.env.VITE_API_PORT = process.env.VITE_API_PORT || '3000';
console.log('process.env.VITE_API_PORT', process.env.VITE_API_PORT)
console.log('process.env.NODE_ENV', process.env.NODE_ENV)