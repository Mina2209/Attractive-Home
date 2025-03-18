import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const VideoPlayer = ({
  videoUrl,
  className = "",
  autoPlay = true,
  defaultMuted = true,
  showMuteButton = true,
  enableHoverPlay = false,
}) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    // Set up HLS or direct video source
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
    }

    // If autoplay is false, force display of the first frame.
    if (!autoPlay) {
      const handleLoadedData = () => {
        // Set a slight offset to ensure a frame is rendered.
        video.currentTime = 0.1;
      };

      video.addEventListener("loadeddata", handleLoadedData);
      return () => {
        video.removeEventListener("loadeddata", handleLoadedData);
      };
    }
  }, [videoUrl, autoPlay]);

  const toggleMute = () => {
    setIsMuted((prevMuted) => !prevMuted);
  };

  const handleMouseEnter = (e) => {
    if (enableHoverPlay) {
      setIsPlaying(true);
      e.target.play();
    }
  };

  const handleMouseLeave = (e) => {
    if (enableHoverPlay) {
      setIsPlaying(false);
      e.target.pause();
      e.target.currentTime = 0;
    }
  };

  const isAbsolute = className.includes("absolute");

  return (
    <div className={`${isAbsolute ? "" : "relative"}`}>
      <video
        className={className}
        ref={videoRef}
        autoPlay={autoPlay}
        loop
        muted={isMuted}
        playsInline
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      {showMuteButton && (
        <button
          onClick={toggleMute}
          className="absolute right-0 bottom-3/4 transform -translate-y-3/4 bg-black bg-opacity-10 text-white px-3 py-1 rounded-l-lg text-sm z-10 [@media(max-height:750px)]:bottom-2/3 [@media(max-height:750px)]:-translate-y-2/3 [@media(max-height:750px)]:bottom-[60%] [@media(max-height:750px)]:-translate-y-[60%]"
        >
          {isMuted ? "Unmute 🔊" : "Mute 🔇"}
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
