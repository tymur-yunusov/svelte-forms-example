<script>
    import { form } from 'svelte-forms';
    import { bindClass } from 'svelte-forms'
    import ShippingStep from './ShippingStep.svelte';
    import BillingStep from './BillingStep.svelte';
    let stepNumber = 1;
    export let emailVisible = true;
    export let data = {
        'shipping_firstname': '',
        'shipping_lastname': '',
        'shipping_email': '',
        'billing_firstname': '',
        'billing_lastname': '',
        'billing_email': ''
    };

    const myForm = form(() => ({
      shipping_firstname: { value: data['shipping_firstname'], validators: ["required"]},
      shipping_lastname: { value: data['shipping_lastname'], validators: ["required"]},
      shipping_email: { value: data['shipping_email'], validators: ["required", "email"]},
      billing_firstname: { value: data['billing_firstname'], validators: ["required"]},
      billing_lastname: { value: data['billing_lastname'], validators: ["required"]},
      billing_email: { value: data['billing_email'], validators: ["required"]},
    }));
</script>

<main>
	<form class="myForm">
        {#if stepNumber == 1}
            <ShippingStep {myForm} bind:data {emailVisible}/>
        {:else}
            <BillingStep {myForm} bind:data/>
        {/if}


        {#if stepNumber == 1}
            <button on:click|preventDefault={() => stepNumber = 2}>Next step</button>
        {:else}
            <button on:click|preventDefault={() => stepNumber = 1}>Previous step</button>
        {/if}

        <button on:click|preventDefault={() => emailVisible = !emailVisible}> {emailVisible ? 'Hide' : 'Show'} lastname</button>
        <p>Form valid: {$myForm.valid}</p>
    </form>

</main>

<style>
    .myForm {
        border: 1px solid lightgray;
        padding: 20px;
        max-width: 400px;
        margin: 0 auto;
    }

    button {
        margin-top: 20px;
    }
</style>