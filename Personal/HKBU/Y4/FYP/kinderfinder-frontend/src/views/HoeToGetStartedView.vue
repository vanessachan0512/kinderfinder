<script setup>

</script>

<template>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>

  <div class="container mt-5">
    <h1 class="text-center">How to Get Started</h1>

    <p>
      Welcome to KinderFinder! Choosing the right kindergarten is a vital decision that shapes your child's early learning experience. As you navigate this journey, consider what matters most: the school's atmosphere, the learning environment, and the values that match your family’s philosophy. Look for a nurturing space where your child can thrive. Remember, exploring options and asking questions during visits is crucial. You don’t have to do this alone—let us help you find the perfect kindergarten tailored to your needs! Follow these simple steps to find the perfect kindergarten for your child.
    </p>

    <!-- Steps -->
    <div class="step" data-bs-toggle="collapse" data-bs-target="#step1">
      <i class="fa fa-user-plus icon"></i>
      <strong>Step 1: Sign Up</strong>
      <div id="step1" class="collapse">
        <p class="mt-3">Create your account by clicking the Sign Up button on our homepage.</p>
      </div>
    </div>

    <div class="step" data-bs-toggle="collapse" data-bs-target="#step2">
      <i class="fa fa-pencil-alt icon"></i>
      <strong>Step 2: Profile Setup</strong>
      <div id="step2" class="collapse">
        <p class="mt-3">Complete your profile with your child's information for personalized recommendations.</p>
      </div>
    </div>

    <div class="step" data-bs-toggle="collapse" data-bs-target="#step3">
      <i class="fa fa-search icon"></i>
      <strong>Step 3: Explore Kindergartens</strong>
      <div id="step3" class="collapse">
        <p class="mt-3">Browse through kindergartens by location and preferences.</p>
      </div>
    </div>

    <div class="step" data-bs-toggle="collapse" data-bs-target="#step4">
      <i class="fa fa-star icon"></i>
      <strong>Step 4: Read Reviews</strong>
      <div id="step4" class="collapse">
        <p class="mt-3">Check reviews from other parents to gain insights.</p>
      </div>
    </div>

    <div class="step" data-bs-toggle="collapse" data-bs-target="#step5">
      <i class="fa fa-calendar-alt icon"></i>
      <strong>Step 5: Schedule Visits</strong>
      <div id="step5" class="collapse">
        <p class="mt-3">Contact kindergartens to schedule visits and meet teachers.</p>
      </div>
    </div>

    <div class="step" data-bs-toggle="collapse" data-bs-target="#step6">
      <i class="fa fa-check-circle icon"></i>
      <strong>Step 6: Choose the Right Kindergarten</strong>
      <div id="step6" class="collapse">
        <p class="mt-3">Consider factors like educational philosophy, location, facilities, and reviews.</p>
      </div>
    </div>

    <div class="step" data-bs-toggle="collapse" data-bs-target="#step7">
      <i class="fa fa-paper-plane icon"></i>
      <strong>Step 7: Enroll Your Child</strong>
      <div id="step7" class="collapse">
        <p class="mt-3">Follow the kindergarten's process to enroll your child.</p>
      </div>
    </div>

    <!-- Assistance -->
    <h3 class="mt-5">Need Assistance?</h3>
    <p>
      If you have any questions or require help at any step, feel free to reach out to our support team through <strong>kinderfindercs@gmail.com</strong>. We’re here to help!
    </p>
  </div>
</template>

<style scoped>
.step {
  margin: 20px 0;
  padding: 15px;
  background-color: #E1FFF6;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}
.icon {
  font-size: 2rem;
  color: #005B54;
  margin-right: 10px;
}
.step:hover {
  background-color: #B5F4E2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
