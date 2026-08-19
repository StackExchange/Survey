<script>
	import {
		IconLogo,
		IconServiceCCPA,
		IconServiceGitHub,
		IconServiceInstagram,
		IconServiceLinkedIn,
		IconServiceThreads,
		IconServiceX,
		IconServiceYouTube,
	} from '@stackoverflow/stacks-icons/icons'

	import { githubRepo, licence } from '$config'

	import ThemeToggle from '$components/ThemeToggle.svelte'

	import Icon from './Icon.svelte'
</script>

<footer
	id="footer-global"
	class="relative block overflow-hidden border-t border-transparent bg-black gutter text-white dark:border-black-500"
>
	<ThemeToggle class="pointer-events-auto absolute top-0 right-0" />

	<div class="grid grid-cols-12 gap-8">
		<div class="col-span-12 lg:col-span-6">
			<a href="https://stackoverflow.com/" title="Stack Overflow" class="text-orange">
				<Icon src={IconLogo} />
			</a>
			<p class="mt-12 text-sm leading-snug text-black-300">
				Site design / logo © {new Date().getFullYear()}
				{licence.holder}<br />
				User contributions licensed under
				<a class="underline hover:text-white" href={licence.contributions.url} rel="license external">{licence.contributions.name}</a><br />
				Survey data licensed under
				<a class="underline hover:text-white" href={licence.database.url} rel="license external">{licence.database.name}</a>, contents under
				<a class="underline hover:text-white" href={licence.contents.url} rel="license external">{licence.contents.name}</a>
			</p>
			<a class="mt-6 flex items-center gap-2 py-3 whitespace-nowrap hover:text-orange" href={githubRepo} title="GitHub" rel="external">
				<Icon src={IconServiceGitHub} />
				View source on GitHub
			</a>
		</div>
		<ul class="col-span-12 md:col-span-6 lg:col-span-3">
			<li><a class="font-bold hover:underline" href="https://stackexchange.com">Stack Overflow Public Platforms</a></li>
			<li><a class="hover:underline" href="https://stackoverflow.com">stackoverflow.com</a></li>
			<li><a class="hover:underline" href="https://agents.stackoverflow.com">agents.stackoverflow.com</a></li>

			<li class="mt-5"><a class="font-bold hover:underline" href="https://stackoverflow.co">Stack Overflow Business</a></li>
			<li><a class="hover:underline" href="https://stackoverflow.co/internal">Stack Internal</a></li>
			<li><a class="hover:underline" href="https://stackoverflow.co/ads">Stack Ads</a></li>
			<li><a class="hover:underline" href="https://stackoverflow.co/data-licensing">Stack Data Licensing</a></li>
		</ul>
		<div class="col-span-12 flex flex-col md:col-span-6 lg:col-span-3">
			<ul class="mb-6">
				<li><a class="hover:underline" href="https://policies.stackoverflow.co/">Terms</a></li>
				<li><a class="hover:underline" href="https://stackoverflow.com/legal/privacy-policy/">Privacy policy</a></li>
				<li><a class="hover:underline" href="https://stackoverflow.com/legal/cookie-policy/">Cookie policy</a></li>
				<li>
					<button
						class="ot-sdk-show-settings flex cursor-pointer items-center gap-2 hover:underline"
						type="button"
						title="Open cookie settings"
					>
						Your Privacy Choices
						<Icon src={IconServiceCCPA} />
					</button>
				</li>
			</ul>
			<ul class="mt-auto -ml-3 flex">
				<li>
					<a
						class="block p-3 hover:text-orange"
						href="https://linkedin.com/company/stack-overflow/"
						title="LinkedIn"
						aria-label="LinkedIn"
						rel="external"
					>
						<Icon src={IconServiceLinkedIn} />
					</a>
				</li>
				<li>
					<a
						class="block p-3 hover:text-orange"
						href="https://twitter.com/stackoverflow/"
						title="Twitter/X"
						aria-label="Twitter/X"
						rel="external"
					>
						<Icon src={IconServiceX} />
					</a>
				</li>
				<li>
					<a
						class="block p-3 hover:text-orange"
						href="https://www.threads.net/@thestackoverflow"
						title="Threads"
						aria-label="Threads"
						rel="external"
					>
						<Icon src={IconServiceThreads} />
					</a>
				</li>
				<li>
					<a
						class="block p-3 hover:text-orange"
						href="https://www.instagram.com/thestackoverflow/"
						title="Instagram"
						aria-label="Instagram"
						rel="external"
					>
						<Icon src={IconServiceInstagram} />
					</a>
				</li>
				<li>
					<a
						class="block p-3 hover:text-orange"
						href="https://www.youtube.com/c/StackOverflowOfficial"
						title="YouTube"
						aria-label="YouTube"
						rel="external"
					>
						<Icon src={IconServiceYouTube} />
					</a>
				</li>
			</ul>
		</div>
	</div>
</footer>
