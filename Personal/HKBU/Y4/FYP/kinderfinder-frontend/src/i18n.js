import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    home: 'Home',
    getstarted: 'How to Get Started',
    kindergartens: 'Kindergartens',
    articles: 'Resources',
    users: 'Discussion Board',
    signup: 'Sign Up',
    login: 'Login',
    logout: 'Logout'
  },
  zh: {
    home: '首頁',
    getstarted: '如何開始',
    kindergartens: '幼稚園',
    articles: '資源',
    users: '討論區',
    signup: '註冊',
    login: '登入',
    logout: '登出'
  }
};

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'en', // default language
  fallbackLocale: 'en',
  messages,
});

export default i18n;
