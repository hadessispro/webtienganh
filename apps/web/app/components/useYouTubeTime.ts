"use client";

/**
 * Path: apps/web/app/components/useYouTubeTime.ts
 *
 * Custom React hook to poll the YouTube IFrame Player API for
 * currentTime + playerState. Used by ShadowingPlayer for karaoke-style
 * highlighting and auto-loop boundary detection.
 *
 * Why we need this:
 *   The YouTube iframe doesn't fire 'timeupdate' events to the parent.
 *   We have to send postMessage('getCurrentTime') requests and listen
 *   for the response. We poll at ~10 Hz which is smooth enough for
 *   per-word highlighting on transcript lines (most words are >150ms).
 *
 * Public API:
 *   const { currentTime, playerState } = useYouTubeTime(iframeRef, isReady);
 *
 * Note on YT player states (numeric):
 *   -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
 */

import { useEffect, useRef, useState } from "react";

export type YTPlayerState = -1 | 0 | 1 | 2 | 3 | 5;

interface YTMessageData {
  event?: string;
  info?: number | { currentTime?: number; playerState?: YTPlayerState };
}

export function useYouTubeTime(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playerState, setPlayerState] = useState<YTPlayerState>(-1);
  const lastRequestRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    function send(func: string) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args: [] }),
        "*",
      );
    }

    function onMessage(e: MessageEvent) {
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;
      let data: YTMessageData | null = null;
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!data) return;

      // Two relevant events:
      //   "infoDelivery" with info.currentTime, info.playerState
      //   "onStateChange" with info (numeric playerState)
      if (data.event === "infoDelivery" && typeof data.info === "object" && data.info) {
        const i = data.info as { currentTime?: number; playerState?: YTPlayerState };
        if (typeof i.currentTime === "number") {
          setCurrentTime(i.currentTime);
        }
        if (typeof i.playerState === "number") {
          setPlayerState(i.playerState as YTPlayerState);
        }
      } else if (data.event === "onStateChange" && typeof data.info === "number") {
        setPlayerState(data.info as YTPlayerState);
      }
    }

    window.addEventListener("message", onMessage);

    // Tell the iframe to start sending us events.
    // 'listening' is the magic init word for the iframe API.
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
      "*",
    );

    // Poll currentTime ~10 Hz. Cheap because postMessage is fast.
    const interval = window.setInterval(() => {
      const now = Date.now();
      if (now - lastRequestRef.current >= 80) {
        lastRequestRef.current = now;
        send("getCurrentTime");
        send("getPlayerState");
      }
    }, 100);

    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(interval);
    };
  }, [enabled, iframeRef]);

  return { currentTime, playerState };
}
