import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faVolumeUp, faVolumeMute } from "@fortawesome/free-solid-svg-icons";

const VideoPlayer = ({
  videoUrl,
  className = "",
  setLoading,
  defaultMuted = true,
  showMuteButton = true,
}) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(defaultMuted);

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

  const toggleMute = () => {
    setIsMuted((prevMuted) => !prevMuted);
  };

  const isAbsolute = className.includes("absolute");

  return (
    <div className={`${isAbsolute ? "" : "relative"}`}>
      <video
        className={className}
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
      />
      {showMuteButton && (
        <button
          onClick={toggleMute}
          className="absolute right-0 bottom-3/4 transform -translate-y-3/4 bg-black bg-opacity-10 text-white px-3 py-1 rounded-l-lg text-sm z-10 [@media(max-height:750px)]:bottom-2/3 [@media(max-height:750px)]:-translate-y-2/3
          [@media(max-height:750px)]:bottom-[60%] 
          [@media(max-height:750px)]:-translate-y-[60%]" //gap-2 flex
          // className="absolute left-0 bottom-11 bg-black bg-opacity-30 text-white px-3 py-1 rounded-r-lg text-sm z-10"
        >
          {/* <FontAwesomeIcon
            icon={isMuted ? faVolumeUp : faVolumeMute}
            className="text-lg"
          />
          <span className="font-medium">{isMuted ? "Unmute" : "Mute"}</span> */}
          {isMuted ? "Unmute 🔊" : "Mute 🔇"}
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
