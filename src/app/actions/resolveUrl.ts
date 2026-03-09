'use server';

export async function resolveShortUrl(shortUrl: string) {
    try {
        const response = await fetch(shortUrl, {
            method: 'HEAD',
            redirect: 'follow',
            // Need a user-agent sometimes to prevent Google from blocking bot requests
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        return { success: true, url: response.url };
    } catch (error: any) {
        console.error("Failed to resolve URL:", error);
        return { success: false, error: 'Failed to resolve URL' };
    }
}
