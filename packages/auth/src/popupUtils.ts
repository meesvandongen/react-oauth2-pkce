import type { PopupPosition } from "./types";

export function calculatePopupPosition(
	width: number,
	height: number,
): PopupPosition {
	const top = window.innerHeight / 2 + window.screenY - height / 2;
	const left = window.innerWidth / 2 + window.screenX - width / 2;
	return { left, top, width, height };
}
