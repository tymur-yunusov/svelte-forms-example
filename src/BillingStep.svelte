<script>
    export let myForm;
    export let data;
    import { bindClass } from 'svelte-forms';
</script>

<h1>Billing step</h1>
<div class="input-box">
    <label for="">First name</label>
    <input type="text" bind:value={data['billing_firstname']} use:bindClass={{ form: myForm, valid: 'validation-passed', invalid: 'validation-passed' }}/>
    {#if $myForm.billing_firstname.errors.includes('required') }
      <p class="validation-error">This is required field</p>
    {/if}
</div>

<div class="input-box">
    <label for="">Last name</label>
    <input type="text" bind:value={data['billing_lastname']} use:bindClass={{ form: myForm, valid: 'validation-passed', invalid: 'validation-passed' }}/>
    {#if $myForm.billing_lastname.errors.includes('required') }
      <p class="validation-error">This is required field</p>
    {/if}
</div>

<div class="input-box">
    <label for="">First name</label>
    <input type="text" bind:value={data['billing_email']} use:bindClass={{ form: myForm, valid: 'validation-passed', invalid: 'validation-passed' }}/>
    {#if $myForm.billing_email.errors.includes('required') }
      <p class="validation-error">This is required field</p>
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