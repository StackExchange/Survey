<script>
	import ThemeToggle from '$lib/components/ThemeToggle.svelte'

	import survey from '$content/survey.json'
	import { copyrightYear, githubRepo, licence } from '$lib/constants'

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
	import Icon from './Icon.svelte'
</script>

<footer id="footer-global" class="gutter relative block bg-black text-white overflow-hidden">
	<ThemeToggle class="absolute top-0 right-0 pointer-events-auto" />

	<div class="grid grid-cols-12 gap-8">
		<div class="col-span-12 lg:col-span-6">
			<a href="https://stackoverflow.com/" title="Stack Overflow" class="text-orange">
				<Icon src={IconLogo} />
			</a>
			<p class="leading-snug text-black-300 text-sm mt-12">
				Site design / logo © {copyrightYear}
				{licence.holder}<br />
				User contributions licensed under
				<a class="underline hover:text-white" href={licence.contributions.url} rel="license external">{licence.contributions.name}</a><br />
				Survey data licensed under
				<a class="underline hover:text-white" href={licence.database.url} rel="license external">{licence.database.name}</a>, contents under
				<a class="underline hover:text-white" href={licence.contents.url} rel="license external">{licence.contents.name}</a>
			</p>
			<a class="py-3 mt-6 hover:text-orange flex items-center gap-2 whitespace-nowrap" href={githubRepo} title="GitHub" rel="external">
				<Icon src={IconServiceGitHub} />
				View source on GitHub
			</a>
		</div>
		<ul class="col-span-12 md:col-span-6 lg:col-span-3">
			<li><a class="hover:underline font-bold" href="https://stackexchange.com">Stack Overflow Public Platforms</a></li>
			<li><a class="hover:underline" href="https://stackoverflow.com">stackoverflow.com</a></li>
			<li><a class="hover:underline" href="https://agents.stackoverflow.com">agents.stackoverflow.com</a></li>

			<li class="mt-5"><a class="hover:underline font-bold" href="https://stackoverflow.co">Stack Overflow Business</a></li>
			<li><a class="hover:underline" href="https://stackoverflow.co/internal">Stack Internal</a></li>
			<li><a class="hover:underline" href="https://stackoverflow.co/ads">Stack Ads</a></li>
			<li><a class="hover:underline" href="https://stackoverflow.co/data-licensing">Stack Data Licensing</a></li>
		</ul>
		<div class="col-span-12 md:col-span-6 lg:col-span-3 flex flex-col">
			<ul class="mb-6">
				<li><a class="hover:underline" href="https://policies.stackoverflow.co/">Terms</a></li>
				<li><a class="hover:underline" href="https://stackoverflow.com/legal/privacy-policy/">Privacy policy</a></li>
				<li><a class="hover:underline" href="https://stackoverflow.com/legal/cookie-policy/">Cookie policy</a></li>
				<li>
					<button
						class="ot-sdk-show-settings flex items-center gap-2 cursor-pointer hover:underline"
						type="button"
						title="Open cookie settings"
					>
						Your Privacy Choices
						<Icon src={IconServiceCCPA} />
					</button>
				</li>
			</ul>
			<ul class="flex -ml-3 mt-auto">
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
