// Summarize emotional highlights of an audio recording.
'use server';

/**
 * @fileOverview Summarizes the emotional highlights from an audio recording transcript.
 *
 * - summarizeEmotionalHighlights - A function that takes an audio transcript and returns a summary of emotional highlights.
 * - SummarizeEmotionalHighlightsInput - The input type for the summarizeEmotionalHighlights function, which includes the audio transcript.
 * - SummarizeEmotionalHighlightsOutput - The return type for the summarizeEmotionalHighlights function, which is a string containing the emotional highlights summary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeEmotionalHighlightsInputSchema = z.object({
  transcript: z
    .string()
    .describe('The transcript of the audio recording to summarize.'),
});
export type SummarizeEmotionalHighlightsInput = z.infer<
  typeof SummarizeEmotionalHighlightsInputSchema
>;

const SummarizeEmotionalHighlightsOutputSchema = z.object({
  summary: z
    .string()
    .describe('A summary of the emotional highlights from the audio.'),
});
export type SummarizeEmotionalHighlightsOutput = z.infer<
  typeof SummarizeEmotionalHighlightsOutputSchema
>;

export async function summarizeEmotionalHighlights(
  input: SummarizeEmotionalHighlightsInput
): Promise<SummarizeEmotionalHighlightsOutput> {
  return summarizeEmotionalHighlightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeEmotionalHighlightsPrompt',
  input: {schema: SummarizeEmotionalHighlightsInputSchema},
  output: {schema: SummarizeEmotionalHighlightsOutputSchema},
  prompt: `You are an AI expert in understanding human emotion and summarizing text.

  Analyze the following transcript of an audio recording and identify the key emotional highlights and inflection points.
  Provide a concise summary of these moments, focusing on the overall emotional tone and significant shifts in sentiment.
  \nTranscript: {{{transcript}}}`,
});

const summarizeEmotionalHighlightsFlow = ai.defineFlow(
  {
    name: 'summarizeEmotionalHighlightsFlow',
    inputSchema: SummarizeEmotionalHighlightsInputSchema,
    outputSchema: SummarizeEmotionalHighlightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
