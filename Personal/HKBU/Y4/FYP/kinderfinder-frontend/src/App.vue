<script setup>
import { ref } from 'vue';
import i18n from '../src/i18n';
import { onMounted } from 'vue'

onMounted(() => {
  console.log('Bootstrap available?', !!window.bootstrap)
  if (window.bootstrap) {
    console.log('Dropdown class exists:', window.bootstrap.Dropdown)
  }
})

const isLoggedIn = ref(!!localStorage.getItem('token'));
const isAdmin = ref(localStorage.getItem('isAdmin') === 'true');

const logout = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(response.statusText);

    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    isAdmin.value = false;
    alert("Logout Successfully.");
    window.location.href = "/home";  
  } catch (error) {
    console.error("Logout error:", error);
    alert("An error occurred during logout. Please try again.");
  }
};

const onLoginSuccess = () => {
  isLoggedIn.value = true;
  isAdmin.value = localStorage.getItem('isAdmin') === 'true';
};

// Language switch
const setLang = (lang) => {
  i18n.global.locale.value = lang;
  localStorage.setItem('lang', lang);
};

const fontSize = ref(localStorage.getItem('fontSize') || 'normal')

// Apply saved size on load
document.documentElement.setAttribute('data-font-size', fontSize.value)

const setFontSize = (size) => {
  fontSize.value = size
  localStorage.setItem('fontSize', size)

  // Apply to <html> so entire app scales
  document.documentElement.setAttribute('data-font-size', size)
}

</script>

<style>
:root {
  --kinder-navbar-height: 85px;
}
.navbar-kinder {
  background-color: #B5F4E2 !important;
  min-height: 85px;
}
.navbar-kinder .nav-link,
.navbar-kinder .navbar-brand,
.navbar-kinder .btn {
  color: #0a2b20 !important;
}
.navbar-kinder .navbar-brand img.navbar-logo {
  height: 85px;
  width: auto;
}
.nav-control-btn {
  color: #0a2b20;
  background: transparent;
  border: none;
  padding: 0.25rem 0.4rem;
}
.nav-control-btn:focus { outline: none; box-shadow: none; }

:root[data-font-size="small"] {
  font-size: 14px;
}

:root[data-font-size="normal"] {
  font-size: 16px;
}

:root[data-font-size="large"] {
  font-size: 18px;
}

:root[data-font-size="xlarge"] {
  font-size: 20px;
}

</style>

<template>
  
  <header>
    <nav class="navbar navbar-expand-lg navbar-kinder">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" href="/home">
          <img src="/images/logo.png" alt="KinderFinder logo" class="navbar-logo">
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link active" href="/home">{{ $t('home') }}</a></li>
            <li class="nav-item"><a class="nav-link" href="/getstarted">{{ $t('getstarted') }}</a></li>
            <li class="nav-item"><a class="nav-link" href="/kindergartens">{{ $t('kindergartens') }}</a></li>
            <li class="nav-item"><a class="nav-link" href="/resources">{{ $t('articles') }}</a></li>
            <li class="nav-item"><a class="nav-link" href="/discussions">{{ $t('users') }}</a></li>
          </ul>
          <div class="d-flex align-items-center">
            <!-- Calendar Button -->
            <template v-if="isLoggedIn">
              <a class="btn nav-control-btn ms-2" href="/calendar" title="Calendar">
                <i class="bi bi-calendar-event" style="font-size:1.3rem;"></i>
              </a>
            </template>

            <!-- Language Dropdown -->
            <div class="dropdown ms-2">
              <button 
                class="btn nav-control-btn dropdown-toggle" 
                type="button" 
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="bi bi-globe" style="font-size:1.25rem;"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><button class="dropdown-item" type="button" @click="setLang('en')">English</button></li>
                <li><button class="dropdown-item" type="button" @click="setLang('zh')">繁體中文</button></li>
              </ul>
            </div>

            <!-- Font Size Dropdown -->
            <div class="dropdown ms-2">
              <button 
                class="btn nav-control-btn dropdown-toggle" 
                type="button" 
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="bi bi-textarea-t" style="font-size:1.25rem;"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <button class="dropdown-item d-flex align-items-center gap-3 py-2" type="button" @click="setFontSize('small')">
                    <span class="fw-bold" style="font-size: 12px;">Aa</span>
                    Small
                  </button>
                </li>
                <li>
                  <button class="dropdown-item d-flex align-items-center gap-3 py-2" type="button" @click="setFontSize('normal')">
                    <span class="fw-bold" style="font-size: 16px;">Aa</span>
                    Normal
                  </button>
                </li>
                <li>
                  <button class="dropdown-item d-flex align-items-center gap-3 py-2" type="button" @click="setFontSize('large')">
                    <span class="fw-bold" style="font-size: 20px;">Aa</span>
                    Large
                  </button>
                </li>
                <li>
                  <button class="dropdown-item d-flex align-items-center gap-3 py-2" type="button" @click="setFontSize('xlarge')">
                    <span class="fw-bold" style="font-size: 24px;">Aa</span>
                    Extra Large
                  </button>
                </li>
              </ul>
            </div>

              <!-- Profile Button -->
            <template v-if="isLoggedIn">
              <a class="btn nav-control-btn ms-2" href="/profile" title="My Profile">
                <i class="bi bi-person-circle" style="font-size:1.3rem;"></i>
              </a>
            </template>

            <!-- Sign Up -->
            <template v-if="!isLoggedIn">
              <a class="btn nav-control-btn" href="/signup" title="Sign up">
                <i class="bi bi-person-plus" style="font-size:1.25rem;"></i> 
              </a>
            </template>
            <!-- Logout/Login -->
            <template v-if="isLoggedIn">
              <button class="btn nav-control-btn ms-2" @click="logout" title="Logout">
                <i class="bi bi-box-arrow-right" style="font-size:1.25rem; margin-right: 3px;"></i> 
              </button>
            </template>
            <template v-else>
              <a class="btn nav-control-btn ms-2" href="/login" title="Login">
                <i class="bi bi-box-arrow-in-right" style="font-size:1.25rem; margin-right: 3px;"></i> 
              </a>
            </template>
          </div>
        </div>
      </div>
    </nav>
  </header>

  <RouterView @login-success="onLoginSuccess" />
</template>
