import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const sampleJobs = [
  {
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "New York, NY",
    type: "Full-time",
    salary: "$120,000 - $150,000",
    experience: "5+ years",
    description: "We're looking for a Senior Software Engineer to join our growing team. You'll be responsible for developing and maintaining our web applications, working with modern technologies like React, Node.js, and Firebase.",
    requirements: "• 5+ years of experience in software development\n• Strong knowledge of JavaScript/TypeScript\n• Experience with React, Node.js, and Firebase\n• Excellent problem-solving skills\n• Strong communication skills",
    benefits: "• Competitive salary and equity\n• Health, dental, and vision insurance\n• Flexible work hours and remote work options\n• Professional development budget\n• Unlimited PTO",
    status: "active",
    questions: [
      {
        id: "1",
        text: "Tell us about a challenging project you've worked on and how you overcame the obstacles.",
        required: true
      },
      {
        id: "2", 
        text: "What's your experience with React and TypeScript?",
        required: true
      },
      {
        id: "3",
        text: "How do you stay updated with the latest technologies?",
        required: false
      }
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    title: "Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    salary: "$80,000 - $100,000",
    experience: "3-5 years",
    description: "Join our marketing team as a Marketing Manager. You'll be responsible for developing and executing marketing strategies, managing campaigns, and driving growth for our publishing platform.",
    requirements: "• 3-5 years of experience in digital marketing\n• Experience with content marketing and social media\n• Strong analytical skills\n• Experience with marketing automation tools\n• Excellent written and verbal communication",
    benefits: "• Competitive salary\n• Health insurance\n• Remote work flexibility\n• Professional development opportunities\n• Performance bonuses",
    status: "active",
    questions: [
      {
        id: "1",
        text: "Describe a successful marketing campaign you've managed.",
        required: true
      },
      {
        id: "2",
        text: "How do you measure the success of marketing campaigns?",
        required: true
      }
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    title: "Content Editor",
    department: "Content",
    location: "Los Angeles, CA",
    type: "Part-time",
    salary: "$50,000 - $70,000",
    experience: "2-4 years",
    description: "We're seeking a talented Content Editor to help us maintain high-quality content standards. You'll review and edit manuscripts, work with authors, and ensure our publications meet our quality standards.",
    requirements: "• 2-4 years of editing experience\n• Strong command of English grammar and style\n• Experience with publishing or content creation\n• Attention to detail\n• Ability to work with diverse content types",
    benefits: "• Flexible schedule\n• Health benefits\n• Professional development\n• Creative work environment",
    status: "active",
    questions: [
      {
        id: "1",
        text: "What's your editing process for a new manuscript?",
        required: true
      },
      {
        id: "2",
        text: "How do you handle conflicting feedback from multiple stakeholders?",
        required: false
      }
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    title: "UX/UI Designer",
    department: "Design",
    location: "San Francisco, CA",
    type: "Contract",
    salary: "$90,000 - $120,000",
    experience: "3+ years",
    description: "We're looking for a UX/UI Designer to help us create beautiful and intuitive user experiences for our publishing platform. You'll work closely with our product and engineering teams.",
    requirements: "• 3+ years of UX/UI design experience\n• Proficiency in Figma, Sketch, or similar tools\n• Strong portfolio demonstrating user-centered design\n• Experience with design systems\n• Understanding of web accessibility standards",
    benefits: "• Competitive contract rate\n• Flexible work arrangement\n• Opportunity for full-time conversion\n• Work with cutting-edge technology",
    status: "active",
    questions: [
      {
        id: "1",
        text: "Walk us through your design process for a new feature.",
        required: true
      },
      {
        id: "2",
        text: "How do you approach user research and testing?",
        required: true
      }
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
]

async function seedCareers() {
  try {
    console.log('🌱 Seeding careers data...')
    
    for (const job of sampleJobs) {
      await addDoc(collection(db, 'jobs'), job)
      console.log(`✅ Added job: ${job.title}`)
    }
    
    console.log('🎉 Careers seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding careers data:', error)
  }
}

seedCareers() 