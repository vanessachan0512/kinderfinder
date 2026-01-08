<script setup>

</script>

<template>
    <div class="content mt-5">
        <h1>{{ $t('verificationSuccessTitle') }}</h1>
        <p>
            {{ $t('verificationSuccessText') }}
        </p>
        <router-link to="/login" class="login-button">{{ $t('loginButton') }}</router-link>
    </div>
</template>

<style scoped>
    .content {
        display: flex;
        flex-direction: column;
        align-items: center; /* Center horizontally */
        /* justify-content: center; Center vertically */
        height: 100vh; /* Full height of the viewport */
        text-align: center; /* Center text */
    }
    h1 {
        font-size: 24px;
        margin-bottom: 16px;
    }
    p {
        margin-bottom: 24px;
        max-width: 600px;
    }
    .login-button {
        padding: 12px 24px;
        font-size: 16px;
        color: #fff;
        background-color: #007BFF;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        text-decoration: none;
        transition: background-color 0.3s;
    }
    .login-button:hover {
        background-color: #0056b3;
    }
</style>