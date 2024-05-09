import { AUTH_GOOGLE_CLIENT_ID, AUTH_GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { google } from 'googleapis';

export function getGoogleAuth(refreshToken: string) {
	const auth = new google.auth.OAuth2({
		clientId: AUTH_GOOGLE_CLIENT_ID,
		clientSecret: AUTH_GOOGLE_CLIENT_SECRET
	});

	auth.setCredentials({
		refresh_token: refreshToken
	});

	return auth;
}
