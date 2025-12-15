<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import 'emoji-picker-element';
import { jwtDecode } from "jwt-decode";

const router = useRouter();

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

const securityQuestions = [
  "What is your mother's maiden name?",
  "What was your first pet's name?",
  "What was your first school?",
  "In which city were you born?",
  "What is your favorite childhood book?",
  "What is your mother's name?"
];

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

// ✅ Save Password
const savePassword = async () => {
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
        Updating… Logging you out.
      </div>
    </div>
  </div>

  <div class="min-vh-100 bg-gradient-light py-5">
    <div class="container-fluid px-4 px-lg-5">
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">My Profile 👨‍👩‍👧‍👦</h2>
        <p class="lead text-muted col-lg-10 mx-auto">
          Manage your account details and how other parents see you on KinderFinder.
        </p>
      </div>

      <div class="row justify-content-center">
        <div class="col-12">
          <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div class="card-body p-4 p-md-5">
              <div class="row g-5 align-items-start">
                <!-- Avatar -->
                <div class="col-lg-4 text-center">
                  <h4 class="mb-4">Your Icon</h4>
                  <div class="profile-avatar mx-auto mb-4">
                    <img v-if="profilePreview || user.profilePicture" :src="profilePreview || user.profilePicture" class="rounded-circle shadow" style="width: 240px; height: 240px; object-fit: cover;" />
                    <div v-else class="emoji-display">{{ user.profileEmoji }}</div>
                  </div>
                  <p class="mb-4 text-muted">This is how others see you!</p>

                  <div class="d-grid gap-3" v-if="editing">
                    <label class="btn btn-outline-primary btn-lg rounded-pill">
                      Change Photo
                      <input type="file" @change="previewProfilePicture" accept="image/*" class="d-none" />
                    </label>
                    <button @click="toggleEmojiPicker" class="btn btn-outline-primary btn-lg rounded-pill">Pick Emoji</button>
                  </div>

                  <div v-if="emojiPickerVisible" class="mt-4 bg-white rounded-4 shadow p-3">
                    <emoji-picker @emoji-click="onEmojiClick"></emoji-picker>
                  </div>
                </div>

                <!-- Profile Details -->
                <div class="col-lg-8">
                  <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4>Personal Information</h4>
                    <button @click="editing = !editing" class="btn btn-outline-primary rounded-pill">
                      {{ editing ? 'Cancel' : 'Edit' }}
                    </button>
                  </div>

                  <form @submit.prevent="saveProfile">
                    <div class="row g-4">
                      <div class="col-md-6"><label class="form-label fw-semibold">First Name</label><input v-model="user.firstName" :disabled="!editing" type="text" class="form-control form-control-lg rounded-pill" /></div>
                      <div class="col-md-6"><label class="form-label fw-semibold">Middle Name</label><input v-model="user.middleName" :disabled="!editing" type="text" class="form-control form-control-lg rounded-pill" /></div>
                      <div class="col-md-6"><label class="form-label fw-semibold">Last Name</label><input v-model="user.lastName" :disabled="!editing" type="text" class="form-control form-control-lg rounded-pill" /></div>
                      <div class="col-md-6"><label class="form-label fw-semibold">Username</label><input v-model="user.username" :disabled="!editing" type="text" class="form-control form-control-lg rounded-pill" /></div>

                      <div class="col-md-6"><label class="form-label fw-semibold">Email</label><input :value="user.email" disabled class="form-control form-control-lg rounded-pill bg-light" /></div>
                      <div class="col-md-6"><label class="form-label fw-semibold">Date of Birth</label><input v-model="birthDate" :disabled="!editing" type="date" class="form-control form-control-lg rounded-pill" /></div>

                      <div class="col-md-6"><label class="form-label fw-semibold">Gender</label>
                        <select v-model="user.gender" :disabled="!editing" class="form-select form-control-lg rounded-pill">
                          <option value="" disabled>Select...</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="other">Other</option>
                          <option value="prefer-not">Prefer not to say</option>
                        </select>
                      </div>

                      <div class="col-12 text-end" v-if="editing">
                        <button type="submit" class="btn btn-primary btn-lg rounded-pill px-5 shadow-sm">Save Changes</button>
                      </div>
                    </div>
                  </form>

                  <hr class="my-5">

                 <!-- Change Password -->
                <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5>Change Password</h5>
                    <button 
                    @click="changingPassword = !changingPassword; resetPasswordState()" 
                    class="btn btn-outline-secondary rounded-pill"
                    >
                    {{ changingPassword ? 'Cancel' : 'Change' }}
                    </button>
                </div>

                <div v-if="changingPassword" class="row g-4">
                    <!-- Current Password -->
                    <div class="col-8">
                    <label class="form-label fw-semibold">Current Password</label>
                    <div class="input-group">
                        <input
                        v-model="oldPassword"
                        @input="checkCurrentPassword"
                        :type="passwordVisible ? 'text' : 'password'"
                        class="form-control form-control-lg rounded-pill"
                        placeholder="Enter current password"
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
                        Checking current password...
                        </small>
                        <small v-else-if="isOldPasswordCorrect === true" class="text-success">
                        ✓ Current password is correct
                        </small>
                        <small v-else-if="isOldPasswordCorrect === false" class="text-danger">
                        ✗ Current password is incorrect
                        </small>
                    </div>
                    </div>

                    <!-- New Password -->
                    <div class="col-md-6">
                    <label class="form-label fw-semibold">New Password</label>
                    <div class="input-group">
                        <input
                        v-model="newPassword"
                        :type="passwordVisible ? 'text' : 'password'"
                        class="form-control form-control-lg rounded-pill"
                        placeholder="Enter new password"
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
                    <label class="form-label fw-semibold">Confirm New Password</label>
                    <div class="input-group">
                        <input
                        v-model="passwordConfirm"
                        type="password"
                        class="form-control form-control-lg rounded-pill"
                        placeholder="Confirm new password"
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
                        Update Password
                    </button>
                    </div>
                </div>
                </div>
                  <hr class="my-5">

                  <!-- Security Question & Answer -->
                  <div>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h5>Security Question & Answer</h5>
                      <button @click="changingSecurity = !changingSecurity" class="btn btn-outline-secondary rounded-pill">{{ changingSecurity ? 'Cancel' : 'Change' }}</button>
                    </div>
                    <p class="text-muted small mb-4">Used for account recovery</p>

                    <div v-if="!changingSecurity" class="p-3 bg-light rounded-4">
                      <strong>{{ user.securityQuestion || 'Not set' }}</strong>
                    </div>

                    <div v-else class="row g-4">
                      <div class="col-12">
                        <label class="form-label fw-semibold">Security Question</label>
                        <select v-model="newSecurityQuestion" class="form-select form-control-lg rounded-pill">
                          <option value="" disabled>Choose a question...</option>
                          <option v-for="q in securityQuestions" :key="q" :value="q">{{ q }}</option>
                        </select>
                      </div>
                      <div class="col-md-6"><label class="form-label fw-semibold">New Answer</label><input v-model="newSecurityAnswer" type="text" class="form-control form-control-lg rounded-pill" required /></div>
                      <div class="col-md-6"><label class="form-label fw-semibold">Confirm Answer</label><input v-model="newSecurityAnswerConfirm" type="text" class="form-control form-control-lg rounded-pill" required /></div>
                      <div class="col-12 text-end">
                        <!-- <button @click="cancelSecurity" class="btn btn-secondary rounded-pill me-3">Cancel</button> -->
                        <button @click="saveSecurityQuestion" class="btn btn-primary rounded-pill px-5">Save</button>
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