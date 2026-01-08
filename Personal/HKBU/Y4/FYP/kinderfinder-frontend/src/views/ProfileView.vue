<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import 'emoji-picker-element';
import { jwtDecode } from "jwt-decode";
import { useI18n } from 'vue-i18n';


const router = useRouter();
const { t } = useI18n();

// ✅ Toast reference
let logoutToast = null;

// ✅ Initialize Bootstrap toast after mount
onMounted(() => {
  const toastEl = document.getElementById('logoutToast');
  if (toastEl && window.bootstrap) {
    logoutToast = new window.bootstrap.Toast(toastEl);
  }
});

// ✅ Show toast (non-blocking)
const showLogoutToast = () => {
  if (logoutToast) logoutToast.show();
};

// --- Get and decode token ---
const token = localStorage.getItem('token');
let decoded = null;

if (token) {
  try {
    decoded = jwtDecode(token);
  } catch (e) {
    console.error('Invalid token', e);
    localStorage.removeItem('token');
    router.push('/login');
  }
} else {
  router.push('/login');
}

// Get user ID from decoded token
const userId = decoded?._id || decoded?.id;

// --- User data from decoded token ---
const user = ref({
  firstName: decoded?.firstName || '',
  middleName: decoded?.middleName || '',
  lastName: decoded?.lastName || '',
  birth: decoded?.birth || '',
  gender: decoded?.gender || '',
  marital: decoded?.marital || null,
  country: decoded?.country || 'HK',
  email: decoded?.email || '',
  password: decoded?.password || '',
  username: decoded?.username || decoded?.sub || '',
  profileEmoji: decoded?.profileEmoji || '👶',
  profilePicture: decoded?.profilePicture || null,
  securityQuestion: decoded?.securityQuestion || ''
});

const profilePreview = ref(null);
const emojiPickerVisible = ref(false);
const editing = ref(false);
const changingPassword = ref(false);
const changingSecurity = ref(false);

const passwordVisible = ref(false);
const oldPassword = ref('');
const newPassword = ref('');
const passwordConfirm = ref('');
const isCheckingPassword = ref(false);
const isOldPasswordCorrect = ref(false);

const newSecurityQuestion = ref('');
const newSecurityAnswer = ref('');
const newSecurityAnswerConfirm = ref('');

// In <script setup>
const securityQuestions = [
  { value: "What is your mother's name?", key: 'securityQuestions.motherMaiden' },
  { value: "What is your father's name?", key: 'securityQuestions.father' },
  { value: "What was your first pet's name?", key: 'securityQuestions.firstPet' },
  { value: "What was your first school?", key: 'securityQuestions.firstSchool' },
  { value: "In which city were you born?", key: 'securityQuestions.birthCity' },
  { value: "What is your favorite childhood book?", key: 'securityQuestions.favoriteBook' },
];

const getTranslatedSecurityQuestion = (question) => {
  if (!question) return $t('notSet'); // or 'Not set'

  const map = {
    "What is your mother's name?": 'securityQuestions.motherMaiden',
    "What is your father's name?": 'securityQuestions.father',
    "What was your first pet's name?": 'securityQuestions.firstPet',
    "What was your first school?": 'securityQuestions.firstSchool',
    "In which city were you born?": 'securityQuestions.birthCity',
    "What is your favorite childhood book?": 'securityQuestions.favoriteBook'
  };

  const key = map[question];
  return key ? t(key) : question; // fallback to original if not found
};

const toggleEditing = () => {
  if (editing.value) {
    // When turning OFF editing → close emoji picker
    emojiPickerVisible.value = false;
  }
  editing.value = !editing.value;
};

// --- Format birth date for input type="date" ---
const birthDate = computed({
  get() {
    if (!user.value.birth) return '';
    const date = new Date(user.value.birth);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  },
  set(val) {
    user.value.birth = val ? `${val}T00:00:00.000Z` : '';
  }
});

onMounted(() => {
  if (user.value.profilePicture) {
    profilePreview.value = user.value.profilePicture;
  }
  newSecurityQuestion.value = user.value.securityQuestion;
});

const previewProfilePicture = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    profilePreview.value = e.target.result;
    user.value.profilePicture = e.target.result;
  };
  reader.readAsDataURL(file);
};

const toggleEmojiPicker = () => {
  emojiPickerVisible.value = !emojiPickerVisible.value;
};

const onEmojiClick = (event) => {
  user.value.profileEmoji = event.detail.unicode;
  profilePreview.value = null;
  emojiPickerVisible.value = false;
};

// ✅ Force logout (DB + local)
const forceLogout = async () => {
  const token = localStorage.getItem('token');

  try {
    await fetch("/api/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    console.error("Logout API error:", err);
  }

  localStorage.removeItem('token');
  localStorage.removeItem('isAdmin');

  router.push('/login');
};

// ✅ Save Profile
const saveProfile = async () => {
  if (!editing.value) return;
  if (!confirm(t('confirmchangeAccount'))) return;

  showLogoutToast(); // ✅ non-blocking toast
  setTimeout(() => { forceLogout();}, 300); 

  try {
    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: user.value.firstName,
        middleName: user.value.middleName,
        lastName: user.value.lastName,
        birth: user.value.birth,
        gender: user.value.gender,
        username: user.value.username,
        profileEmoji: user.value.profileEmoji,
        profilePicture: user.value.profilePicture
      })
    });
  } catch (err) {
    console.error('Backend error:', err.message);
  }
};

const resetPasswordState = () => {
  oldPassword.value = '';
  newPassword.value = '';
  passwordConfirm.value = '';
  isCheckingPassword.value = false;
  isOldPasswordCorrect.value = false;
  passwordVisible.value = false;
};

const checkCurrentPassword = () => {
  if (!oldPassword.value) {
    isOldPasswordCorrect.value = null;
    isCheckingPassword.value = false;
    return;
  }

  isCheckingPassword.value = true;

  // Simulate small delay for better UX
  setTimeout(() => {
    if (oldPassword.value === user.value.password) {
      isOldPasswordCorrect.value = true;
    } else {
      isOldPasswordCorrect.value = false;
    }
    isCheckingPassword.value = false;
  }, 600);
};

// ✅ Save Password
const savePassword = async () => {
  if (!confirm(t('confirmchangepassword'))) return;
  if (!oldPassword.value) return window.alert('Please enter your current password.');
  if (newPassword.value !== passwordConfirm.value) return window.alert('New passwords do not match.');
  if (newPassword.value.length < 8) return window.alert('New password must be at least 8 characters.');

  showLogoutToast();
  forceLogout();

  try {
    await fetch(`/api/users/${userId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: newPassword.value })
    });
  } catch (err) {
    console.error('Backend error:', err.message);
  }
};

// ✅ Save Security Question
const saveSecurityQuestion = async () => {
    if (!confirm(t('confirmchangequestion'))) return;
  if (!newSecurityQuestion.value) return window.alert('Please select a security question.');
  if (newSecurityAnswer.value !== newSecurityAnswerConfirm.value) return window.alert('Answers do not match.');
  if (newSecurityAnswer.value.length < 2) return window.alert('Answer too short.');

  showLogoutToast();
  forceLogout();

  try {
    await fetch(`/api/users/${userId}/security`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        securityQuestion: newSecurityQuestion.value,
        securityAnswer: newSecurityAnswer.value
      })
    });
  } catch (err) {
    console.error('Backend error:', err.message);
  }
};

async function deleteAccount() {
  if (!confirm(t('confirmDeleteAccount'))) return;

  try {
    const res = await fetch(`/api/users/${userId}/delete`, {
      method: 'PUT', // or PATCH
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAsDeleted: true })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to mark account as deleted');

    alert(t('accountDeleted'));
    // Clear local storage / token
    forceLogout();
    router.push('/signup');
  } catch (err) {
    console.error('Delete failed:', err);
    alert(t('deleteError'));
  }
}

</script>

<template>
    <div 
    id="logoutToast" 
    class="toast position-fixed bottom-0 end-0 m-4 text-bg-success border-0"
    role="alert"
    data-bs-delay="2000"
    style="z-index: 999999;"
    >

    <div class="d-flex">
      <div class="toast-body fw-semibold">
        {{ $t('loggingOut') }}
      </div>
    </div>
  </div>

  <div class="min-vh-100 bg-gradient-light py-5">
    <div class="container-fluid px-4 px-lg-5">
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">{{ $t('profileTitle') }}</h2>
        <p class="lead text-muted col-lg-10 mx-auto">
          {{ $t('profileSubtitle') }}
        </p>
      </div>

      <div class="row justify-content-center">
        <div class="col-12">
          <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div class="card-body p-4 p-md-5">
              <div class="row g-5 align-items-start">
                <!-- Avatar -->
                <div class="col-lg-4 text-center">
                  <h4 class="mb-4">{{ $t('yourIcon') }}</h4>
                  <div class="profile-avatar mx-auto mb-4">
                    <img v-if="profilePreview || user.profilePicture" :src="profilePreview || user.profilePicture" class="rounded-circle shadow" style="width: 240px; height: 240px; object-fit: cover;" />
                    <div v-else class="emoji-display">{{ user.profileEmoji }}</div>
                  </div>
                  <p class="mb-4 text-muted">{{ $t('yourIconDescription') }}</p>

                  <div class="d-grid gap-3" v-if="editing">
                    <!-- <label class="btn btn-outline-primary btn-lg rounded-pill">
                      {{ $t('changePhoto') }}
                      <input type="file" @change="previewProfilePicture" accept="image/*" class="d-none" />
                    </label> -->
                    <button @click="toggleEmojiPicker" class="btn btn-outline-primary btn-lg rounded-pill">{{ $t('pickEmoji') }}</button>
                  </div>

                    <!-- Delete Account Button -->
                    <div class="mt-4">
                        <button 
                        @click="deleteAccount" 
                        class="btn btn-outline-danger btn-lg rounded-pill px-4 shadow-sm">
                        {{ $t('deleteAccount') }}
                        </button>
                    </div>

                  <div v-if="emojiPickerVisible" class="mt-4 bg-white rounded-4 shadow p-3">
                    <emoji-picker @emoji-click="onEmojiClick"></emoji-picker>
                  </div>
                </div>

                <!-- Profile Details -->
                <div class="col-lg-8">
                  <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4>{{ $t('personalInfo') }}</h4>
                    <button @click="toggleEditing" class="btn btn-outline-primary rounded-pill">
                      {{ editing ? $t('cancel') : $t('edit') }}
                    </button>
                  </div>

                  <form @submit.prevent="saveProfile">
                    <div class="row g-4">
                      <div class="col-md-6"><label class="form-label fw-semibold">{{ $t('firstName') }}</label><input v-model="user.firstName" :disabled="!editing" type="text" class="form-control form-control-lg rounded-pill" /></div>
                      <div class="col-md-6"><label class="form-label fw-semibold">{{ $t('middleName') }}</label><input v-model="user.middleName" :disabled="!editing" type="text" class="form-control form-control-lg rounded-pill" /></div>
                      <div class="col-md-6"><label class="form-label fw-semibold">{{ $t('lastName') }}</label><input v-model="user.lastName" :disabled="!editing" type="text" class="form-control form-control-lg rounded-pill" /></div>
                      <div class="col-md-6"><label class="form-label fw-semibold">{{ $t('username') }}</label><input v-model="user.username" :disabled="!editing" type="text" class="form-control form-control-lg rounded-pill" /></div>

                      <div class="col-md-6"><label class="form-label fw-semibold">{{ $t('email') }}</label><input :value="user.email" disabled class="form-control form-control-lg rounded-pill bg-light" /></div>
                      <div class="col-md-6"><label class="form-label fw-semibold">{{ $t('dateOfBirth') }}</label><input v-model="birthDate" :disabled="!editing" type="date" class="form-control form-control-lg rounded-pill" /></div>

                      <div class="col-md-6"><label class="form-label fw-semibold">{{ $t('gender') }}</label>
                        <select v-model="user.gender" :disabled="!editing" class="form-select form-control-lg rounded-pill">
                          <option value="" disabled>{{ $t('selectGender') }}</option>
                          <option value="female">{{ $t('female') }}</option>
                          <option value="male">{{ $t('male') }}</option>
                          <option value="other">{{ $t('other') }}</option>
                          <option value="prefer-not">{{ $t('preferNotToSay') }}</option>
                        </select>
                      </div>

                      <div class="col-12 text-end" v-if="editing">
                        <button type="submit" class="btn btn-primary btn-lg rounded-pill px-5 shadow-sm">{{ $t('saveChanges') }}</button>
                      </div>
                    </div>
                  </form>

                  <hr class="my-5">

                 <!-- Change Password -->
                <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5>{{ $t('changePassword') }}</h5>
                    <button 
                    @click="changingPassword = !changingPassword; resetPasswordState()" 
                    class="btn btn-outline-secondary rounded-pill"
                    >
                    {{ changingPassword ? $t('cancel') : $t('change') }}
                    </button>
                </div>

                <div v-if="changingPassword" class="row g-4">
                    <!-- Current Password -->
                    <div class="col-8">
                    <label class="form-label fw-semibold">{{ $t('currentPassword') }}</label>
                    <div class="input-group">
                        <input
                        v-model="oldPassword"
                        @input="checkCurrentPassword"
                        :type="passwordVisible ? 'text' : 'password'"
                        class="form-control form-control-lg rounded-pill"
                        :placeholder="$t('currentPassword')"
                        required
                        />
                        <button
                        type="button"
                        class="btn btn-outline-secondary rounded-pill"
                        style="margin-left: 2%;"
                        @click="passwordVisible = !passwordVisible"
                        >
                        <i :class="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                        </button>
                    </div>

                    <!-- Feedback with loading -->
                    <div class="mt-2">
                        <small v-if="isCheckingPassword" class="text-muted d-flex align-items-center gap-1">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        {{ $t('checkingPassword') }}
                        </small>
                        <small v-else-if="isOldPasswordCorrect === true" class="text-success">
                        {{ $t('passwordCorrect') }}
                        </small>
                        <small v-else-if="isOldPasswordCorrect === false" class="text-danger">
                        {{ $t('passwordIncorrect') }}
                        </small>
                    </div>
                    </div>

                    <!-- New Password -->
                    <div class="col-md-6">
                    <label class="form-label fw-semibold">{{ $t('newPassword') }}</label>
                    <div class="input-group">
                        <input
                        v-model="newPassword"
                        :type="passwordVisible ? 'text' : 'password'"
                        class="form-control form-control-lg rounded-pill"
                        :placeholder="$t('newPassword2')"
                        :disabled="!isOldPasswordCorrect"
                        required
                        />
                        <button
                        type="button"
                        class="btn btn-outline-secondary rounded-pill"
                        @click="passwordVisible = !passwordVisible"
                        style="margin-left: 2%;"
                        :disabled="!isOldPasswordCorrect"
                        >
                        <i :class="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                        </button>
                    </div>
                    </div>

                    <!-- Confirm New Password -->
                    <div class="col-md-6">
                    <label class="form-label fw-semibold">{{ $t('confirmNewPassword') }}</label>
                    <div class="input-group">
                        <input
                        v-model="passwordConfirm"
                        type="password"
                        class="form-control form-control-lg rounded-pill"
                        :placeholder="$t('confirmNewPassword')"
                        :disabled="!isOldPasswordCorrect"
                        required
                        />
                    </div>
                    </div>

                    <!-- Update Button -->
                    <div class="col-12 text-end mt-4">
                    <button
                        @click="savePassword"
                        :disabled="!isOldPasswordCorrect || newPassword !== passwordConfirm || newPassword.length < 8"
                        class="btn btn-primary btn-lg rounded-pill px-5 shadow-sm"
                    >
                        {{ $t('updatePassword') }}
                    </button>
                    </div>
                </div>
                </div>
                  <hr class="my-5">

                  <!-- Security Question & Answer -->
                  <div>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h5>{{ $t('securityQuestionTitle') }}</h5>
                      <button @click="changingSecurity = !changingSecurity" class="btn btn-outline-secondary rounded-pill">{{ changingSecurity ? $t('cancel') : $t('change') }}</button>
                    </div>
                    <p class="text-muted small mb-4">{{ $t('securityQuestionSubtitle') }}</p>

                    <div v-if="!changingSecurity" class="p-3 bg-light rounded-4">
                      <strong>{{ getTranslatedSecurityQuestion(user.securityQuestion) }}</strong>
                    </div>

                    <div v-else class="row g-4">
                      <div class="col-12">
                        <label class="form-label fw-semibold">{{ $t('securityQuestion') }}</label>
                        <select v-model="newSecurityQuestion" class="form-select form-control-lg rounded-pill">
                          <option value="" disabled>{{ $t('chooseQuestion') }}</option>
                         <option v-for="q in securityQuestions" :key="q.value" :value="q.value">
                            {{ $t(q.key) }}
                        </option>
                        </select>
                      </div>
                      <div class="col-md-6"><label class="form-label fw-semibold">{{ $t('newAnswer') }}</label><input v-model="newSecurityAnswer" type="text" class="form-control form-control-lg rounded-pill" required /></div>
                      <div class="col-md-6"><label class="form-label fw-semibold">{{ $t('confirmAnswer') }}</label><input v-model="newSecurityAnswerConfirm" type="text" class="form-control form-control-lg rounded-pill" required /></div>
                      <div class="col-12 text-end">
                        <!-- <button @click="cancelSecurity" class="btn btn-secondary rounded-pill me-3">Cancel</button> -->
                        <button @click="saveSecurityQuestion" class="btn btn-primary rounded-pill px-5">{{ $t('save') }}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<style scoped>
.bg-gradient-light { background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%); }
.card { box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
.profile-avatar {
  width: 240px; height: 240px;
  background: rgba(122, 239, 206, 0.2);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  border: 6px solid rgba(122, 239, 206, 0.3); margin: 0 auto;
}
.emoji-display { font-size: 140px; }
.btn-primary { background: linear-gradient(135deg, #7aefce 0%, #98edd5 100%); border: none; font-weight: 600; color: #0f172a;}
.btn-primary:hover { background: linear-gradient(135deg, #6be8c4 0%, #8ae8cb 100%); }
.form-control-lg, .form-select-lg { border-radius: 50px; padding: 0.75rem 1.5rem; }
.input-group .btn { border-radius: 50px !important; }
</style>