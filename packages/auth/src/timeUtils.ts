export function epochAtSecondsFromNow(seconds: number): number {
	return Math.round(Date.now() / 1000) + seconds;
}

export function epochTimeIsPast(epochTime: number | undefined | null): boolean {
	if (epochTime === undefined || epochTime === null) return false;
	return epochTime < Math.round(Date.now() / 1000);
}

export const FALLBACK_EXPIRE_TIME = 3600; // seconds

export function getRefreshExpiresIn(
	tokenExpiresIn: number,
	response: { refresh_expires_in?: number; refresh_token_expires_in?: number },
): number {
	// Most servers (Keycloak, Microsoft, Github, etc.)
	// only return 'expires_in' from auth endpoint, while refresh uses the default values
	// Keycloak: 1800 seconds
	// Microsoft: 24 hours
	// Github: 8 hours
	// FusionAuth: 7 days
	return (
		response.refresh_expires_in ??
		response.refresh_token_expires_in ??
		Math.max(1800, tokenExpiresIn * 1.5)
	);
}
