import { ROUTES } from '$lib/const';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	// fetch data from parent handler
	const { session } = await parent();

	// if user is already logged in, redirect them to drive page
	if (session) {
		throw redirect(301, ROUTES.DRIVE);
	}
};
