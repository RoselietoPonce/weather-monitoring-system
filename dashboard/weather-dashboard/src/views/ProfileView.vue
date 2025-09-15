<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-full">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">User Profile & Settings</h1>
        <p class="text-gray-600 mt-1">
          Manage your account details and application preferences.
        </p>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="text-center p-12 bg-white rounded-2xl shadow-md"
      >
        <p class="text-gray-500">Loading your profile...</p>
      </div>

      <!-- Profile Content -->
      <div v-else class="max-w-3xl mx-auto">
        <div class="space-y-8">
          <!-- Profile Information Card -->
          <div class="bg-white rounded-2xl shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-6">
              Profile Information
            </h2>

            <!-- Avatar Display Only -->
            <div class="flex items-center pb-6 mb-6 border-b border-gray-200">
              <div class="relative">
                <img
                  v-if="profile.photoURL"
                  :src="profile.photoURL"
                  alt="Profile Avatar"
                  class="w-20 h-20 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold flex-shrink-0"
                >
                  {{ avatarInitials }}
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >Email Address</label
                >
                <input
                  type="email"
                  :value="user?.email"
                  disabled
                  class="mt-1 w-full bg-gray-100 border-gray-300 rounded-lg shadow-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label
                  for="displayName"
                  class="block text-sm font-medium text-gray-700"
                  >Display Name</label
                >
                <input
                  type="text"
                  id="displayName"
                  v-model="profile.displayName"
                  placeholder="e.g., Juan Dela Cruz"
                  class="mt-1 w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  for="location"
                  class="block text-sm font-medium text-gray-700"
                  >Location</label
                >
                <input
                  type="text"
                  id="location"
                  v-model="profile.location"
                  placeholder="e.g., Manila, Philippines"
                  class="mt-1 w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p class="text-xs text-gray-500 mt-1">
                  This helps in providing more localized recommendations.
                </p>
              </div>
            </div>
          </div>

          <!-- Application Preferences Card -->
          <div class="bg-white rounded-2xl shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-6">Preferences</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700"
                  >Email Notifications</span
                >
                <button
                  @click="profile.emailNotifications = !profile.emailNotifications"
                  :class="profile.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                >
                  <span
                    :class="profile.emailNotifications ? 'translate-x-6' : 'translate-x-1'"
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Save Action -->
          <div class="flex items-center justify-end gap-4 pt-4">
            <p
              v-if="saveStatus"
              class="text-sm"
              :class="saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'"
            >
              {{ saveStatus }}
            </p>
            <button
              @click="saveProfile"
              :disabled="isSaving"
              class="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
            >
              <span v-if="isSaving">Saving...</span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { auth, db } from "@/firebase.js";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const router = useRouter();

// Reactive state
const user = ref(null);
const profile = ref({
  displayName: "",
  location: "",
  emailNotifications: true,
  photoURL: "",
});
const isLoading = ref(true);
const isSaving = ref(false);
const saveStatus = ref("");

// Avatar initials
const avatarInitials = computed(() => {
  const name = profile.value.displayName || user.value?.email || "";
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?"
  );
});

let unsubscribe = null;
onMounted(() => {
  unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      user.value = currentUser;
      await fetchUserProfile(currentUser.uid);
    } else {
      router.push("/login");
    }
    isLoading.value = false;
  });
});

onUnmounted(() => {
  unsubscribe?.();
});

const fetchUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      profile.value = { ...profile.value, ...docSnap.data() };
    } else {
      profile.value.displayName = user.value?.displayName || "";
      profile.value.photoURL = user.value?.photoURL || "";
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    saveStatus.value = "Error: Could not load profile.";
  }
};

const saveProfile = async () => {
  if (!user.value) return;

  if (!profile.value.displayName.trim()) {
    saveStatus.value = "Error: Display name cannot be empty.";
    return;
  }

  isSaving.value = true;
  saveStatus.value = "";
  try {
    if (auth.currentUser.displayName !== profile.value.displayName) {
      await updateProfile(auth.currentUser, {
        displayName: profile.value.displayName,
      });
    }

    const { displayName, location, emailNotifications } = profile.value;
    const userDocRef = doc(db, "users", user.value.uid);
    await setDoc(
      userDocRef,
      { displayName, location, emailNotifications },
      { merge: true }
    );

    saveStatus.value = "Profile saved successfully!";
  } catch (error) {
    console.error("Error saving user profile:", error);
    saveStatus.value = "Error: Could not save profile.";
  } finally {
    isSaving.value = false;
    setTimeout(() => (saveStatus.value = ""), 3000);
  }
};
</script>
