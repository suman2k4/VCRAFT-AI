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

// Get user's pitch history
export const getUserPitches = async (userId) => {
  try {
    const q = query(
      collection(db, 'pitches'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(20)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
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
