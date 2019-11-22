<script>
    export let myForm;
    export let data;
    export let emailVisible;
    import {bindClass} from 'svelte-forms';
</script>
<h1>Shipping step</h1>
<div class="input-box">
    <label for="">First name</label>
    <input type="text" bind:value={data['shipping_firstname']} use:bindClass={{ form: myForm, valid: 'validation-passed', invalid: 'validation-passed' }}/>
    {#if $myForm.shipping_firstname.errors.includes('required') }
      <p class="validation-error">This is required field</p>
    {/if}
</div>

{#if emailVisible}
    <div class="input-box">
        <label for="">Last name</label>
        <input type="text" bind:value={data['shipping_lastname']} use:bindClass={{ form: myForm, valid: 'validation-passed', invalid: 'validation-passed' }}/>
        {#if $myForm.shipping_lastname.errors.includes('required') }
        <p class="validation-error">This is required field</p>
        {/if}
    </div>
{/if}

<div class="input-box">
    <label for="">Email</label>
    <input type="text" bind:value={data['shipping_email']} use:bindClass={{ form: myForm, valid: 'validation-passed', invalid: 'validation-passed' }}/>
    {#if $myForm.shipping_email.errors.includes('required') }
      <p class="validation-error">This is required field</p>
    {/if}
    {#if $myForm.shipping_email.errors.includes('email') }
      <p class="validation-error">Please enter correct email</p>
    {/if}
</div>

<style>
    .validation-error {
        color: red;
        margin: 0;
    }

    .input-box {
        margin-top: 20px;
    }

    h1 {
        margin: 0;
    }

    input {
        margin: 0;
        outline: none;
    }

    .validation-passed {
        border-color: green;
    }

    .validation-failed {
        border-color: red;
    }
</style>

