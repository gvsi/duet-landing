/**
 * Calculate reading time for content
 * Uses average adult reading speed of 238 words per minute
 */

const WORDS_PER_MINUTE = 238

export function calculateReadingTime(content: string): number {
    // Strip markdown/HTML and count words
    const text = content
        .replace(/```[\s\S]*?```/g, "") // Remove code blocks
        .replace(/`[^`]*`/g, "") // Remove inline code
        .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // Keep link text
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/[#*_~`]/g, "") // Remove markdown formatting
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim()

    const wordCount = text.split(/\s+/).filter(Boolean).length
    const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE)

    return Math.max(1, minutes) // Minimum 1 minute
}

export function formatReadingTime(minutes: number): string {
    return `${minutes} min read`
}
