// Seed script to create initial Software Admin user
// Requires a .env file with Firebase and backend API variables (see Vite config)
// Run with: npx ts-node scripts/seed.ts

import 'dotenv/config'
import { addUser } from '../src/lib/firebase-utils.js'

async function main() {
  try {
    const userData = {
      name: 'Software Admin',
      email: 'dnapublicationscbe@gmail.com',
      mobile: '7598691689', // Used as password
      role: 'admin',
    }
    console.log('Seeding admin user...')
    await addUser(userData)
    console.log('Admin user created and welcome email sent!')
  } catch (err) {
    console.error('Seeding failed:', err)
    process.exit(1)
  }
}

main() 