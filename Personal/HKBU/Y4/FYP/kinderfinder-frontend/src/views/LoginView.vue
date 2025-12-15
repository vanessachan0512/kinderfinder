<script setup>
import { ref } from 'vue';

const email = ref('');
const password = ref('');
const showPassword = ref(false);

// ✅ NEW: loading state
const isLoading = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const login = async () => {
  isLoading.value = true; // ✅ show loading BEFORE backend call

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    });

    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();

    localStorage.setItem('token', data.token);
    localStorage.setItem('isAdmin', data.isAdmin);

    alert('Login successful!');
    window.location.href = '/home';
  } catch (err) {
    alert('Invalid email or password');
    console.error(err);
  } finally {
    isLoading.value = false; // ✅ hide loading AFTER backend finishes
  }
};
</script>

<template>
  <!-- ✅ Loading Overlay -->
  <div 
    v-if="isLoading" 
    class="login-loading-overlay d-flex justify-content-center align-items-center"
  >
    <div class="spinner-border text-success" style="width: 4rem; height: 4rem;" role="status"></div>
  </div>

  <div class="min-vh-100 bg-gradient-light py-5">
    <div class="container">
      <!-- Welcoming Header -->
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">
          Welcome Back to KinderFinder 👨‍👩‍👧‍👦
        </h2>
        <p class="lead text-muted col-lg-8 mx-auto">
          Log in to connect with other parents and find the perfect kindergarten for your child.
        </p>
      </div>

      <div class="row justify-content-center">
        <div class="col-12 col-lg-6 col-xl-5">
          <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div class="card-body p-4 p-md-5">
              <form id="login-form" @submit.prevent="login">
                <!-- Email -->
                <div class="mb-4">
                  <label for="email" class="form-label fw-semibold">Email address</label>
                  <input
                    v-model="email"
                    type="email"
                    class="form-control form-control-lg rounded-pill"
                    id="email"
                    placeholder="xxx@xxx.com"
                    required
                  >
                </div>

                <!-- Password -->
                <div class="mb-4">
                  <label for="password" class="form-label fw-semibold">Password</label>
                  <div class="input-group">
                    <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control form-control-lg rounded-pill"
                      id="password"
                      placeholder="Enter your password"
                      required
                    >
                    <button
                      class="btn btn-outline-secondary rounded-pill"
                      style="margin-left:2%"
                      type="button"
                      @click="togglePassword"
                    >
                      <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <!-- Submit -->
                <div class="d-grid mb-4">
                  <button 
                    type="submit" 
                    class="btn btn-primary btn-lg rounded-pill shadow-sm py-3"
                    :disabled="isLoading"
                  >
                    <span v-if="!isLoading">Sign In</span>
                    <span v-else>Signing In...</span>
                  </button>
                </div>
              </form>

              <div class="text-center">
                <div class="mb-2">New around here? <a href="/signup" class="text-primary fw-semibold">Sign up</a></div>
                <div>Forgot password? <a href="/forgot-password" class="text-primary fw-semibold">Reset it</a></div>
              </div>
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

.card {
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #7aefce 0%, #98edd5 100%);
  border: none;
  font-weight: 600;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #6be8c4 0%, #8ae8cb 100%);
}

.form-control-lg,
.input-group .btn {
  border-radius: 50px !important;
  padding: 0.75rem 1.5rem;
}

.form-control:focus {
  border-color: #7aefce;
  box-shadow: 0 0 0 0.25rem rgba(122, 239, 206, 0.25);
}

/* ✅ NEW: Fullscreen loading overlay */
.login-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(3px);
  z-index: 9999;
}
</style>
