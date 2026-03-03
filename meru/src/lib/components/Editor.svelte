<script lang="ts">
	import { onMount } from 'svelte';
	import { saveCanvas, loadCanvas } from '$lib/utils/db';
	import { CANVAS_SIZE, MIN_BRUSH_SIZE, MAX_BRUSH_SIZE } from '$lib/constants';
	import { PALETTE, FILL } from '$lib/utils/colors';
	import { download } from '$lib/utils/export';

	let {
		selectedColor = $bindable(),
		triggerReset = $bindable(),
		triggerDownload = $bindable(),
		triggerBrushIncrease = $bindable(),
		triggerBrushDecrease = $bindable()
	} = $props<{
		selectedColor: number;
		triggerReset: () => string;
		triggerDownload: () => string;
		triggerBrushIncrease: () => string;
		triggerBrushDecrease: () => string;
	}>();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	// --- State ---
	let pixels: Uint8Array<ArrayBufferLike> = $state(new Uint8Array(CANVAS_SIZE * CANVAS_SIZE));

	let zoom = $state(5);
	let panX = CANVAS_SIZE / 2;
	let panY = CANVAS_SIZE / 2;
	let brushSize = $state(1);

	// Mouse State
	let isPanning = false;
	let isPainting = false;
	let lastX = 0;
	let lastY = 0;
	let zoomAccumulator = 0;

	// Touch State
	let lastPinchDistance = 0;
	let lastPinchCenter = { x: 0, y: 0 };
	let touchDelayTimer = 0;
	let isTouching = false;

	const ZOOM_THRESHOLD = 15;

	// Reset Logic
	triggerReset = () => {
		pixels.fill(0);
		saveCanvas(pixels as Uint8Array);
		requestDraw();
		return 'Canvas cleared!';
	};

	// Download Logic
	triggerDownload = () => {
		download(pixels);
		return 'Canvas saved';
	};

	// Brush Size
	triggerBrushIncrease = () => {
		const prevBrushSize = brushSize;
		brushSize = Math.min(MAX_BRUSH_SIZE, brushSize + 2);
		if (brushSize === prevBrushSize) {
			return '';
		}
		return 'Brush size increased to ' + brushSize;
	};

	triggerBrushDecrease = () => {
		const prevBrushSize = brushSize;
		brushSize = Math.max(MIN_BRUSH_SIZE, brushSize - 2);
		if (brushSize === prevBrushSize) {
			return '';
		}
		return 'Brush size decreased to ' + brushSize;
	};

	// --- Coordinate System ---
	// The world is 0, 0 at the top left of the canvas
	// The screen is 0, 0 on the top left corner
	// Center of the screen is panX, panY on the canvas
	const screenToWorld = (screenX: number, screenY: number) => {
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		return {
			x: (screenX - centerX) / zoom + panX,
			y: (screenY - centerY) / zoom + panY
		};
	};

	// --- Drawing Loop ---
	let animationFrameId: number;
	function requestDraw() {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = requestAnimationFrame(draw);
	}

	function draw() {
		if (!ctx || !canvas) return;

		ctx.fillStyle = FILL;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		// Viewport Culling
		const startX = Math.floor(panX - centerX / zoom);
		const startY = Math.floor(panY - centerY / zoom);
		const endX = Math.ceil(panX + centerX / zoom);
		const endY = Math.ceil(panY + centerY / zoom);

		const minX = Math.max(0, startX);
		const maxX = Math.min(CANVAS_SIZE, endX);
		const minY = Math.max(0, startY);
		const maxY = Math.min(CANVAS_SIZE, endY);

		for (let y = minY; y < maxY; y++) {
			for (let x = minX; x < maxX; x++) {
				const colorIndex = pixels[y * CANVAS_SIZE + x];
				if (colorIndex === 0) continue; // Optimization: Skip white if background is white

				ctx.fillStyle = PALETTE[colorIndex];

				// Math.floor for crisp edges
				// (x, y) - (panX, panY) creates coordinates with (0, 0) on the center of the screen
				// * zoom + (centerX, centerY) moves (0, 0) to the top left corner of the screen
				const screenX = Math.floor((x - panX) * zoom + centerX);
				const screenY = Math.floor((y - panY) * zoom + centerY);
				const size = Math.ceil(zoom);

				ctx.fillRect(screenX, screenY, size, size);
			}
		}
	}

	// --- Mouse Handlers ---
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		zoomAccumulator += e.deltaY;

		if (Math.abs(zoomAccumulator) >= ZOOM_THRESHOLD) {
			const steps = Math.floor(Math.abs(zoomAccumulator) / ZOOM_THRESHOLD);
			const direction = zoomAccumulator > 0 ? -1 : 1;
			let newZoom = Math.max(2, Math.min(20, zoom + steps * direction));

			if (newZoom !== zoom) {
				zoom = newZoom;
				requestDraw();
			}
			zoomAccumulator -= steps * ZOOM_THRESHOLD * -direction;
			if (zoom === 2 || zoom === 20) zoomAccumulator = 0;
		}
	}

	function handlePointerDown(e: PointerEvent) {
		// Ignore if touch (handled separately to support multi-touch)
		if (e.pointerType === 'touch') return;

		canvas.setPointerCapture(e.pointerId);
		lastX = e.clientX;
		lastY = e.clientY;

		if (e.button === 0) {
			isPainting = true;
			paint(e.clientX, e.clientY);
		} else if (e.button === 2) {
			isPanning = true;
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (e.pointerType === 'touch') return;

		if (isPanning) {
			panX -= (e.clientX - lastX) / zoom;
			panY -= (e.clientY - lastY) / zoom;
			lastX = e.clientX;
			lastY = e.clientY;
			requestDraw();
		} else if (isPainting) {
			paint(e.clientX, e.clientY);
		}
	}

	function handlePointerUp(e: PointerEvent) {
		if (e.pointerType === 'touch') return;
		if (isPainting) saveCanvas(pixels as Uint8Array);
		isPanning = false;
		isPainting = false;
		canvas.releasePointerCapture(e.pointerId);
	}

	// --- Touch Handlers (Mobile) ---
	function getDistance(t1: Touch, t2: Touch) {
		const dx = t1.clientX - t2.clientX;
		const dy = t1.clientY - t2.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function getCenter(t1: Touch, t2: Touch) {
		return {
			x: (t1.clientX + t2.clientX) / 2,
			y: (t1.clientY + t2.clientY) / 2
		};
	}

	function handleTouchStart(e: TouchEvent) {
		// Prevent default browser zooming/scrolling behavior
		e.preventDefault();

		if (e.touches.length === 1) {
			// 1 Finger: Paint
			touchDelayTimer = window.setTimeout(() => {
				isPainting = true;
				paint(e.touches[0].clientX, e.touches[0].clientY);
			}, 100);
		} else if (e.touches.length === 2) {
			clearTimeout(touchDelayTimer);
			// 2 Fingers: Pan/Zoom Start
			isPainting = false; // Stop painting if second finger touches
			isTouching = true;

			lastPinchDistance = getDistance(e.touches[0], e.touches[1]);
			lastPinchCenter = getCenter(e.touches[0], e.touches[1]);
		}
	}

	function handleTouchMove(e: TouchEvent) {
		e.preventDefault();

		if (e.touches.length === 1 && isPainting) {
			// 1 Finger: Continue Painting
			paint(e.touches[0].clientX, e.touches[0].clientY);
		} else if (e.touches.length === 2 && isTouching) {
			// 2 Fingers: Pan & Zoom
			const currentPinchDistance = getDistance(e.touches[0], e.touches[1]);
			const currentPinchCenter = getCenter(e.touches[0], e.touches[1]);

			// 1. Handle Zoom (Pinch)
			// Calculate ratio of change
			const zoomFactor = currentPinchDistance / lastPinchDistance;
			// Apply sensitivity
			const newZoomRaw = zoom * (1 + (zoomFactor - 1) * 0.5);
			const newZoom = Math.max(2, Math.min(20, newZoomRaw));

			if (Math.abs(newZoom - zoom) > 0.1) {
				zoom = newZoom;
				lastPinchDistance = currentPinchDistance; // Reset baseline to avoid exponential zooming
			}

			// 2. Handle Pan (Drag)
			panX -= (currentPinchCenter.x - lastPinchCenter.x) / zoom;
			panY -= (currentPinchCenter.y - lastPinchCenter.y) / zoom;

			lastPinchCenter = currentPinchCenter;
			requestDraw();
		}
	}

	function handleTouchEnd(_: TouchEvent) {
		if (isPainting || isTouching) {
			saveCanvas(pixels as Uint8Array);
		}
		clearTimeout(touchDelayTimer);
		isPainting = false;
		isTouching = false;
	}

	// --- Core Paint Logic ---
	function paint(clientX: number, clientY: number) {
		const { x, y } = screenToWorld(clientX, clientY);
		const centerGridX = Math.floor(x);
		const centerGridY = Math.floor(y);

		// Calculate how far out from the center to paint
		// e.g., if brushSize is 3, radius is 1 (paints -1, 0, +1)
		const radius = Math.floor(brushSize / 2);
		let changed = false;

		for (let dy = -radius; dy <= radius; dy++) {
			for (let dx = -radius; dx <= radius; dx++) {
				const gridX = centerGridX + dx;
				const gridY = centerGridY + dy;

				// 1. Boundary Check: Ensure coordinates are inside the canvas
				if (gridX >= 0 && gridX < CANVAS_SIZE && gridY >= 0 && gridY < CANVAS_SIZE) {
					const idx = gridY * CANVAS_SIZE + gridX;

					// 2. Optimization: Only update and trigger a redraw if the color actually changes
					if (pixels[idx] !== selectedColor) {
						pixels[idx] = selectedColor;
						changed = true;
					}
				}
			}
		}

		if (changed) {
			requestDraw();
		}
	}

	function handleResize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		if (ctx) ctx.imageSmoothingEnabled = false;
		requestDraw();
	}

	onMount(() => {
		ctx = canvas.getContext('2d', { alpha: false });
		if (ctx) ctx.imageSmoothingEnabled = false;

		(async () => {
			pixels = await loadCanvas();
			requestDraw();
		})();

		handleResize();
		window.addEventListener('resize', handleResize);
		canvas.addEventListener('wheel', handleWheel, { passive: false });

		return () => {
			window.removeEventListener('resize', handleResize);
			canvas.removeEventListener('wheel', handleWheel);
		};
	});
</script>

<canvas
	bind:this={canvas}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	oncontextmenu={(e) => e.preventDefault()}
	class="rendering-pixelated block h-full w-full cursor-crosshair touch-none"
></canvas>

<style>
	.rendering-pixelated {
		image-rendering: pixelated;
		image-rendering: crisp-edges;
	}
</style>
