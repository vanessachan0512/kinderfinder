<script setup>
import { ref } from 'vue';

const email = ref('');
const password = ref('');
const showPassword = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const login = async () => {
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
  }
};
</script>

<template>
  <div class="container-fluid mt-5">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10">
        <div class="card mt-4" style="max-width:1100px; margin:0 auto; min-height:60vh;">
          <div class="card-body">
            <form id="login-form" @submit.prevent="login">
              <!-- Email -->
              <div class="mb-3 mt-5">
                <label for="email" class="form-label d-block w-50 mx-auto">Email address</label>
                <input
                  v-model="email"
                  type="email"
                  class="form-control w-50 mx-auto"
                  id="email"
                  name="email"
                  placeholder="xxx@xxx.com"
                  required
                >
              </div>

              <!-- Password -->
              <div class="mb-3 mt-5">
                <label for="password" class="form-label d-block w-50 mx-auto">Password</label>
                <div class="input-group w-50 mx-auto">
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control"
                    id="password"
                    name="password"
                    placeholder="Password"
                    required
                  >
                  <button
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="togglePassword"
                    aria-label="Toggle password visibility"
                  >
                    <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>

              <!-- Submit -->
              <div class="mb-3 d-flex justify-content-center">
                <button type="submit" class="btn btn-primary">Sign in</button>
              </div>
            </form>
          </div>

          <div class="card-footer">
            <div class="mb-2">New around here? <a href="/signup">Sign up</a></div>
            <div>Forgot password? <a href="/forgot-password">Reset</a></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
