<template>
  <div class="font-sans text-text-main p-4 sm:p-6 lg:p-8">
    <div class="max-w-4xl mx-auto bg-surface rounded-2xl shadow-md p-6 sm:p-8">
      <h1 class="text-3xl font-bold mb-4">Terms of Service</h1>
      <p class="text-text-light mb-6">Last updated: {{ new Date().toLocaleDateString() }}</p>

      <div class="space-y-4 prose dark:prose-invert max-w-none">
        <p>
          This is a placeholder for your Terms of Service. You should replace this content with your
          own terms, outlining the rules and regulations for the use of your application.
        </p>

        <h2 class="text-xl font-semibold pt-4">1. Acceptance of Terms</h2>
        <p>
          By accessing and using our service, you accept and agree to be bound by the terms and
          provision of this agreement.
        </p>

        <h2 class="text-xl font-semibold pt-4">2. User Conduct</h2>
        <p>
          You agree not to use the service for any unlawful purpose or any purpose prohibited under
          this clause. You agree not to use the service in any way that could damage the service,
          the servers, or the general network.
        </p>

        <h2 class="text-xl font-semibold pt-4">3. Disclaimer of Liability</h2>
        <p>
          The service is provided "as is". We are not responsible for any damages, including but not
          limited to, direct, indirect, special, incidental or consequential damages or other losses
          arising out of the use of or inability to use the service.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// No script logic needed for this simple page
</script>
