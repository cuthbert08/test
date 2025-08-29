'use client';

import { useState, useRef, useEffect, type FC } from 'react';
import { Mic, StopCircle, Play, Pause, LoaderCircle, Smile, Frown, Meh, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getSentimentAnalysis, getEmotionalSummary } from '@/app/actions';
import AudioVisualizer from './audio-visualizer';
import type { AnalyzeAudioSentimentOutput } from '@/ai/flows/analyze-audio-sentiment';
import type { SummarizeEmotionalHighlightsOutput } from '@/ai/flows/summarize-emotional-highlights';

type Status = 'idle' | 'recording' | 'processing' | 'ready' | 'playing';

const EchoBloom: FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [sentiment, setSentiment] = useState<AnalyzeAudioSentimentOutput | null>(null);
  const [summary, setSummary] = useState<SummarizeEmotionalHighlightsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(prev => prev + finalTranscript);
      };

      recognition.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
      };
    } else {
      setError('Speech recognition not supported in this browser.');
    }
  }, []);

  const startRecording = async () => {
    setError(null);
    setSentiment(null);
    setSummary(null);
    setTranscript('');
    setAudioURL(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Media Devices API not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus('recording');
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setStatus('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          
          const [sentimentResult, summaryResult] = await Promise.all([
            getSentimentAnalysis({ audioDataUri: base64Audio }),
            transcript ? getEmotionalSummary({ transcript }) : Promise.resolve({ data: null, error: 'No transcript available to summarize.' })
          ]);
          
          if (sentimentResult.error) {
            toast({ variant: 'destructive', title: 'Analysis Error', description: sentimentResult.error });
          } else {
            setSentiment(sentimentResult.data);
          }
          
          if (summaryResult.error) {
             toast({ variant: 'destructive', title: 'Summary Error', description: summaryResult.error });
          } else {
            setSummary(summaryResult.data);
          }
          setStatus('ready');
        };
      };

      mediaRecorderRef.current.start();
      if(recognitionRef.current) recognitionRef.current.start();

    } catch (err) {
      setError('Microphone access denied. Please allow access to your microphone.');
      setStatus('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      if(recognitionRef.current) recognitionRef.current.stop();
      // stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (status === 'playing') {
      audioRef.current.pause();
      setStatus('ready');
    } else if (status === 'ready') {
      audioRef.current.play();
      setStatus('playing');
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setProgress((audio.currentTime / audio.duration) * 100);
    const handleEnded = () => {
      setStatus('ready');
      setProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioURL]);

  const SentimentIcon = ({ score }: { score: number }) => {
    if (score > 0.2) return <Smile className="h-6 w-6 text-green-500" />;
    if (score < -0.2) return <Frown className="h-6 w-6 text-red-500" />;
    return <Meh className="h-6 w-6 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="h-32 w-full bg-muted/50 rounded-lg flex items-center justify-center mb-4">
             <AudioVisualizer audioElement={audioRef.current} isPlaying={status === 'playing'} />
          </div>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
              {status !== 'recording' ? (
                 <Button onClick={startRecording} disabled={status === 'processing'} size="lg" className="rounded-full w-20 h-20">
                  {status === 'processing' ? <LoaderCircle className="animate-spin" /> : <Mic size={32} />}
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" size="lg" className="rounded-full w-20 h-20">
                  <StopCircle size={32} />
                </Button>
              )}
              {audioURL && (
                <Button onClick={togglePlayPause} disabled={status === 'processing' || status === 'recording'} size="lg" variant="outline" className="rounded-full w-20 h-20">
                  {status === 'playing' ? <Pause size={32} /> : <Play size={32} />}
                </Button>
              )}
            </div>
            {audioURL && ['ready', 'playing'].includes(status) && (
              <div className="w-full pt-2">
                <Progress value={progress} />
              </div>
            )}
            <p className="text-sm text-muted-foreground h-5">
              {status === 'recording' && "Recording..."}
              {status === 'processing' && "Processing your audio..."}
            </p>
          </div>
          {audioURL && <audio ref={audioRef} src={audioURL} />}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={sentiment ? 'opacity-100' : 'opacity-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="text-accent"/> Sentiment Analysis
            </CardTitle>
            <CardDescription>The emotional tone of your recording.</CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'processing' && <div className="flex justify-center items-center h-24"><LoaderCircle className="animate-spin text-primary"/></div>}
            {sentiment ? (
              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="flex items-center space-x-3">
                  <SentimentIcon score={sentiment.sentimentScore} />
                  <div>
                    <p className="font-semibold text-lg capitalize">{sentiment.sentimentLabel}</p>
                    <p className="text-sm text-muted-foreground">Score: {sentiment.sentimentScore.toFixed(2)}</p>
                  </div>
                </div>
                <Badge variant="secondary">{sentiment.sentimentLabel}</Badge>
              </div>
            ) : status !== 'processing' && (
              <div className="text-center text-muted-foreground py-8">Record audio to see analysis.</div>
            )}
          </CardContent>
        </Card>
        
        <Card className={summary ? 'opacity-100' : 'opacity-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="text-accent"/> Emotional Highlights
            </CardTitle>
            <CardDescription>A summary of emotional inflection points.</CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'processing' && <div className="flex justify-center items-center h-24"><LoaderCircle className="animate-spin text-primary"/></div>}
            {summary?.summary ? (
              <div className="space-y-2 text-sm max-h-48 overflow-y-auto rounded-lg border p-4">
                <p>{summary.summary}</p>
              </div>
            ) : status !== 'processing' && (
              <div className="text-center text-muted-foreground py-8">Record audio to see summary.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EchoBloom;
