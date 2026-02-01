import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";

export default function CameraEmotionToggle() {
  console.log("CameraEmotionToggle mounted");
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const enabledRef = useRef(false);

  const [enabled, setEnabled] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);

  const cooldownRef = useRef(false);
  const sadStreakRef = useRef(0);

  const SAD_THRESHOLD = 0.3;
  const SAD_STREAK_FRAMES = 1;
  const CHECK_EVERY_MS = 700;
  const COOLDOWN_MS = 15000;

  async function loadModelsOnce() {
    if (modelsReady || loadingModels) return;

    setLoadingModels(true);
    try {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsReady(true);
    } catch (err) {
      console.error(err);
      alert("Face detection models not found in public/models");
    } finally {
      setLoadingModels(false);
    }
  }

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });

    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
  }

  function stopCamera() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    sadStreakRef.current = 0;
  }

  function startDetectionLoop() {
    const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5,
    });

    intervalRef.current = setInterval(async () => {
        console.log("tick"); // ✅ proves the loop is running


    if (!enabledRef.current || !videoRef.current) {
    console.log("Skipping: enabledRef or video missing", {
        enabledRef: enabledRef.current,
        hasVideo: !!videoRef.current,
    });
    return;
    }
        const result = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceExpressions();

        if (!result) {
        console.log("No face detected");
        sadStreakRef.current = 0;
        return;
        }

        if (!result.expressions) {
        console.log("Face detected but no expressions??", result);
        sadStreakRef.current = 0;
        return;
        }


        const sad = result.expressions.sad ?? 0;
        console.log("Sad probability:", sad);


        if (sad >= SAD_THRESHOLD) {
        sadStreakRef.current += 1;
        } else {
        sadStreakRef.current = 0;
        }

        if (
        sadStreakRef.current >= SAD_STREAK_FRAMES &&
        !cooldownRef.current
        ) {
        cooldownRef.current = true;
        sadStreakRef.current = 0;

        const wantsHelp = window.confirm("Why are you sad? need help?");
        if (wantsHelp) navigate("/help");

        setTimeout(() => {
            cooldownRef.current = false;
        }, COOLDOWN_MS);
        }
    }, CHECK_EVERY_MS);
  }

  async function toggleCamera() {
    const next = !enabled;
    setEnabled(next);
    enabledRef.current = next;

    if (next) {
      await loadModelsOnce();
      await startCamera();
      startDetectionLoop();
    } else {
      stopCamera();
    }
  }

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          position: "fixed",
          right: 16,
          bottom: 76,
          width: enabled ? 180 : 0,
          height: enabled ? 120 : 0,
          opacity: enabled ? 0.9 : 0,
          borderRadius: 12,
          background: "black",
          zIndex: 9999,
          transition: "all 0.2s ease",
        }}
      />

      <button
        onClick={toggleCamera}
        disabled={loadingModels}
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 10000,
          padding: "12px 14px",
          borderRadius: 999,
          border: "none",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {loadingModels
          ? "Loading…"
          : enabled
          ? "📷 Mood Cam: ON"
          : "📷 Mood Cam: OFF"}
      </button>
    </>
  );
}
