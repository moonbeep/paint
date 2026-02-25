import { CANVAS_SIZE } from '$lib/constants';
import { PALETTE } from '$lib/utils/colors';

export function download(pixels: Uint8Array | Uint8ClampedArray) {
	// 1. Create a temporary canvas
	const canvas = document.createElement('canvas');
	canvas.width = CANVAS_SIZE;
	canvas.height = CANVAS_SIZE;
	const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

	if (!ctx) {
		console.error('Failed to get 2D context for export');
		return;
	}

	// 2. Render the pixels
	// Optimization: Create an ImageData object for massive performance boost
	const imgData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
	const data = imgData.data; // The Uint8ClampedArray (r, g, b, a)

	for (let i = 0; i < pixels.length; i++) {
		const colorHex = PALETTE[pixels[i]];

		// Parse Hex to RGB
		// We know our colors are standard 7-char hex strings (#RRGGBB)
		const r = parseInt(colorHex.slice(1, 3), 16);
		const g = parseInt(colorHex.slice(3, 5), 16);
		const b = parseInt(colorHex.slice(5, 7), 16);

		// Map to ImageData (4 slots per pixel)
		const idx = i * 4;
		data[idx] = r;
		data[idx + 1] = g;
		data[idx + 2] = b;
		data[idx + 3] = 255; // Alpha (Full Opacity)
	}

	ctx.putImageData(imgData, 0, 0);

	// 3. Trigger Download
	const link = document.createElement('a');
	link.download = `meru-paint-${Date.now()}.png`;
	link.href = canvas.toDataURL('image/png');
	link.click();

	// Cleanup (though GC handles it, it's good practice)
	canvas.remove();
	link.remove();
}
