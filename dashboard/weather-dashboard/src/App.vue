<script setup>
  import Navbar from './components/Navbar.vue';
  </script>

  <template>
    <div class="bg-gray-100 min-h-screen">
      <Navbar />
      <main>
        <RouterView />
      </main>
    </div>
  </template>
