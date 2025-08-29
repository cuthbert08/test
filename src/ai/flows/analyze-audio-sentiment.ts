'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing the sentiment of recorded audio.
 *
 * It includes:
 * - analyzeAudioSentiment: A function to initiate the sentiment analysis process.
 * - AnalyzeAudioSentimentInput: The expected input type for the analysis.
 * - AnalyzeAudioSentimentOutput: The structure of the analysis result.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const AnalyzeAudioSentimentInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The recorded audio data as a data URI (e.g., data:audio/wav;base64,...).'
    ),
});
export type AnalyzeAudioSentimentInput = z.infer<typeof AnalyzeAudioSentimentInputSchema>;

const AnalyzeAudioSentimentOutputSchema = z.object({
  sentimentScore: z
    .number()
    .describe(
      'A numerical score representing the overall sentiment of the audio, ranging from -1 (negative) to 1 (positive).'
    ),
  sentimentLabel: z
    .string()
    .describe(
      'A descriptive label indicating the sentiment (e.g., \'positive\', \'negative\', \'neutral\').'
    ),
});
export type AnalyzeAudioSentimentOutput = z.infer<typeof AnalyzeAudioSentimentOutputSchema>;

export async function analyzeAudioSentiment(
  input: AnalyzeAudioSentimentInput
): Promise<AnalyzeAudioSentimentOutput> {
  return analyzeAudioSentimentFlow(input);
}

const analyzeAudioSentimentPrompt = ai.definePrompt({
  name: 'analyzeAudioSentimentPrompt',
  input: {schema: AnalyzeAudioSentimentInputSchema},
  output: {schema: AnalyzeAudioSentimentOutputSchema},
  prompt: `Analyze the sentiment of the following audio recording and provide a sentiment score between -1 and 1, and a descriptive label.

Audio: {{media url=audioDataUri}}

Output the sentiment score and label.`, // Handlebars template
});

const analyzeAudioSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeAudioSentimentFlow',
    inputSchema: AnalyzeAudioSentimentInputSchema,
    outputSchema: AnalyzeAudioSentimentOutputSchema,
  },
  async input => {
    const {output} = await analyzeAudioSentimentPrompt(input);
    return output!;
  }
);
