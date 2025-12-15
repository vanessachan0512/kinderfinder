<script>
import { Modal } from 'bootstrap';
import 'emoji-picker-element';
import { jwtDecode } from "jwt-decode";

export default {
  data() {
    return {
      form: {
        firstName: '',
        middleName: '',
        lastName: '',
        birth: '',
        gender: '',
        country: 'HK',
        email: '',
        username: '',
        securityQuestion: '',
        securityAnswer: '',
        password: '',
        passwordConfirm: '',
        agree: false,
        profileEmoji: '🐥',
        profilePicture: null  // file object
      },
      emailExists: false,
      passwordMatch: true,
      passwordRequirements: {
        length: false,
        upper: false,
        lower: false,
        number: false,
        symbol: false
      },
      profilePreview: null,
      emojiPickerVisible: false,
      passwordVisible: false,
      countries: [
        { code: 'HK', name: 'Hong Kong' },
        { code: 'CN', name: 'China' },
        { code: 'US', name: 'United States' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'JP', name: 'Japan' },
        { code: 'TW', name: 'Taiwan' }
      ],
      termsModalInstance: null
    };
  },

  methods: {
    checkEmail() {
      if (!this.form.email) {
        this.emailExists = false;
        return;
      }
      fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.form.email })
      })
        .then(r => r.json())
        .then(data => { this.emailExists = !!data.exists; })
        .catch(err => console.error('Error:', err));
    },

    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },

    checkPasswordRequirements() {
      const p = this.form.password || '';
      this.passwordRequirements.length = p.length >= 8;
      this.passwordRequirements.upper = /[A-Z]/.test(p);
      this.passwordRequirements.lower = /[a-z]/.test(p);
      this.passwordRequirements.number = /[0-9]/.test(p);
      this.passwordRequirements.symbol = /[^A-Za-z0-9]/.test(p);
    },

    validatePasswordMatch() {
      this.passwordMatch = this.form.password === this.form.passwordConfirm;
    },

    previewProfilePicture(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      this.form.profilePicture = file;
      const reader = new FileReader();
      reader.onload = e => { this.profilePreview = e.target.result; };
      reader.readAsDataURL(file);
    },

    toggleEmojiPicker() {
      this.emojiPickerVisible = !this.emojiPickerVisible;
    },

    onEmojiClick(event) {
      const emoji = event.detail.unicode;
      this.form.profileEmoji = emoji;
      this.profilePreview = null; // clear photo preview if emoji chosen
      this.emojiPickerVisible = false;
    },

    showTerms() {
      if (!this.termsModalInstance) {
        this.termsModalInstance = new Modal(this.$refs.termsModal);
      }
      this.termsModalInstance.show();
    },

    agreeToTerms() {
      this.form.agree = true;
      this.termsModalInstance.hide();
    },

    async submitForm() {
      if (this.emailExists) return alert('This email is already registered.');
      if (!this.passwordMatch) return alert('Passwords do not match.');
      if (!this.form.agree) return alert('Please agree to the terms.');

      const payload = new FormData();
      Object.entries(this.form).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          payload.append(key, value);
        }
      });

      try {
        const res = await fetch('/api/signup', { method: 'POST', body: payload });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Signup failed');
        }
        alert('Success! Please check your email to verify your account.');
        this.$router.push({ name: 'Verify', params: { email: this.form.email } });
      } catch (err) {
        console.error(err);
        alert('Error during signup. Please try again.');
      }
    }
  },

  watch: {
    'form.password'() {
      this.checkPasswordRequirements();
      this.validatePasswordMatch();
    },
    'form.passwordConfirm'() {
      this.validatePasswordMatch();
    }
  }
};
</script>

<template>
  <div class="min-vh-100 bg-gradient-light py-5">
    <!-- Use container-fluid for wider layout -->
    <div class="container-fluid px-4 px-lg-5">
      <!-- Header -->
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">
          Join KinderFinder 👨‍👩‍👧‍👦
        </h2>
        <p class="lead text-muted col-lg-10 mx-auto">
          Create your parent account to connect with other families, share experiences, and find the best kindergarten for your child.
        </p>
      </div>

      <div class="row justify-content-center">
        <!-- Full width card -->
        <div class="col-12">
          <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div class="row g-0">
              <!-- Left: Form – now much wider -->
              <div class="col-lg-9 bg-white p-4 p-md-5">
                <form @submit.prevent="submitForm">
                  <!-- Personal Info -->
                  <h5 class="mb-3 text-primary">Personal Information</h5>
                  <div class="row g-3 mb-3">
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">First Name <span class="text-danger">*</span></label>
                      <input v-model="form.firstName" type="text" class="form-control form-control-lg" required>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Middle Name</label>
                      <input v-model="form.middleName" type="text" class="form-control form-control-lg">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Last Name <span class="text-danger">*</span></label>
                      <input v-model="form.lastName" type="text" class="form-control form-control-lg" required>
                    </div>

                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Date of Birth</label>
                      <input v-model="form.birth" type="date" class="form-control form-control-lg">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Gender <span class="text-danger">*</span></label>
                      <select v-model="form.gender" class="form-select form-control-lg" required>
                        <option value="" disabled>Select gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                        <option value="prefer-not">Prefer not to say</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Country <span class="text-danger">*</span></label>
                      <select v-model="form.country" class="form-select form-control-lg" required>
                        <option value="" disabled>Select country</option>
                        <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.name }}</option>
                      </select>
                    </div>
                  </div>

                  <!-- Account Info -->
                  <h5 class="mb-3 text-primary">Account Details</h5>
                  <div class="row g-3 mb-3">
                    <div class="col-md-8">
                      <label class="form-label fw-semibold">Email Address <span class="text-danger">*</span></label>
                      <input v-model="form.email" type="email" class="form-control form-control-lg" @blur="checkEmail" required>
                      <small v-if="emailExists" class="text-danger d-block mt-1">This email is already registered.</small>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Username <span class="text-danger">*</span></label>
                      <input v-model="form.username" type="text" class="form-control form-control-lg" placeholder="" required>
                    </div>
                  </div>

                  <!-- Security Question -->
                  <h5 class="mb-3 text-primary">Security Question (for account recovery)</h5>
                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">Question <span class="text-danger">*</span></label>
                      <select v-model="form.securityQuestion" class="form-select form-control-lg" required>
                        <option value="" disabled>Choose a question...</option>
                        <option>What is your mother's maiden name?</option>
                        <option>What was your first pet's name?</option>
                        <option>What was your first school?</option>
                        <option>In which city were you born?</option>
                        <option>What is your favorite childhood book?</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">Answer <span class="text-danger">*</span></label>
                      <input v-model="form.securityAnswer" type="text" class="form-control form-control-lg" required>
                    </div>
                  </div>

                  <!-- Password -->
                  <h5 class="mb-3 text-primary">Create Password</h5>
                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">Password <span class="text-danger">*</span></label>
                      <div class="input-group">
                        <input
                          v-model="form.password"
                          :type="passwordVisible ? 'text' : 'password'"
                          class="form-control form-control-lg"
                          required
                        >
                        <button type="button" class="btn btn-outline-secondary" @click="togglePasswordVisibility">
                          <i :class="passwordVisible ? 'bi bi-eye' : 'bi bi-eye-slash'"></i>
                        </button>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">Confirm Password <span class="text-danger">*</span></label>
                      <input v-model="form.passwordConfirm" type="password" class="form-control form-control-lg" required>
                      <small v-if="!passwordMatch && form.passwordConfirm" class="text-danger d-block mt-1">Passwords don't match</small>
                    </div>
                  </div>

                  <div class="alert alert-info small p-3 mb-3">
                    <strong>Your password must contain:</strong>
                    <ul class="mb-0 mt-2 small">
                      <li :class="{ 'text-success': passwordRequirements.length }">✓ 8+ characters</li>
                      <li :class="{ 'text-success': passwordRequirements.upper }">✓ One uppercase letter</li>
                      <li :class="{ 'text-success': passwordRequirements.lower }">✓ One lowercase letter</li>
                      <li :class="{ 'text-success': passwordRequirements.number }">✓ One number</li>
                      <li :class="{ 'text-success': passwordRequirements.symbol }">✓ One symbol (!@#$% etc.)</li>
                    </ul>
                  </div>

                  <!-- Terms -->
                  <div class="form-check mb-3">
                    <input v-model="form.agree" class="form-check-input" type="checkbox" id="agree" required>
                    <label class="form-check-label fw-semibold" for="agree">
                      I agree to the <button type="button" class="btn btn-link p-0 align-baseline" @click="showTerms">Terms & Conditions</button> <span class="text-danger">*</span>
                    </label>
                  </div>

                  <!-- Submit -->
                  <button type="submit" class="btn btn-primary btn-lg text-dark w-100 shadow-sm rounded-pill py-3" style="background: linear-gradient(135deg, #85e8ca 0%, #9af0df 100%);">
                    Create Account
                  </button>

                  <div class="text-center mt-4">
                    <small class="text-muted">
                      Already a member? <router-link to="/login" class="text-primary fw-semibold">Log in here</router-link>
                    </small>
                  </div>
                </form>
              </div>

              <!-- Right: Profile Avatar – narrower but still prominent -->
              <div class="col-lg-3 bg-gradient-primary text-dark d-flex align-items-center p-5">
                <div class="w-100 text-center">
                  <h4 class="mb-4">Your Icon</h4>

                  <div class="profile-avatar mx-auto mb-4">
                    <img 
                      v-if="profilePreview"
                      :src="profilePreview"
                      class="rounded-circle shadow"
                      style="width: 160px; height: 160px; object-fit: cover;"
                    >
                    <div v-else class="emoji-display">
                      {{ form.profileEmoji }}
                    </div>
                  </div>

                  <p class="mb-4 small">Choose a photo or emoji — this is how other parents will see you!</p>

                  <div class="d-grid gap-3">
                    <div>
                      <label class="btn btn-light btn-lg rounded-pill shadow-sm w-100">
                        Upload Photo
                        <input type="file" @change="previewProfilePicture" accept="image/*" class="d-none">
                      </label>
                    </div>

                    <button @click="toggleEmojiPicker" class="btn btn-light btn-lg rounded-pill shadow-sm w-100">
                      Pick Emoji
                    </button>
                  </div>

                  <div v-if="emojiPickerVisible" class="mt-4 bg-white rounded-4 shadow p-3">
                    <emoji-picker @emoji-click="onEmojiClick"></emoji-picker>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Terms Modal -->
      <div class="modal fade" ref="termsModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">Terms & Conditions</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
             


            <p>Welcome to KinderFinder. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.</p>
            <h6>1. Acceptance of Terms</h6>
            <p>By using our website, you agree to these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use our services.</p>
            <h6>2. Personal Information</h6>
            <p>We may collect personal information, including but not limited to your name, email address, phone number, and other relevant data. By providing your information, you consent to its collection and use as described in our Privacy Policy.</p>
            <h6>3. Use of Information</h6>
            <p>The information we collect may be used to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Communicate with you</li>
              <li>Personalize user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
            <h6>4. Data Security</h6>
            <p>We implement reasonable security measures to protect your personal information. However, no method of transmission over the internet or method of electronic storage is 100% secure.</p>
            <h6>5. User Rights</h6>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request corrections to your information</li>
              <li>Request deletion of your information</li>
            </ul>
            <h6>6. Changes to Terms</h6>
            <p>We reserve the right to modify these Terms and Conditions at any time. Any changes will be effective immediately upon posting on our website.</p>
            <h6>7. Contact Us</h6>
            <p>If you have any questions about these Terms and Conditions, please contact us.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" @click="agreeToTerms">I Agree</button>
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
.bg-gradient-primary {
  background: linear-gradient(135deg, #85e8ca 0%, #9af0df 100%);
}
.profile-avatar {
  width: 200px;
  height: 200px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 5px solid rgba(255,255,255,0.3);
}
.emoji-display {
  font-size: 120px;
}
.form-control-lg, .form-select-lg {
  border-radius: 12px;
  padding: 0.75rem 1rem;
}
.btn-lg {
  border-radius: 50px;
  padding: 0.75rem 2rem;
}
.card {
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
  max-width: none; /* ensures no hidden width limits */
}
</style>