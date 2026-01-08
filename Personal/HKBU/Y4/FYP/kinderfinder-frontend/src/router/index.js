import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';

const routes = [
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/signup',
      name: 'Sign Up',
      component: () => import('../views/SignUpView.vue')
    },
    {
      path: '/profile',
      name: 'Personal Profile',
      component: () => import('../views/ProfileView.vue')
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('../views/CalendarView.vue')
    },
    {
      path: '/my-saves',
      name: 'Bookmarks',
      component: () => import('../views/BookmarkView.vue'),
      meta: { keepAlive: true }
    },
    {
      path: '/my-discussions',
      name: 'My Discussions',
      component: () => import('../views/MyDiscussionView.vue'),
      meta: { keepAlive: true }
    },
    {
      path: '/verify/:email',
      name: 'Verify',
      component: () => import('../views/VerifyView.vue'),
      props: true
    },
    {
      path: '/verifysuccessful',
      name: 'Verify Successful',
      props: true,
      component: () => import('../views/VeirfySuccessView.vue')
    },
    {
      path: '/forgot-password',
      name: 'Forrot Password',
      component: () => import('../views/ResetPassswordView.vue')
    },
    {
      path: '/getstarted',
      name: 'Get Started',
      component: () => import('../views/HoeToGetStartedView.vue')
    },
    {
      path: '/resources',
      name: 'Resources',
      component: () => import('../views/ResourcesView.vue'),
      meta: { keepAlive: true }
    },
    {
      path: '/resources/detail/:sectionID/:articleId',
      name: 'DetailResources',
      component: () => import('../views/DetailResourcesView.vue'),
      props: true
    },
    {
      path: '/resource/add',
      name: 'Add Resource',
      component: () => import('../views/AddResourceView.vue')
    },
    {
      path: '/resource/edit/:sectionID/:articleId',
      name: 'Edit Resource',
      component: () => import('../views/AddResourceView.vue')
    },
    {
      path: '/discussions',
      name: 'All discussions',
      component: () => import('../views/DiscussionsView.vue'),
      meta: { keepAlive: true }
    },
    {
      path: '/discussion/add',
      name: 'Add discussions',
      component: () => import('../views/AddDiscussionView.vue')
    },
        {
      path: '/discussion/edit/:discussionId',
      name: 'Edit discussions',
      component: () => import('../views/AddDiscussionView.vue')
    },
    {
      path: '/discussion/detail/:discussionId',
      name: 'Detaildiscussions',
      component: () => import('../views/DetailDiscussionView.vue'),
      props: true
    },
    {
      path: '/kindergartens',
      name: 'All kindergartens',
      component: () => import('../views/KindergartensView.vue'),
      meta: { keepAlive: true }
    },
    {
      path: '/kindergarten/detail/:kindergartenId',
      name: 'Detail kindergarten',
      component: () => import('../views/DetailKindergartenView.vue'),
      props: true
    },
    {
      path: '/compare',
      name: 'Compare',
      component: () => import('../views/CompareView.vue')
    },
    {
      path: '/interviewtips',
      name: 'Interview Tips',
      component: () => import('../views/InterviewTipsView.vue')
    },

];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;