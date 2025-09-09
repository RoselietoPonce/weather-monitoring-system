import { ref } from 'vue';
  import { auth } from '@/firebase.js';
  import { onAuthStateChanged } from 'firebase/auth';

  // A reactive object to hold the user's state
  export const user = ref(null);

  // Listen for changes in authentication state
  onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      // User is signed in.
      console.log('User state changed: Signed in', currentUser);
      user.value = currentUser;
    } else {
      // User is signed out.
      console.log('User state changed: Signed out');
      user.value = null;
    }
  });
