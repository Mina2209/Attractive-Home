import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

const VideoPlayer = ({ videoUrl, className, setLoading }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    const handleVideoReady = () => {
      if (setLoading) setLoading(false);
    };

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.addEventListener("loadedmetadata", handleVideoReady);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
      video.addEventListener("loadedmetadata", handleVideoReady);
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleVideoReady);
    };
  }, [videoUrl, setLoading]);

  return (
    <video
      className={className}
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
    />
  );
};

export default VideoPlayer;