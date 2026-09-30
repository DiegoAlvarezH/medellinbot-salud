'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

// ─── Minimal typings for the Web Speech API (not in lib.dom for every browser) ───

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const subscribeNoop = () => () => {};

/** Voice dictation in Colombian Spanish. `supported` is false on browsers without the Web Speech API (e.g. Firefox). */
export function useDictation(onText: (text: string, isFinal: boolean) => void) {
  const supported = useSyncExternalStore(subscribeNoop, () => Boolean(recognitionCtor()), () => false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const callback = useRef(onText);
  useEffect(() => {
    callback.current = onText;
  }, [onText]);

  const stop = useCallback(() => recognition.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    recognition.current?.abort();
    const r = new Ctor();
    r.lang = 'es-CO';
    r.interimResults = true;
    r.continuous = false;
    let finalText = '';
    r.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      callback.current((finalText + interim).trim(), interim === '');
    };
    r.onerror = (event) => setError(event.error === 'not-allowed' ? 'Permite el micrófono para dictar.' : 'No te escuché bien, intenta de nuevo.');
    r.onend = () => setListening(false);
    recognition.current = r;
    setError(null);
    setListening(true);
    r.start();
  }, []);

  useEffect(() => () => recognition.current?.abort(), []);

  return { supported, listening, error, start, stop };
}

/** Removes Markdown so the speech engine does not read asterisks and pipes aloud. */
function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#>|]/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ', ')
    .trim();
}

/** Read-aloud with a Spanish voice (prefers es-CO, then any es-*). Only one message speaks at a time. */
export function useReadAloud() {
  const supported = useSyncExternalStore(subscribeNoop, () => typeof window !== 'undefined' && 'speechSynthesis' in window, () => false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (id: string, markdown: string) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(plainText(markdown));
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find((v) => v.lang === 'es-CO') ?? voices.find((v) => v.lang.startsWith('es')) ?? null;
      utterance.lang = utterance.voice?.lang ?? 'es-CO';
      utterance.rate = 1;
      utterance.onend = () => setSpeakingId((current) => (current === id ? null : current));
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return { supported, speakingId, speak, stop };
}
