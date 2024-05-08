<script>
	import { Button } from '$lib/components/ui/button';
	import { ROUTES } from '$lib/const';
	import { signIn } from '@auth/sveltekit/client';
	import FileWithLock from '$lib/components/svg/FileWithLock.svelte';
</script>

<div class="wrapper">
	<!-- left hero -->
	<div class="left">
		<h1><span class="text-green-600">D</span><span class="text-slate-950">Con</span></h1>
		<p class="tagline">Securing Your Data Like a <span class="text-green-600">Pro!</span></p>
		<div class="my-1" />
		<p class="description">
			DCon provides extra layer of security by <span class="text-green-700">encrypting</span> and
			<span class="text-green-700">splitting</span>
			your files into pieces.
		</p>

		<div class="my-5" />

		<Button
			on:click={() =>
				signIn('google', {
					callbackUrl: ROUTES.DRIVE
				})}>Get Started</Button
		>
	</div>
	<!-- right hero -->
	<div class="right">
		<FileWithLock size={'400'} />
	</div>
</div>

<style lang="scss" scoped>
	.wrapper {
		@apply container grid-cols-2;
		display: grid;
		width: 100%;
		padding: theme('padding.32') theme('padding.8');

		.left {
			padding-right: theme('padding.40');

			h1 {
				font-size: theme('fontSize.7xl');
				font-weight: theme('fontWeight.extrabold');
			}

			.tagline {
				font-size: theme('fontSize.2xl');
				font-weight: theme('fontWeight.medium');
				padding-left: theme('padding.1');
			}

			.description {
				padding-left: theme('padding.1');
			}
		}
		.right {
			@apply flex items-center justify-center;
		}
	}

	@media only screen and (width < 600px) {
		.wrapper {
			@apply grid-cols-1;
			padding: theme('padding.16') theme('padding.8');

			.left {
				padding-right: 0;
			}
		}
	}
</style>
