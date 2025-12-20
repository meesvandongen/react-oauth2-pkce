export class FetchError extends Error {
	status?: number;
	statusText?: string;
	body?: string;

	constructor(status?: number, statusText?: string, body?: string) {
		super(statusText);
		this.status = status;
		this.statusText = statusText;
		this.body = body;
	}
}
