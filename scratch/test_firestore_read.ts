import { firestoreDb } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

(async () => {
  try {
    const userRef = doc(firestoreDb, 'users', 'usr_admin_001');
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      console.log('User fetched:', snap.data());
    } else {
      console.log('User not found');
    }
  } catch (e) {
    console.error('Error during Firestore read:', e);
  }
})();
