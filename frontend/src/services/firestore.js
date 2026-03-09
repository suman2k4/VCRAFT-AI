import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'

// Save pitch analysis to Firestore
export const savePitchAnalysis = async (userId, pitchData, analysisResult) => {
  try {
    const docRef = await addDoc(collection(db, 'pitches'), {
      user_id: userId,
      startup_idea: pitchData.startup_idea,
      industry: pitchData.industry,
      investor_stage: pitchData.investor_stage,
      investor_persona: pitchData.investor_persona,
      analysis_result: analysisResult,
      created_at: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving pitch:', error)
    throw error
  }
}

// Get user's pitch history (paginated, server-side)
// Returns { pitches, lastDoc } where lastDoc can be passed for the next page.
export const getUserPitches = async (userId, pageSize = 20, lastDocument = null) => {
  try {
    const constraints = [
      collection(db, 'pitches'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(pageSize),
    ]

    // If we have a cursor from a previous page, start after it
    if (lastDocument) {
      constraints.splice(3, 0, startAfter(lastDocument))
    }

    const q = query(...constraints)
    const querySnapshot = await getDocs(q)

    const pitches = querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }))

    // Return the last document snapshot for cursor-based pagination
    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null

    return { pitches, lastDoc }
  } catch (error) {
    // Firestore composite-index errors — fallback to simple query with client-side sort
    if (error.code === 'failed-precondition') {
      console.warn(
        'Firestore composite index not found — falling back to client-side sorting.',
        'Create the index for better performance:',
        error.message,
      )

      // Fallback: query without orderBy, then sort client-side
      const fallbackConstraints = [
        collection(db, 'pitches'),
        where('user_id', '==', userId),
        limit(pageSize),
      ]

      if (lastDocument) {
        fallbackConstraints.splice(2, 0, startAfter(lastDocument))
      }

      const fallbackQuery = query(...fallbackConstraints)
      const fallbackSnapshot = await getDocs(fallbackQuery)

      const pitches = fallbackSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const timeA = a.created_at?.seconds || 0
          const timeB = b.created_at?.seconds || 0
          return timeB - timeA  // descending
        })

      const lastDoc = fallbackSnapshot.docs[fallbackSnapshot.docs.length - 1] || null
      return { pitches, lastDoc }
    }

    console.error('Error fetching pitches:', error)
    throw error
  }
}

// Get single pitch analysis
export const getPitchAnalysis = async (pitchId) => {
  try {
    const docRef = doc(db, 'pitches', pitchId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      }
    } else {
      throw new Error('Pitch not found')
    }
  } catch (error) {
    console.error('Error fetching pitch:', error)
    throw error
  }
}

// Save Q&A session
export const saveQASession = async (pitchId, questions, answers) => {
  try {
    const docRef = await addDoc(collection(db, 'qa_sessions'), {
      pitch_id: pitchId,
      questions: questions,
      answers: answers,
      created_at: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving Q&A session:', error)
    throw error
  }
}

// Get Q&A sessions for a pitch
export const getQASessions = async (pitchId) => {
  try {
    const q = query(
      collection(db, 'qa_sessions'),
      where('pitch_id', '==', pitchId),
      orderBy('created_at', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    // Fallback for missing composite index
    if (error.code === 'failed-precondition') {
      console.warn('Firestore index missing for qa_sessions — using client-side sort')
      const fallbackQ = query(
        collection(db, 'qa_sessions'),
        where('pitch_id', '==', pitchId)
      )
      const snap = await getDocs(fallbackQ)
      return snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))
    }
    console.error('Error fetching Q&A sessions:', error)
    throw error
  }
}

// Create or update user profile
export const saveUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, {
      ...userData,
      updated_at: Timestamp.now(),
    }, { merge: true })
  } catch (error) {
    console.error('Error saving user profile:', error)
    throw error
  }
}
