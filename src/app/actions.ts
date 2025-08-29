'use server';

import {
  analyzeAudioSentiment,
  AnalyzeAudioSentimentInput,
} from '@/ai/flows/analyze-audio-sentiment';
import {
  summarizeEmotionalHighlights,
  SummarizeEmotionalHighlightsInput,
} from '@/ai/flows/summarize-emotional-highlights';

export async function getSentimentAnalysis(input: AnalyzeAudioSentimentInput) {
  try {
    const result = await analyzeAudioSentiment(input);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error in getSentimentAnalysis:', error);
    return { data: null, error: 'Failed to analyze sentiment. Please try again.' };
  }
}

export async function getEmotionalSummary(
  input: SummarizeEmotionalHighlightsInput
) {
  try {
    const result = await summarizeEmotionalHighlights(input);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error in getEmotionalSummary:', error);
    return {
      data: null,
      error: 'Failed to generate summary. Please try again.',
    };
  }
}
