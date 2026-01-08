<script setup>
import { ref, onMounted } from 'vue'
import { useSocketStore } from '@/store/socket'
import { jwtDecode } from "jwt-decode";
import i18n from '@/i18n' // adjust path if needed

const isLoggedIn = ref(!!localStorage.getItem('token'))
const isAdmin = ref(localStorage.getItem('isAdmin') === 'true')
const socketStore = useSocketStore()
const token = localStorage.getItem('token')
const decoded = token ? jwtDecode(token) : null

onMounted(() => {
  // Socket connection (safe)
  if (isLoggedIn.value && decoded && decoded._id) {
    socketStore.connect(decoded._id.toString());
  }

  // Font size
  document.documentElement.setAttribute('data-font-size', fontSize.value);
})
const logout = async () => {
  const token = localStorage.getItem('token')
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(response.statusText)

    localStorage.removeItem('token')
    localStorage.removeItem('isAdmin')
    // In logout function
    // bookmarkDataStore.clear()
    isAdmin.value = false
    isLoggedIn.value = false
    socketStore.disconnect()
    alert('Logout Successfully.')
    window.location.href = '/home'
  } catch (error) {
    console.error('Logout error:', error)
    alert('An error occurred during logout. Please try again.')
  }
}

const onLoginSuccess = () => {
  isLoggedIn.value = true
  isAdmin.value = localStorage.getItem('isAdmin') === 'true'
}

const setLang = (lang) => {
  i18n.global.locale.value = lang
  localStorage.setItem('lang', lang)
}

const fontSize = ref(localStorage.getItem('fontSize') || 'normal')

onMounted(() => {
  document.documentElement.setAttribute('data-font-size', fontSize.value)
})

const setFontSize = (size) => {
  fontSize.value = size
  localStorage.setItem('fontSize', size)
  document.documentElement.setAttribute('data-font-size', size)
}
</script>

<template>
  <header>
    <nav class="navbar navbar-expand-lg navbar-kinder fixed-top">
      <div class="container-fluid">
        <!-- Logo -->
        <a class="navbar-brand d-flex align-items-center" href="/home">
          <img src="/images/logo.png" alt="KinderFinder logo" class="navbar-logo">
        </a>

        <!-- Mobile toggler -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <!-- Main Links -->
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link active" href="/home">{{ $t('home') }}</a></li>
            <li class="nav-item"><a class="nav-link" href="/getstarted">{{ $t('getstarted') }}</a></li>
            <li class="nav-item"><a class="nav-link" href="/kindergartens">{{ $t('kindergartens') }}</a></li>
            <li class="nav-item"><a class="nav-link" href="/resources">{{ $t('articles') }}</a></li>
            <li class="nav-item"><a class="nav-link" href="/interviewtips">{{ $t('interviewTips') }}</a></li>
            <li class="nav-item"><a class="nav-link" href="/discussions">{{ $t('users') }}</a></li>
          </ul>

          <!-- Right Controls -->
          <div class="d-flex align-items-center gap-2">
            <!-- Language -->
            <div class="dropdown">
              <button class="btn nav-control-btn dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-globe" style="font-size:1.25rem;"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><button class="dropdown-item" @click="setLang('en')">English</button></li>
                <li><button class="dropdown-item" @click="setLang('zh')">繁體中文</button></li>
              </ul>
            </div>

            <!-- Font Size -->
            <div class="dropdown">
              <button class="btn nav-control-btn dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-textarea-t" style="font-size:1.25rem;"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><button class="dropdown-item d-flex align-items-center gap-3 py-2" @click="setFontSize('small')">
                  <span class="fw-bold" style="font-size:12px;">Aa</span> {{ $t('small') }}
                </button></li>
                <li><button class="dropdown-item d-flex align-items-center gap-3 py-2" @click="setFontSize('normal')">
                  <span class="fw-bold" style="font-size:16px;">Aa</span> {{ $t('normal') }}
                </button></li>
                <li><button class="dropdown-item d-flex align-items-center gap-3 py-2" @click="setFontSize('large')">
                  <span class="fw-bold" style="font-size:20px;">Aa</span> {{ $t('large') }}
                </button></li>
                <li><button class="dropdown-item d-flex align-items-center gap-3 py-2" @click="setFontSize('xlarge')">
                  <span class="fw-bold" style="font-size:24px;">Aa</span> {{ $t('extraLarge') }}
                </button></li>
              </ul>
            </div>

            <!-- Right Sidebar Toggle (only logged in) -->
            <template v-if="isLoggedIn">
              <button 
                class="btn nav-control-btn" 
                type="button" 
                data-bs-toggle="offcanvas" 
                data-bs-target="#personalSidebar" 
                aria-controls="personalSidebar"
                title="My Menu"
              >
                <i class="bi bi-list fs-3"></i>
              </button>
            </template>

            <!-- Login/Signup -->
            <template v-if="!isLoggedIn">
              <a class="btn nav-control-btn" href="/login" title="Login">
                <i class="bi bi-box-arrow-in-right" style="font-size:1.25rem;"></i>
              </a>
              <a class="btn nav-control-btn" href="/signup" title="Sign Up">
                <i class="bi bi-person-plus" style="font-size:1.25rem;"></i>
              </a>
            </template>
          </div>
        </div>
      </div>
    </nav>
  </header>

  <!-- Right Offcanvas Sidebar (inside header, no layout impact) -->
  <div class="offcanvas offcanvas-end kinder-offcanvas" tabindex="-1" id="personalSidebar" aria-labelledby="personalSidebarLabel" >
    <div class="offcanvas-header" style="background-color: #B5F4E2;">
      <h5 class="offcanvas-title fw-bold" id="personalSidebarLabel">{{ $t('myMenu') }}</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body p-4">
      <ul class="nav nav-pills flex-column gap-3">
         <li class="nav-item">
          <a href="/profile" class="nav-link d-flex align-items-center gap-3 rounded-pill py-3 px-4">
            <i class="bi bi-person-circle fs-4"></i>
            <span class="fw-medium">{{ $t('profile') }}</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="/calendar" class="nav-link d-flex align-items-center gap-3 rounded-pill py-3 px-4">
            <i class="bi bi-calendar-event fs-4"></i>
            <span class="fw-medium">{{ $t('calendar') }}</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="/my-saves" class="nav-link d-flex align-items-center gap-3 rounded-pill py-3 px-4">
            <i class="bi bi-bookmark-heart fs-4"></i>
            <span class="fw-medium">{{ $t('mySaves') }}</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="/my-discussions" class="nav-link d-flex align-items-center gap-3 rounded-pill py-3 px-4">
            <i class="bi bi-chat-dots fs-4"></i>
            <span class="fw-medium">{{ $t('myDiscussions') }}</span>
          </a>
        </li>
        <li class="nav-item mt-auto pt-4 border-top">
          <button @click="logout" class="nav-link d-flex align-items-center gap-3 rounded-pill py-3 px-4 text-danger w-100 text-start">
            <i class="bi bi-box-arrow-right fs-4"></i>
            <span class="fw-medium">{{ $t('logout') }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>

  <!-- Main Content -->
  <main class="pt-navbar">
    <RouterView v-slot="{ Component, route }" @login-success="onLoginSuccess">
      <keep-alive>
        <component 
          :is="Component" 
          v-if="route.meta.keepAlive"
          :key="route.fullPath"
        />
      </keep-alive>
      <component :is="Component" v-if="!route.meta.keepAlive" />
    </RouterView>
  </main>
</template>

<style>
/* Global styles - font size works! */
:root {
  --kinder-navbar-height: 85px;
}

.navbar-kinder {
  background-color: #B5F4E2 !important;
  min-height: var(--kinder-navbar-height);
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

.nav-control-btn:focus {
  outline: none;
  box-shadow: none;
}

/* Font size */
:root[data-font-size="small"] { font-size: 14px; }
:root[data-font-size="normal"] { font-size: 16px; }
:root[data-font-size="large"] { font-size: 18px; }
:root[data-font-size="xlarge"] { font-size: 20px; }

/* Layout */
.pt-navbar {
  padding-top: var(--kinder-navbar-height);
}

/* Offcanvas Sidebar Style */
.kinder-offcanvas {
  width: 320px !important;
}

.kinder-offcanvas .offcanvas-header {
  background: #B5F4E2;
}

.kinder-offcanvas .nav-link {
  color: #0a2b20;
  border-radius: 50px;
  padding: 14px 20px;
  transition: all 0.2s;
}

.kinder-offcanvas .nav-link:hover {
  background: rgba(181, 244, 226, 0.5);
}
</style>