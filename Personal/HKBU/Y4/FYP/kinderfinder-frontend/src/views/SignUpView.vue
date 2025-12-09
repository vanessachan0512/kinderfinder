<script>
import { Modal } from 'bootstrap';
import 'emoji-picker-element'; // registers <emoji-picker> as a web component

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
        profileEmoji: ''
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
      profilePreview: '/images/logo.png',
      emojiPickerVisible: false,
      passwordVisible: false,
      countries: [
        { code: 'HK', name: 'Hong Kong' },
        { code: 'CN', name: 'China' },
        { code: 'US', name: 'United States' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'JP', name: 'Japan' },
        { code: 'TW', name: 'Taiwan' },
        // add more as needed
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
        .catch(err => console.error('Error checking email:', err));
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
      const reader = new FileReader();
      reader.onload = e => { this.profilePreview = e.target.result; };
      reader.readAsDataURL(file);
      // keep the file so you can submit it later
      this.form.profilePicture = file;
    },

    toggleEmojiPicker() {
      this.emojiPickerVisible = !this.emojiPickerVisible;
    },

    onEmojiClick(event) {
      // emoji-picker-element emits detail with .emoji, .unicode, etc.
      const emoji = event.detail.unicode || event.detail.emoji;
      this.form.profileEmoji = emoji;
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
      if (this.termsModalInstance) this.termsModalInstance.hide();
    },

    async submitForm() {
      // basic validations
      if (this.emailExists) {
        alert('This email has already been registered.');
        return;
      }
      if (!this.passwordMatch) {
        alert('Passwords do not match.');
        return;
      }
      if (!this.form.agree) {
        alert('You must agree to terms.');
        return;
      }

      // build multipart form payload (includes file + fields)
      const payload = new FormData();
      const {
        firstName, middleName, lastName, birth, gender, country,
        email, username, securityQuestion, securityAnswer,
        password, passwordConfirm, agree, profileEmoji, profilePicture
      } = this.form;

      payload.append('firstName', firstName);
      payload.append('middleName', middleName);
      payload.append('lastName', lastName);
      payload.append('birth', birth);
      payload.append('gender', gender);
      payload.append('country', country);
      payload.append('email', email);
      payload.append('username', username);
      payload.append('securityQuestion', securityQuestion);
      payload.append('securityAnswer', securityAnswer);
      payload.append('password', password);
      payload.append('passwordConfirm', passwordConfirm);
      payload.append('agree', String(agree));
      payload.append('profileEmoji', profileEmoji);
      if (profilePicture) payload.append('profilePicture', profilePicture);

      try {
        const res = await fetch('/api/signup', { method: 'POST', body: payload });
        if (!res.ok) {
            const errorData = await res.json(); // Get response body
            throw new Error(`Signup failed (${res.status}): ${errorData.message || errorData.error}`);
        }
        alert('You need to verify your account!');
        // Redirect after a short delay
        // setTimeout(() => {
        console.log('Navigating to Verify with email:', this.form.email);
        this.$router.push({ name: 'Verify', params: { email: this.form.email }}); // Ensure email is defined
        // }, 1000); // Delay for 1 second (1000 ms)

        } catch (err) {
        console.error('Signup error:', err);
        alert('Error during signup. Please try again.');
        }
    }
  }
};
</script>

html
<template>
  <div class="container">
    <div class="d-flex align-items-center justify-content-between mt-4 mb-4">
      <h1 class="m-0">Sign Up</h1>
      <div class="text-end text-muted">Welcome! Sign Up to get more function!</div>
    </div>

    <form @submit.prevent="submitForm" enctype="multipart/form-data">
      <div class="row">
        <div class="col-lg-8">
          <div class="row g-3">
            <!-- Names -->
            <div class="col-md-4">
              <label class="form-label">First name</label>
              <input v-model="form.firstName" type="text" class="form-control" required>
            </div>
            <div class="col-md-4">
              <label class="form-label">Middle name</label>
              <input v-model="form.middleName" type="text" class="form-control">
            </div>
            <div class="col-md-4">
              <label class="form-label">Last name</label>
              <input v-model="form.lastName" type="text" class="form-control" required>
            </div>

            <!-- Birth / Gender / Country -->
            <div class="col-md-4">
              <label class="form-label">Birth</label>
              <input v-model="form.birth" type="date" class="form-control">
            </div>
            <div class="col-md-4">
              <label class="form-label">Gender</label>
              <select v-model="form.gender" class="form-select" required>
                <option disabled value="">Choose...</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Country</label>
              <select v-model="form.country" class="form-select" required>
                <option value="" disabled>Select country</option>
                <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.name }}</option>
              </select>
            </div>

            <!-- Email / Username -->
            <div class="col-md-8">
              <label class="form-label">Email</label>
              <input v-model="form.email" type="email" class="form-control" @blur="checkEmail" required>
              <div class="alert-placeholder mt-1" v-if="emailExists">
                <span class="text-danger">This email has already been registered.</span>
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Username</label>
              <input v-model="form.username" type="text" class="form-control" required>
            </div>

            <!-- Security question and answer -->
            <div class="col-md-6">
              <label class="form-label">Security question</label>
              <select v-model="form.securityQuestion" class="form-select" required>
                <option value="">Choose a question...</option>
                <option value="What is your mother's name?">What is your mother's name?</option>
                <option value="What is your father's name?">What is your father's name?</option>
                <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                <option value="What was the name of your first school?">What was the name of your first school?</option>
                <option value="In which city were you born?">In which city were you born?</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Security answer</label>
              <input v-model="form.securityAnswer" type="text" class="form-control" required>
            </div>

            <!-- Passwords with visibility toggle -->
            <div class="col-md-6">
              <label class="form-label">Password</label>
              <div class="input-group">
                <input
                  v-model="form.password"
                  :type="passwordVisible ? 'text' : 'password'"
                  class="form-control"
                  @input="checkPasswordRequirements(); validatePasswordMatch()"
                  required
                >
                <button type="button" class="btn btn-outline-secondary" @click="togglePasswordVisibility">
                  <i :class="passwordVisible ? 'bi bi-eye' : 'bi bi-eye-slash'"></i>
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
              <label class="form-label">Confirm Password</label>
              <input
                v-model="form.passwordConfirm"
                type="password"
                class="form-control"
                @input="validatePasswordMatch"
                required
              >
              <div class="invalid-feedback d-block" v-if="!passwordMatch">Passwords do not match.</div>
            </div>

            <!-- Agree -->
            <div class="col-12 form-check d-flex align-items-center">
              <input v-model="form.agree" class="form-check-input me-2" type="checkbox" id="agree" required>
              <label class="form-check-label me-3" for="agree">Agree to terms and conditions</label>
              <button type="button" class="btn btn-link p-0" @click="showTerms">View terms</button>
            </div>

            <div class="col-12">
              <button type="submit" class="btn btn-primary">Submit</button>
            </div>
          </div>
        </div>

        <!-- Right column: profile picture + emoji -->
        <div class="col-lg-4">
          <div class="card" style="max-width:320px; margin-left: 30%;">
            <div class="card-body text-center">
              <h5 class="card-title">Profile Picture</h5>
              <div class="mb-3" style="position:relative; width:200px; height:200px; margin:0 auto;">
                <img 
                  v-if="profileImage" 
                  :src="profileImage" 
                  alt="Profile Picture" 
                  style="width:100%; height:100%; object-fit:cover; border-radius:6px; display:block;" 
                >
                <span v-else-if="form.profileEmoji" style="font-size: 100px;">{{ form.profileEmoji }}</span>
                <img v-else src="/images/logo.png" alt="Logo" style="width:100%; height:100%; object-fit:cover; border-radius:6px; display:block;" />
              </div>
              <div class="d-flex gap-2 justify-content-center">
                <input type="file" @change="previewProfilePicture" accept="image/*" class="form-control">
                <button type="button" class="btn btn-outline-secondary" @click="toggleEmojiPicker" title="Choose emoji">
                  <i class="bi bi-emoji-smile"></i>
                </button>
              </div>

              <!-- Use the web component directly instead of manual append -->
              <div v-if="emojiPickerVisible" class="mt-2">
                <emoji-picker @emoji-click="onEmojiClick"></emoji-picker>
              </div>

              <input type="hidden" v-model="form.profileEmoji">
            </div>
          </div>
        </div>
      </div>
    </form>

    <!-- Modal for Terms & Conditions -->
    <div class="modal fade" id="termsModal" tabindex="-1" aria-labelledby="termsModalLabel" aria-hidden="true" ref="termsModal">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="termsModalLabel">Terms and Conditions</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
</template>

<style scoped>
/* Optional tweaks */
</style>
