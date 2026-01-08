<script setup>
import { ref, reactive, watch } from 'vue'
import { Modal } from 'bootstrap'
import 'emoji-picker-element'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'

const { t } = useI18n()
const router = useRouter()

// === FORM STATE ===
const form = reactive({
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
  profilePicture: null
})

const emailExists = ref(false)
const passwordMatch = ref(true)
const passwordRequirements = reactive({
  length: false,
  upper: false,
  lower: false,
  number: false,
  symbol: false
})

const profilePreview = ref(null)
const emojiPickerVisible = ref(false)
const passwordVisible = ref(false)
const termsModalInstance = ref(null)

const countries = [
  { code: 'HK', name: 'Hong Kong' },
  { code: 'CN', name: 'China' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'JP', name: 'Japan' },
  { code: 'TW', name: 'Taiwan' }
]

// === METHODS ===
async function checkEmail() {
  if (!form.email) {
    emailExists.value = false
    return
  }
  try {
    const res = await fetch('/api/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email })
    })
    const data = await res.json()
    emailExists.value = !!data.exists
  } catch (err) {
    console.error('Error:', err)
  }
}

function togglePasswordVisibility() {
  passwordVisible.value = !passwordVisible.value
}

function checkPasswordRequirements() {
  const p = form.password || ''
  passwordRequirements.length = p.length >= 8
  passwordRequirements.upper = /[A-Z]/.test(p)
  passwordRequirements.lower = /[a-z]/.test(p)
  passwordRequirements.number = /[0-9]/.test(p)
  passwordRequirements.symbol = /[^A-Za-z0-9]/.test(p)
}

function validatePasswordMatch() {
  passwordMatch.value = form.password === form.passwordConfirm
}

function previewProfilePicture(event) {
  const file = event.target.files?.[0]
  if (!file) return
  form.profilePicture = file
  const reader = new FileReader()
  reader.onload = e => { profilePreview.value = e.target.result }
  reader.readAsDataURL(file)
}

function toggleEmojiPicker() {
  emojiPickerVisible.value = !emojiPickerVisible.value
}

function onEmojiClick(event) {
  const emoji = event.detail.unicode
  form.profileEmoji = emoji
  profilePreview.value = null
  emojiPickerVisible.value = false
}

function showTerms() {
  const modalEl = document.getElementById('termsModal')
  if (!modalEl) {
    console.error('Modal element not found')
    return
  }
  if (!termsModalInstance.value) {
    termsModalInstance.value = new Modal(modalEl, {
      backdrop: true,
      keyboard: true
    })
  }
  termsModalInstance.value.show()
}

function agreeToTerms() {
  form.agree = true
  termsModalInstance.value?.hide()
}

async function submitForm() {
  if (emailExists.value) return alert(t('emailAlreadyRegistered'))
  if (!passwordMatch.value) return alert(t('passwordsDoNotMatch'))
  if (!form.agree) return alert(t('agreeToTerms'))

  const payload = new FormData()
  Object.entries(form).forEach(([key, value]) => {
    if (value !== null && value !== '') {
      payload.append(key, value)
    }
  })

  try {
    const res = await fetch('/api/signup', { method: 'POST', body: payload })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Signup failed')
    }
    alert(t('signupSuccess'))
    router.push({ name: 'Verify', params: { email: form.email } })
  } catch (err) {
    console.error(err)
    alert(t('signupError'))
  }
}

// === WATCHERS ===
watch(() => form.password, () => {
  checkPasswordRequirements()
  validatePasswordMatch()
})
watch(() => form.passwordConfirm, () => {
  validatePasswordMatch()
})
</script>


<template>
  <div class="min-vh-100 bg-gradient-light py-5">
    <!-- Use container-fluid for wider layout -->
    <div class="container-fluid px-4 px-lg-5">
      <!-- Header -->
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">
          {{ $t('signupTitle') }}
        </h2>
        <p class="lead text-muted col-lg-10 mx-auto">
            {{ $t('signupSubtitle') }}
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
                  <h5 class="mb-3 text-primary">{{ $t('personalInfo') }}</h5>
                  <div class="row g-3 mb-3">
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">{{ $t('firstName') }} <span class="text-danger">*</span></label>
                      <input v-model="form.firstName" type="text" class="form-control form-control-lg" required>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">{{ $t('middleName') }}</label>
                      <input v-model="form.middleName" type="text" class="form-control form-control-lg">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">{{ $t('lastName') }} <span class="text-danger">*</span></label>
                      <input v-model="form.lastName" type="text" class="form-control form-control-lg" required>
                    </div>

                    <div class="col-md-4">
                      <label class="form-label fw-semibold">{{ $t('dateOfBirth') }}</label>
                      <input v-model="form.birth" type="date" class="form-control form-control-lg">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">{{ $t('gender') }} <span class="text-danger">*</span></label>
                      <select v-model="form.gender" class="form-select form-control-lg" required>
                        <option value="" disabled>{{ $t('selectGender') }}</option>
                        <option value="female">{{ $t('female') }}</option>
                        <option value="male">{{ $t('male') }}</option>
                        <option value="other">{{ $t('other') }}</option>
                        <option value="prefer-not">{{ $t('preferNotToSay') }}</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">{{ $t('country') }} <span class="text-danger">*</span></label>
                      <select v-model="form.country" class="form-select form-control-lg" required>
                        <option value="" disabled>{{ $t('selectCountry') }}</option>
                        <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.name }}</option>
                      </select>
                    </div>
                  </div>

                  <!-- Account Info -->
                  <h5 class="mb-3 text-primary">{{ $t('accountDetails') }}</h5>
                  <div class="row g-3 mb-3">
                    <div class="col-md-8">
                      <label class="form-label fw-semibold">{{ $t('emailAddress') }} <span class="text-danger">*</span></label>
                      <input v-model="form.email" type="email" class="form-control form-control-lg" @blur="checkEmail" required>
                      <small v-if="emailExists" class="text-danger d-block mt-1">{{ $t('emailExists') }}</small>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">{{ $t('username') }} <span class="text-danger">*</span></label>
                      <input v-model="form.username" type="text" class="form-control form-control-lg" placeholder="" required>
                    </div>
                  </div>

                  <!-- Security Question -->
                  <h5 class="mb-3 text-primary">{{ $t('securityQuestion') }}</h5>
                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">{{ $t('Question') }} <span class="text-danger">*</span></label>
                      <select v-model="form.securityQuestion" class="form-select form-control-lg" required>
                        <option value="" disabled>{{ $t('chooseQuestion') }}</option>
                        <option value="What is your mother's name?">{{ $t('securityQuestions.motherMaiden') }}</option>
                        <option value="What is your father's name?">{{ $t('securityQuestions.father') }}</option>
                        <option value="What was your first pet's name?">{{ $t('securityQuestions.firstPet') }}</option>
                        <option value="What was your first school?">{{ $t('securityQuestions.firstSchool') }}</option>
                        <option value="In which city were you born?">{{ $t('securityQuestions.birthCity') }}</option>
                        <option value="What is your favorite childhood book?">{{ $t('securityQuestions.favoriteBook') }}</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">{{ $t('securityAnswer') }} <span class="text-danger">*</span></label>
                      <input v-model="form.securityAnswer" type="text" class="form-control form-control-lg" required>
                    </div>
                  </div>

                  <!-- Password -->
                  <h5 class="mb-3 text-primary">{{ $t('createPassword') }}</h5>
                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label class="form-label fw-semibold">{{ $t('password') }} <span class="text-danger">*</span></label>
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
                      <label class="form-label fw-semibold">{{ $t('confirmPassword') }} <span class="text-danger">*</span></label>
                      <input v-model="form.passwordConfirm" type="password" class="form-control form-control-lg" required>
                      <small v-if="!passwordMatch && form.passwordConfirm" class="text-danger d-block mt-1">{{ $t('passwordsDontMatch') }}</small>
                    </div>
                  </div>

                  <div class="alert alert-secondary small p-3 mb-3">
                    <strong>{{ $t('passwordRequirements') }}</strong>
                    <ul class="mb-0 mt-2 small">
                      <li :class="{ 'text-success': passwordRequirements.length }">✓ {{ $t('passwordReqLength') }}</li>
                      <li :class="{ 'text-success': passwordRequirements.upper }">✓ {{ $t('passwordReqUpper') }}</li>
                      <li :class="{ 'text-success': passwordRequirements.lower }">✓ {{ $t('passwordReqLower') }}</li>
                      <li :class="{ 'text-success': passwordRequirements.number }">✓ {{ $t('passwordReqNumber') }}</li>
                      <li :class="{ 'text-success': passwordRequirements.symbol }">✓ {{ $t('passwordReqSymbol') }}</li>
                    </ul>
                  </div>

                  <!-- Terms -->
                  <div class="form-check mb-3">
                    <input v-model="form.agree" class="form-check-input" type="checkbox" id="agree" required>
                    <label class="form-check-label fw-semibold" for="agree">
                      {{ $t('termsAgreement') }} <button type="button" class="btn btn-link p-0 align-baseline" @click="showTerms">{{ $t('termsLink') }}</button> <span class="text-danger">*</span>
                    </label>
                  </div>

                  <!-- Submit -->
                  <button type="submit" class="btn btn-primary btn-lg text-dark w-100 shadow-sm rounded-pill py-3" style="background: linear-gradient(135deg, #85e8ca 0%, #9af0df 100%);">
                    {{ $t('createAccount') }}
                  </button>

                  <div class="text-center mt-4">
                    <small class="text-muted">
                      {{ $t('alreadyMember') }} <router-link to="/login" class="text-primary fw-semibold">{{ $t('loginHere') }}</router-link>
                    </small>
                  </div>
                </form>
              </div>

              <!-- Right: Profile Avatar – narrower but still prominent -->
              <div class="col-lg-3 bg-gradient-primary text-dark d-flex align-items-center p-5">
                <div class="w-100 text-center">
                  <h4 class="mb-4">{{ $t('yourIcon') }}</h4>

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

                  <p class="mb-4 small">{{ $t('iconDescription') }}</p>

                  <div class="d-grid gap-3">
                    <div>
                      <label class="btn btn-light btn-lg rounded-pill shadow-sm w-100">
                        {{ $t('uploadPhoto') }}
                        <input type="file" @change="previewProfilePicture" accept="image/*" class="d-none">
                      </label>
                    </div>

                    <button @click="toggleEmojiPicker" class="btn btn-light btn-lg rounded-pill shadow-sm w-100">
                      {{ $t('pickEmoji') }}
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
      <div class="modal fade" id="termsModal" ref="termsModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">{{ $t('termsModalTitle') }}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
             


            <p>{{ $t('termsIntro') }}</p>
              <h6>{{ $t('termsAcceptance') }}</h6>
              <p>{{ $t('termsAcceptanceText') }}</p>
              <h6>{{ $t('termsPersonalInfo') }}</h6>
              <p>{{ $t('termsPersonalInfoText') }}</p>
              <h6>{{ $t('termsUseOfInfo') }}</h6>
              <p>{{ $t('termsUseOfInfoList') }}</p>
              <ul>
                <li>{{ $t('termsUseItem1') }}</li>
                <li>{{ $t('termsUseItem2') }}</li>
                <li>{{ $t('termsUseItem3') }}</li>
                <li>{{ $t('termsUseItem4') }}</li>
              </ul>
              <h6>{{ $t('termsSecurity') }}</h6>
              <p>{{ $t('termsSecurityText') }}</p>
              <h6>{{ $t('termsUserRights') }}</h6>
              <p>{{ $t('termsUserRightsText') }}</p>
              <ul>
                <li>{{ $t('termsRight1') }}</li>
                <li>{{ $t('termsRight2') }}</li>
                <li>{{ $t('termsRight3') }}</li>
              </ul>
              <h6>{{ $t('termsChanges') }}</h6>
              <p>{{ $t('termsChangesText') }}</p>
              <h6>{{ $t('termsContact') }}</h6>
              <p>{{ $t('termsContactText') }}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t('termsClose') }}</button>
              <button type="button" class="btn btn-primary" @click="agreeToTerms">{{ $t('termsAgree') }}</button>
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