<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const email = ref('');
const securityAnswer = ref('');
const password = ref('');
const passwordConfirm = ref('');
const loading = ref(false);
const securityError = ref(false);
const securityFeedback = ref('');
const passwordVisible = ref(false);
const passwordConfirmVisible = ref(false);
const securityQuestion = ref('');

const passwordRequirements = ref({
  length: false,
  upper: false,
  lower: false,
  number: false,
  symbol: false
});

// Toggle password visibility
const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value;
};
const togglePasswordConfirmVisibility = () => {
  passwordConfirmVisible.value = !passwordConfirmVisible.value;
};

// Validate password requirements
const validatePassword = () => {
  const p = password.value;
  passwordRequirements.value.length = p.length >= 8;
  passwordRequirements.value.upper = /[A-Z]/.test(p);
  passwordRequirements.value.lower = /[a-z]/.test(p);
  passwordRequirements.value.number = /\d/.test(p);
  passwordRequirements.value.symbol = /[\W_]/.test(p);
};

// Validate password match
const passwordMismatch = computed(() => password.value !== passwordConfirm.value);
const isSubmitDisabled = computed(
  () =>
    passwordMismatch.value ||
    !passwordRequirements.value.length ||
    !passwordRequirements.value.upper ||
    !passwordRequirements.value.lower ||
    !passwordRequirements.value.number ||
    !passwordRequirements.value.symbol ||
    loading.value
);

// Validate the security answer
const validateSecurityAnswer = async () => {
  loading.value = true;
  securityError.value = false;
  securityFeedback.value = '';

  try {
    const response = await fetch('/api/users/validate-security-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, securityans: securityAnswer.value })
    });

    if (response.status === 200) {
      securityError.value = false;
      securityFeedback.value = 'Correct answer.';
    } else if (response.status === 403) {
      securityError.value = true;
      securityFeedback.value = 'Incorrect answer. Please try again.';
    } else {
      securityError.value = true;
      securityFeedback.value = 'Server error validating answer.';
    }
  } catch (error) {
    console.error('Error validating security answer:', error);
    securityError.value = true;
    securityFeedback.value = 'Error validating security answer.';
  } finally {
    loading.value = false;
  }
};

// Fetch the security question based on the email
const fetchSecurityQuestion = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/users/get-security-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    });

    if (response.ok) {
      const data = await response.json();
      securityQuestion.value = data.securityQuestion;
      securityAnswer.value = '';
    } else {
      securityFeedback.value = 'Unable to fetch security question. Please try again.';
      securityQuestion.value = '';
    }
  } catch (error) {
    console.error('Error fetching security question:', error);
    securityFeedback.value = 'Error fetching security question.';
    securityQuestion.value = '';
  } finally {
    loading.value = false;
  }
};

// Handle form submission
const handleSubmit = async () => {
  console.log('Submitting form…');
  if (isSubmitDisabled.value) {
    console.log('Submit blocked by validation');
    return;
  }
  loading.value = true;

  try {
    const response = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    });

    const data = await response.json().catch(() => ({}));
    console.log('Response:', response.status, data);

    if (response.ok) {
      alert(data.message || 'Password updated successfully!');
      router.push('/login');
    } else {
      alert(data.error || 'Failed to update password.');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    loading.value = false;
  }
};

</script>

<template>
  <div class="container mt-4">
    <h1 class="mb-4">Forgot Password</h1>
    <form @submit.prevent="handleSubmit" id="forgot-password-form" class="row g-3">
      <!-- Email -->
      <div class="col-md-6">
        <label for="fp-email" class="form-label">Email</label>
        <input
          type="email"
          class="form-control"
          id="fp-email"
          v-model="email"
          @blur="fetchSecurityQuestion"
          required
        />
        <div v-if="securityFeedback" class="invalid-feedback">{{ securityFeedback }}</div>
      </div>

      <!-- Security question + answer -->
      <div class="row g-3 w-100">
        <div v-if="securityQuestion" class="col-md-6">
          <label class="form-label">Security Question</label>
          <h5>{{ securityQuestion }}</h5>
        </div>
        <div class="col-md-6">
          <label for="fp-securityans" class="form-label">Security Answer</label>
          <input
            type="text"
            class="form-control"
            :class="{ 'is-invalid': securityError && !loading && securityAnswer }"
            id="fp-securityans"
            v-model="securityAnswer"
            @blur="validateSecurityAnswer"
            required
          />
          <div v-if="securityError && !loading && securityAnswer" class="invalid-feedback">
            {{ securityFeedback }}
          </div>
          <div v-if="loading" class="loading">Checking...</div>
        </div>
      </div>

      <!-- Password + confirm password -->
      <div class="row g-3 w-100">
        <div class="col-md-6">
          <label for="fp-password" class="form-label">Password</label>
          <div class="input-group">
            <input
              :type="passwordVisible ? 'text' : 'password'"
              class="form-control"
              id="fp-password"
              v-model="password"
              @input="validatePassword"
              required
            />
            <button type="button" class="btn btn-outline-secondary" @click="togglePasswordVisibility">
              <i :class="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
          <ul class="list-unstyled small mt-2" aria-live="polite">
            <li :class="passwordRequirements.length ? 'text-success' : 'text-muted'">
              <i :class="passwordRequirements.length ? 'bi bi-check-circle-fill me-1' : 'bi bi-circle me-1'"></i>
              At least 8 characters
            </li>
            <li :class="passwordRequirements.upper ? 'text-success' : 'text-muted'">
              <i :class="passwordRequirements.upper ? 'bi bi-check-circle-fill me-1' : 'bi bi-circle me-1'"></i>
              At least one uppercase letter (A-Z)
            </li>
            <li :class="passwordRequirements.lower ? 'text-success' : 'text-muted'">
              <i :class="passwordRequirements.lower ? 'bi bi-check-circle-fill me-1' : 'bi bi-circle me-1'"></i>
              At least one lowercase letter (a-z)
            </li>
            <li :class="passwordRequirements.number ? 'text-success' : 'text-muted'">
              <i :class="passwordRequirements.number ? 'bi bi-check-circle-fill me-1' : 'bi bi-circle me-1'"></i>
              At least one number (0-9)
            </li>
            <li :class="passwordRequirements.symbol ? 'text-success' : 'text-muted'">
              <i :class="passwordRequirements.symbol ? 'bi bi-check-circle-fill me-1' : 'bi bi-circle me-1'"></i>
              At least one symbol (e.g. !@#$%)
            </li>
          </ul>
        </div>

        <div class="col-md-6">
          <label for="fp-password-confirm" class="form-label">Confirm Password</label>
          <div class="input-group">
            <input
              :type="passwordConfirmVisible ? 'text' : 'password'"
              class="form-control"
              id="fp-password-confirm"
              v-model="passwordConfirm"
              @input="validatePasswordMatch"
              required
            />
          </div>
          <div v-if="passwordMismatch" class="invalid-feedback">Passwords do not match.</div>
        </div>
      </div>

      <!-- Submit -->
      <div class="col-12 mt-4">
        <button type="submit" class="btn btn-primary" :disabled="isSubmitDisabled">Update Password</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.loading {
    font-style: italic;
}
</style>