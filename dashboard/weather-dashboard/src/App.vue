<script setup>
  import Navbar from './components/Navbar.vue';
  import { user } from '@/user.js'; // Import our user state
  </script>

  <template>
    <div class="bg-gray-100 min-h-screen">
      <!-- Use v-if to only show Navbar if a user is logged in -->
      <Navbar v-if="user" />
      <main>
        <RouterView />
      </main>
    </div>
  </template>
