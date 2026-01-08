<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n'; // ← ADD THIS

const { t } = useI18n(); // ← ADD THIS LINE

// Reactive states
const email = ref('');  // Set this via props or route params
const verificationCode = ref('');
const alertMessage = ref('');
const alertType = ref(''); // 'error' or 'success'
const loading = ref(false);

// Show and hide loading spinner
const showSpinner = () => {
  loading.value = true;
};
const hideSpinner = () => {
  loading.value = false;
};

// Verify email function
const verifyEmail = async () => {
  showSpinner();
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.value, code: verificationCode.value })
    });

    // Response handling based on the HTTP status
    if (!response.ok) {
      const errorData = await response.json();
      showAlert(errorData.error); // Show the error message based on the response
      hideSpinner();
      return;
    }

    const data = await response.json();
    hideSpinner();

    if (data.success) {
      window.location.href = '/verifysuccessful';
    } else {
      showAlert(data.error);
    }
  } catch (error) {
    hideSpinner();
    showAlert('An error occurred: ' + error.message);
  }
};

// Resend code function
const resendCode = async () => {
   showSpinner();
  
  if (!email.value) {
    hideSpinner();
    alert(t('emailNotSet'));
    return;
  }

  console.log('Email to resend:', email.value); // Log for debugging

  try {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.value })
    });

    if (!response.ok) {
      throw new Error('Failed to resend verification code.');
    }

    const data = await response.json();
    hideSpinner();
    alert(t('resendSuccess', { email: data.email }));
  } catch (error) {
    hideSpinner();
    alert(error.message || t('resendFailed'));
  }
};

// Show alert message
const showAlert = (message) => {
  alertMessage.value = message;
  alertType.value = 'error';
  setTimeout(() => {
    alertMessage.value = ''; // Clear alert after some time if needed
  }, 5000);
};

// Mount the component
const route = useRoute();
onMounted(() => {
  email.value = route.params.email ? route.params.email : ''; // Check if it exists
  console.log('Email from route:', email.value); // Log the value
});
</script>

<template>
  <div class="content">
    <h2 class="text-center">{{ $t('verifyEmailTitle') }}</h2>
    <p class="text-center">
      {{ $t('verifyEmailText1') }}
    </p>
    <p class="text-center">{{ $t('verifyEmailText2') }}</p>

    <form @submit.prevent="verifyEmail" id="verifyForm">
      <input type="hidden" name="email" :value="email">
      <div class="mb-3 d-flex align-items-center">
        <input 
          type="text"
          v-model="verificationCode"
          class="form-control me-2"
          required
          placeholder="Verification Code"
        />
        <button type="button" class="btn btn-secondary" @click="resendCode">{{ $t('resendButton') }}</button>
      </div>
      <div class="text-center"> 
        <button type="submit" class="btn btn-primary">{{ $t('submitButton') }}</button>
      </div>
    </form>
    
    <div v-if="alertMessage" id="alertPlaceholder" class="text-center mt-3">
      <span :class="{'text-danger': alertType === 'error', 'text-success': alertType === 'success'}">
        {{ alertMessage }}
      </span>
    </div>

    <div v-if="loading" class="spinner-border text-primary spinner" role="status">
      <span class="visually-hidden">{{ $t('loading') }}</span>
    </div>
  </div>
</template>
<style scoped>
  .content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
            max-width: 500px; /* Limit maximum width */
            margin: 10% auto; /* Center vertically and horizontally */
            padding: 20px;
            background: white; /* Optional: add a background color */
            border-radius: 8px; /* Optional: rounded corners */
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Optional: shadow */
        }
        .form-control {
            flex-grow: 1; /* Allow input to grow */
        }
        .spinner {
            display: none; /* Hidden by default */
        }
</style>