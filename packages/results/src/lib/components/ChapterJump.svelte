<script lang="ts">
	import type { Attachment } from 'svelte/attachments'

	import { IconArrowLeft, IconArrowRight } from '@stackoverflow/stacks-icons/icons'

	import Icon from '$components/Icon.svelte'

	interface Props {
		href: string
		// A stacks-icons spot, as a raw SVG string.
		spot: string
		title: string
		subtitle: string
		// Where the link goes relative to the page you are on. `back` mirrors the
		// card: spot on the right, arrow under the text.
		direction?: 'forward' | 'back'
	}

	let { href, spot, title, subtitle, direction = 'forward' }: Props = $props()

	const back = $derived(direction === 'back')

	// The card sits last in the flow and sticks to the foot of the window on the
	// way down, so on a long page it rides over the content the whole scroll.
	// Folded to its arrow it stays out of the way, and it opens once its own
	// resting place is in view — the point where it would have stopped sticking.
	let resting = $state(false)

	// Opened early by pointer or keyboard, so the arrow is not a mystery target.
	let held = $state(false)

	const open = $derived(resting || held)

	// A hairline marker directly under the card. Visible means the card has
	// arrived; the alternative to an observer is measuring on every scroll event.
	// One pixel rather than none, since a zero-area target never intersects.
	const foot: Attachment<HTMLElement> = (node) => {
		if (typeof IntersectionObserver === 'undefined') {
			resting = true
			return
		}

		const observer = new IntersectionObserver(([entry]) => (resting = entry.isIntersecting))

		observer.observe(node)

		return () => observer.disconnect()
	}
</script>

<a
	{href}
	data-open={open}
	data-back={back}
	onpointerenter={() => (held = true)}
	onpointerleave={() => (held = false)}
	onfocus={() => (held = true)}
	onblur={() => (held = false)}
	class="jump sticky bottom-5 mr-5 ml-auto flex w-full max-w-100 bg-black leading-snug hover:bg-orange-medium"
>
	<Icon src={spot} class="native h-auto max-w-30 p-3 {back ? 'order-last' : ''}" />

	<div class="flex-1 p-4 text-white {back ? '' : 'pl-2'}">
		<div class="font-semibold">{title}</div>
		<div class="opacity-50">{subtitle}</div>
	</div>

	<div class="arrow absolute bottom-0 bg-orange p-2 text-black {back ? 'left-0' : 'right-0'}">
		<Icon src={back ? IconArrowLeft : IconArrowRight} />
	</div>
</a>

<div aria-hidden="true" class="h-px" {@attach foot}></div>

<style>
	/* Icon 20px plus the arrow's p-2 either side: the folded card is that square
	   and nothing else. */
	.jump {
		--arrow: 2.25rem;

		clip-path: inset(0);
	}

	/* Clipped rather than resized, so the card keeps its layout and the text never
	   reflows on the way down. Clipping also takes the hidden area out of hit
	   testing, so only the arrow is clickable while folded. */
	.jump[data-open='false'] {
		clip-path: inset(calc(100% - var(--arrow)) 0 0 calc(100% - var(--arrow)));
	}

	/* The mirrored card folds onto its own arrow, bottom left, then slides that
	   square over to the margin the open card was hugging. */
	.jump[data-open='false'][data-back='true'] {
		clip-path: inset(calc(100% - var(--arrow)) calc(100% - var(--arrow)) 0 0);
		translate: calc(100% - var(--arrow)) 0;
	}

	@media (prefers-reduced-motion: no-preference) {
		.jump {
			transition:
				clip-path 300ms ease,
				translate 300ms ease;
		}
	}
</style>
