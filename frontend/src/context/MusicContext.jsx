import { createContext, useContext, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";

const MusicContext = createContext(null);

export const MusicProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sourceInfo, setSourceInfo] = useState(null);

  const playSong = async (song, upcoming = []) => {
    if (!song) return;

    setLoadingPreview(true);
    setProgress(0);
    setCurrentTime(0);
    setDuration(30);
    setCurrentSong(song);
    setQueue(upcoming.filter((item) => item.id !== song.id));
    setHistory((items) => [song, ...items.filter((item) => item.id !== song.id)].slice(0, 10));

    try {
      const { data } = await api.get(`/songs/${song.id}/preview`);
      audioRef.current.pause();
      audioRef.current.src = data.previewUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume;
      setSourceInfo(data);
      await audioRef.current.play();
      setIsPlaying(true);
      api.post(`/songs/${song.id}/play`).catch(() => {});
    } catch (error) {
      setIsPlaying(false);
      setSourceInfo(null);
      toast.error(error.response?.data?.message || "No playable original preview found");
    } finally {
      setLoadingPreview(false);
    }
  };

  const togglePlay = async () => {
    if (!currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch {
      toast.error("Press a song card again to start playback");
    }
  };

  const next = () => {
    if (!queue.length) return;
    const [nextSong, ...rest] = queue;
    playSong(nextSong, rest);
  };

  const previous = () => {
    if (history.length < 2) return;
    playSong(history[1], queue);
  };

  const changeVolume = (value) => {
    const nextVolume = Number(value);
    audioRef.current.volume = nextVolume;
    setVolume(nextVolume);
  };

  const seekTo = (value) => {
    if (!currentSong || !Number.isFinite(audioRef.current.duration)) return;

    const nextProgress = Number(value);
    const nextTime = (nextProgress / 100) * audioRef.current.duration;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
    setProgress(nextProgress);
  };

  audioRef.current.ontimeupdate = () => {
    const duration = audioRef.current.duration || 30;
    setDuration(duration);
    setCurrentTime(audioRef.current.currentTime);
    setProgress((audioRef.current.currentTime / duration) * 100);
  };

  audioRef.current.onended = next;

  const value = useMemo(
    () => ({
      currentSong,
      isPlaying,
      queue,
      history,
      volume,
      progress,
      currentTime,
      duration,
      loadingPreview,
      sourceInfo,
      playSong,
      togglePlay,
      next,
      previous,
      changeVolume,
      seekTo
    }),
    [currentSong, isPlaying, queue, history, volume, progress, currentTime, duration, loadingPreview, sourceInfo]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

export const useMusic = () => useContext(MusicContext);
