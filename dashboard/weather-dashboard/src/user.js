import { ref } from 'vue'
import { auth } from '@/firebase.js'
import { onAuthStateChanged } from 'firebase/auth'

// A reactive object to hold the user's state
export const user = ref(null)

// NEW: A ref to track when the initial auth check is complete
export const isAuthReady = ref(false)

// Listen for changes in authentication state
onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    // User is signed in.
    console.log('User state changed: Signed in', currentUser)
    user.value = currentUser
  } else {
    // User is signed out.
    console.log('User state changed: Signed out')
    user.value = null
  }

  // NEW: Set auth as ready after the first check has completed
  if (!isAuthReady.value) {
    isAuthReady.value = true
  }
})

// Note: In a global file like this, you typically don't need to call unsubscribe.
// The listener should be active for the entire lifecycle of the application.
