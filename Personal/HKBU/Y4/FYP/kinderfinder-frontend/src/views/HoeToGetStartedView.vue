<script setup>

</script>

<template>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>

    <div class="container mt-5">
        <h1 class="text-center">{{ $t('howToGetStarted') }}</h1>

        <p>
        {{ $t('welcomeText') }}
        </p>

        <!-- Steps -->
        <div class="step" data-bs-target="#step1">
        <i class="fa fa-user-plus icon"></i>
        <strong>{{ $t('step1') }}</strong>
        <div id="step1">
            <p class="mt-3">{{ $t('step1Desc') }}</p>
        </div>
        </div>

        <div class="step" data-bs-target="#step2">
        <i class="fa fa-pencil-alt icon"></i>
        <strong>{{ $t('step2') }}</strong>
        <div id="step2">
            <p class="mt-3">{{ $t('step2Desc') }}</p>
        </div>
        </div>

        <div class="step" data-bs-target="#step3">
        <i class="fa fa-search icon"></i>
        <strong>{{ $t('step3') }}</strong>
        <div id="step3">
            <p class="mt-3">{{ $t('step3Desc') }}</p>
        </div>
        </div>

        <div class="step" data-bs-target="#step4">
        <i class="fa fa-star icon"></i>
        <strong>{{ $t('step4') }}</strong>
        <div id="step4">
            <p class="mt-3">{{ $t('step4Desc') }}</p>
        </div>
        </div>

        <div class="step" data-bs-target="#step5">
        <i class="fa fa-calendar-alt icon"></i>
        <strong>{{ $t('step5') }}</strong>
        <div id="step5">
            <p class="mt-3">{{ $t('step5Desc') }}</p>
        </div>
        </div>

        <div class="step" data-bs-target="#step6">
        <i class="fa fa-check-circle icon"></i>
        <strong>{{ $t('step6') }}</strong>
        <div id="step6">
            <p class="mt-3">{{ $t('step6Desc') }}</p>
        </div>
        </div>

        <div class="step" data-bs-target="#step7">
        <i class="fa fa-paper-plane icon"></i>
        <strong>{{ $t('step7') }}</strong>
        <div id="step7">
            <p class="mt-3">{{ $t('step7Desc') }}</p>
        </div>
        </div>

        <!-- Assistance -->
        <h3 class="mt-5">{{ $t('needAssistance') }}</h3>
        <p>
        {{ $t('assistanceText') }}
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
