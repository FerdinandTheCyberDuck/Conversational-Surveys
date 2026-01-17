/**
 * Script to seed a test concert in Firestore
 *
 * To run this script:
 * 1. Make sure your .env.local file has the Firebase configuration
 * 2. Run: npx ts-node --esm scripts/seed-test-concert.ts
 *
 * Or you can manually add this data to Firestore through the Firebase Console:
 * 1. Go to Firebase Console > Firestore Database
 * 2. Create a collection called "concerts"
 * 3. Add a document with the structure below
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Load environment variables (you'll need to set these)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testConcert = {
  title: "Spring Symphony Concert",
  date: Timestamp.fromDate(new Date('2025-03-15T19:30:00')),
  venue: "Symphony Hall",
  organization: "City Symphony Orchestra",
  isActive: true,
  createdAt: Timestamp.now(),
  program: [
    {
      id: "piece-1",
      composer: "Ludwig van Beethoven",
      composerDates: "1770-1827",
      workTitle: "Symphony No. 5 in C minor, Op. 67",
      movements: [
        "I. Allegro con brio",
        "II. Andante con moto",
        "III. Scherzo: Allegro",
        "IV. Allegro"
      ],
      duration: 35,
      order: 1,
    },
    {
      id: "piece-2",
      composer: "Johannes Brahms",
      composerDates: "1833-1897",
      workTitle: "Violin Concerto in D major, Op. 77",
      movements: [
        "I. Allegro non troppo",
        "II. Adagio",
        "III. Allegro giocoso, ma non troppo vivace"
      ],
      duration: 40,
      soloist: "Sarah Chang, violin",
      order: 2,
    },
    {
      id: "piece-3",
      composer: "Antonín Dvořák",
      composerDates: "1841-1904",
      workTitle: "Symphony No. 9 in E minor, Op. 95 'From the New World'",
      movements: [
        "I. Adagio - Allegro molto",
        "II. Largo",
        "III. Scherzo: Molto vivace",
        "IV. Allegro con fuoco"
      ],
      duration: 45,
      order: 3,
    },
  ],
};

async function seedTestConcert() {
  try {
    const docRef = await addDoc(collection(db, 'concerts'), testConcert);
    console.log('Test concert created with ID:', docRef.id);
    console.log('\nAccess your survey at:');
    console.log(`http://localhost:3000/survey/${docRef.id}`);
  } catch (error) {
    console.error('Error creating test concert:', error);
  }
}

seedTestConcert();
