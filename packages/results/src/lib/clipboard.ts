export type CopyStatus = 'idle' | 'copied' | 'failed'

// Clipboard access can be refused outright, and there is nothing to retry.
export async function write(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch (error) {
		console.error('copy:', error)
		return false
	}
}
