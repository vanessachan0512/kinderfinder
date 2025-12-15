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
const fetchingQuestion = ref(false);

const passwordRequirements = ref({
  length: false,
  upper: false,
  lower: false,
  number: false,
  symbol: false
});

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value;
};
const togglePasswordConfirmVisibility = () => {
  passwordConfirmVisible.value = !passwordConfirmVisible.value;
};

const validatePassword = () => {
  const p = password.value;
  passwordRequirements.value.length = p.length >= 8;
  passwordRequirements.value.upper = /[A-Z]/.test(p);
  passwordRequirements.value.lower = /[a-z]/.test(p);
  passwordRequirements.value.number = /\d/.test(p);
  passwordRequirements.value.symbol = /[\W_]/.test(p);
};

const passwordMismatch = computed(() => password.value !== passwordConfirm.value && passwordConfirm.value);

const isSubmitDisabled = computed(
  () =>
    !securityQuestion.value ||
    securityError.value ||
    passwordMismatch.value ||
    Object.values(passwordRequirements.value).some(v => !v) ||
    loading.value
);

// === Trigger security question fetch with button ===
const fetchSecurityQuestion = async () => {
  if (!email.value.trim()) {
    securityFeedback.value = 'Please enter your email address.';
    return;
  }

  fetchingQuestion.value = true;
  loading.value = true;
  securityQuestion.value = '';
  securityAnswer.value = '';
  securityFeedback.value = '';

  try {
    const response = await fetch('/api/users/get-security-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim() })
    });

    if (response.ok) {
      const data = await response.json();
      securityQuestion.value = data.securityQuestion;
    } else {
      securityFeedback.value = 'No account found with this email or security question not set.';
    }
  } catch (error) {
    securityFeedback.value = 'Error fetching security question.';
  } finally {
    loading.value = false;
    fetchingQuestion.value = false;
  }
};

// === Trigger security answer validation with button ===
const validateSecurityAnswer = async () => {
  if (!securityAnswer.value.trim()) {
    securityError.value = true;
    securityFeedback.value = 'Please enter your answer.';
    return;
  }

  loading.value = true;
  securityError.value = false;
  securityFeedback.value = '';

  try {
    const response = await fetch('/api/users/validate-security-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, securityans: securityAnswer.value.trim() })
    });

    if (response.status === 200) {
      securityError.value = false;
      securityFeedback.value = 'Correct answer! ✓';
    } else if (response.status === 403) {
      securityError.value = true;
      securityFeedback.value = 'Incorrect answer. Please try again.';
    } else {
      securityError.value = true;
      securityFeedback.value = 'Server error validating answer.';
    }
  } catch (error) {
    securityError.value = true;
    securityFeedback.value = 'Error validating security answer.';
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
  <div class="min-vh-100 bg-gradient-light py-5">
    <div class="container">
      <!-- Header & Progress -->
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">Reset Your Password 👨‍👩‍👧‍👦</h2>
        <p class="lead text-muted col-lg-8 mx-auto">
          We'll guide you through 3 simple steps: verify your email, answer your security question, then set a new password.
        </p>

        <!-- Step Progress Indicator (unchanged) -->
        <div class="d-flex justify-content-center align-items-center mt-4 gap-4">
          <div class="text-center">
            <div class="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" style="width:40px;height:40px;">1</div>
            <p class="small mt-2 mb-0 fw-semibold">Email</p>
          </div>
          <div class="border-top flex-grow-1 mt-3" style="border-top: 2px dashed #7aefce !important;"></div>
          <div class="text-center">
            <div class="rounded-circle bg-light border border-2 text-muted d-inline-flex align-items-center justify-content-center" :class="{ 'bg-primary text-white border-primary': securityQuestion }" style="width:40px;height:40px;">2</div>
            <p class="small mt-2 mb-0">Security</p>
          </div>
          <div class="border-top flex-grow-1 mt-3" style="border-top: 2px dashed #7aefce !important;"></div>
          <div class="text-center">
            <div class="rounded-circle bg-light border border-2 text-muted d-inline-flex align-items-center justify-content-center" :class="{ 'bg-primary text-white border-primary': securityQuestion && !securityError && password.length > 0 }" style="width:40px;height:40px;">3</div>
            <p class="small mt-2 mb-0">New Password</p>
          </div>
        </div>
      </div>

      <div class="row justify-content-center">
        <div class="col-12 col-lg-8 col-xl-7">
          <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div class="card-body p-4 p-md-5">
              <form @submit.prevent="handleSubmit" class="row g-4">
                <!-- Step 1: Email + Button -->
                <div class="col-12">
                  <label for="fp-email" class="form-label fw-semibold">Email Address</label>
                  <div class="input-group">
                    <input
                      type="email"
                      class="form-control form-control-lg rounded-pill"
                      id="fp-email"
                      v-model="email"
                      placeholder="your@email.com"
                      required
                    />
                    <button
                      type="button"
                      class="btn btn-outline-primary rounded-pill"
                      style="margin-left:2%"
                      @click="fetchSecurityQuestion"
                      :disabled="loading || !email.trim()"
                    >
                      <span v-if="fetchingQuestion" class="d-flex align-items-center gap-2">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        Loading...
                      </span>
                      <span v-else>Verify Email</span>
                    </button>
                  </div>
                  <small v-if="securityFeedback && !securityQuestion" class="text-danger d-block mt-2">{{ securityFeedback }}</small>
                </div>

                <!-- Step 2: Security Question & Answer -->
                <transition name="fade">
                  <div v-if="fetchingQuestion || securityQuestion" class="col-12">
                    <div class="row g-4">
                      <div class="col-md-6">
                        <label class="form-label fw-semibold">Your Security Question</label>
                        <div v-if="fetchingQuestion" class="p-3 bg-light rounded-4">
                          <div class="skeleton-line mb-2"></div>
                          <div class="skeleton-line short"></div>
                        </div>
                        <div v-else class="p-3 bg-light rounded-4">{{ securityQuestion }}</div>
                      </div>

                      <div class="col-md-6">
                        <label for="fp-securityans" class="form-label fw-semibold">Security Answer</label>
                        <div class="input-group">
                          <input
                            type="text"
                            class="form-control form-control-lg rounded-pill"
                            :class="{ 'is-invalid': securityError && !loading && securityAnswer }"
                            id="fp-securityans"
                            v-model="securityAnswer"
                            :disabled="fetchingQuestion"
                            required
                          />
                          <button
                            type="button"
                            class="btn btn-outline-primary rounded-pill"
                            style="margin-left:2%"
                            @click="validateSecurityAnswer"
                            :disabled="loading || !securityAnswer.trim() || fetchingQuestion"
                          >
                            <span v-if="loading && !fetchingQuestion" class="d-flex align-items-center gap-2">
                              <div class="spinner-border spinner-border-sm" role="status"></div>
                              Checking...
                            </span>
                            <span v-else>Check Answer</span>
                          </button>
                        </div>

                        <div v-if="securityError && !loading && securityAnswer" class="text-danger small mt-2">
                          {{ securityFeedback }}
                        </div>
                        <div v-if="!securityError && securityFeedback && !loading && securityAnswer" class="text-success small mt-2">
                          {{ securityFeedback }}
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>

                <!-- Step 3: New Password -->
                <transition name="fade">
                  <div v-if="securityQuestion && !securityError" class="col-12">
                    <div class="row g-4">
                      <div class="col-md-6">
                        <label for="fp-password" class="form-label fw-semibold">New Password</label>
                        <div class="input-group">
                          <input
                            :type="passwordVisible ? 'text' : 'password'"
                            class="form-control form-control-lg rounded-pill"
                            id="fp-password"
                            v-model="password"
                            @input="validatePassword"
                            required
                          />
                          <button type="button" class="btn btn-outline-secondary rounded-pill"  style="margin-left:2%" @click="togglePasswordVisibility">
                            <i :class="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                          </button>
                        </div>
                        <ul class="list-unstyled small mt-3">
                          <li :class="passwordRequirements.length ? 'text-success' : 'text-muted'">✓ At least 8 characters</li>
                          <li :class="passwordRequirements.upper ? 'text-success' : 'text-muted'">✓ One uppercase letter</li>
                          <li :class="passwordRequirements.lower ? 'text-success' : 'text-muted'">✓ One lowercase letter</li>
                          <li :class="passwordRequirements.number ? 'text-success' : 'text-muted'">✓ One number</li>
                          <li :class="passwordRequirements.symbol ? 'text-success' : 'text-muted'">✓ One symbol (!@#$% etc.)</li>
                        </ul>
                      </div>

                      <div class="col-md-6">
                        <label for="fp-password-confirm" class="form-label fw-semibold">Confirm New Password</label>
                        <div class="input-group">
                          <input
                            :type="passwordConfirmVisible ? 'text' : 'password'"
                            class="form-control form-control-lg rounded-pill"
                            id="fp-password-confirm"
                            v-model="passwordConfirm"
                            required
                          />
                        </div>
                        <div v-if="passwordMismatch" class="text-danger small mt-2">Passwords do not match.</div>
                      </div>
                    </div>
                  </div>
                </transition>

                <!-- Submit -->
                <div class="col-12 mt-4">
                  <div class="d-grid">
                    <button type="submit" class="btn btn-primary btn-lg rounded-pill shadow-sm py-3" :disabled="isSubmitDisabled">
                      <span v-if="loading" class="d-flex align-items-center justify-content-center gap-2">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        Updating...
                      </span>
                      <span v-else>Update Password</span>
                    </button>
                  </div>
                </div>

                <div class="text-center mt-4">
                  <small class="text-muted">
                    Remembered your password? <router-link to="/login" class="text-primary fw-semibold">Log in here</router-link>
                  </small>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-gradient-light {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
}
.card { box-shadow: 0 25px 50px rgba(0,0,0,0.15); }

.btn-primary {
  background: linear-gradient(135deg, #7aefce 0%, #98edd5 100%);
  border: none;
  font-weight: 600;
  
}
.btn-primary:hover {
  background: linear-gradient(135deg, #6be8c4 0%, #8ae8cb 100%);
}
.btn-primary:disabled { opacity: 0.7; }

.form-control-lg,
.input-group .btn {
  border-radius: 50px !important;
  padding: 0.75rem 1.5rem;
}
.form-control:focus {
  border-color: #7aefce;
  box-shadow: 0 0 0 0.25rem rgba(122, 239, 206, 0.25);
}
.bg-light { background-color: #f8fcfb !important; }

/* Fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Skeleton */
.skeleton-line {
  height: 1.2em;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 6px;
}
.skeleton-line.short { width: 70%; }
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>