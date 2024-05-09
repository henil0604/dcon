import { prisma } from '$lib/server/db';

export async function getUserRefreshToken(userId: string) {
	return (
		(
			await prisma.account.findFirst({
				where: {
					userId
				},
				select: {
					refresh_token: true
				}
			})
		)?.refresh_token || null
	);
}
