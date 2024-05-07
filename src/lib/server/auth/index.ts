import { AUTH_GOOGLE_CLIENT_ID, AUTH_GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { SvelteKitAuth } from '@auth/sveltekit';
import GoogleProvider from '@auth/sveltekit/providers/google';

const GOOGLE_SCOPES = [
	'openid',
	'https://www.googleapis.com/auth/userinfo.email',
	'https://www.googleapis.com/auth/userinfo.profile',
	'https://www.googleapis.com/auth/drive'
];

export const { handle: authHandle } = SvelteKitAuth({
	providers: [
		GoogleProvider({
			clientId: AUTH_GOOGLE_CLIENT_ID,
			clientSecret: AUTH_GOOGLE_CLIENT_SECRET,
			authorization: {
				params: {
					prompt: 'consent',
					access_type: 'offline',
					response_type: 'code',
					scope: GOOGLE_SCOPES.join(' ')
				}
			}
		})
	]
});
