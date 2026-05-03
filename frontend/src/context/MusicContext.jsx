import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import {
  clearSpotifyToken,
  completeSpotifyLoginFromUrl,
  getSavedSpotifyToken,
  getSpotifyAccessToken,
  isSpotifyConfigured,
  startSpotifyLogin
} from "../utils/spotifyAuth";

const MusicContext = createContext(null);
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export const MusicProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const spotifyPlayerRef = useRef(null);
  const spotifyCallbackHandledRef = useRef(false);
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
  const [sourceMode, setSourceMode] = useState("preview");
  const [spotifyToken, setSpotifyToken] = useState(() => getSavedSpotifyToken());
  const [spotifyDeviceId, setSpotifyDeviceId] = useState("");
  const [spotifyReady, setSpotifyReady] = useState(false);
  const spotifyConfigured = isSpotifyConfigured();

  const replaceSpotifyCallbackUrl = () => {
    const url = new URL(window.location.href);
    ["code", "state", "error"].forEach((key) => url.searchParams.delete(key));
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  };

  const fetchSpotify = useCallback(async (path, options = {}) => {
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
      throw new Error("Connect Spotify Premium first.");
    }

    const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      clearSpotifyToken();
      setSpotifyToken(null);
      throw new Error("Spotify session expired. Connect Spotify again.");
    }

    return response;
  }, []);

  const findSpotifyTrackUri = useCallback(
    async (song) => {
      const query = encodeURIComponent(`${song.title} ${song.artist}`);
      const response = await fetchSpotify(`/search?type=track&limit=8&market=IN&q=${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Spotify search failed.");
      }

      const title = song.title.toLowerCase();
      const artist = song.artist.toLowerCase();
      const tracks = data.tracks?.items || [];
      const bestMatch =
        tracks.find((track) => {
          const trackName = track.name.toLowerCase();
          const artistNames = track.artists.map((item) => item.name.toLowerCase()).join(" ");
          return (trackName.includes(title) || title.includes(trackName)) && artistNames.includes(artist.split(" ")[0]);
        }) || tracks[0];

      return bestMatch?.uri || null;
    },
    [fetchSpotify]
  );

  const trySpotifyPlayback = useCallback(
    async (song) => {
      if (!spotifyToken || !spotifyDeviceId || !spotifyPlayerRef.current) return false;

      const trackUri = await findSpotifyTrackUri(song);
      if (!trackUri) {
        toast.error("Spotify could not find this exact track, using preview instead.");
        return false;
      }

      try {
        await spotifyPlayerRef.current.activateElement();
      } catch {
        // Some browsers only allow activation after a direct click. Playback API below still handles most cases.
      }

      await fetchSpotify("/me/player", {
        method: "PUT",
        body: JSON.stringify({ device_ids: [spotifyDeviceId], play: false })
      });

      const response = await fetchSpotify(`/me/player/play?device_id=${encodeURIComponent(spotifyDeviceId)}`, {
        method: "PUT",
        body: JSON.stringify({ uris: [trackUri], position_ms: 0 })
      });

      if (!response.ok) {
        let message = "Spotify playback failed.";
        try {
          const data = await response.json();
          message = data.error?.message || message;
        } catch {
          // Spotify returns 204 with no body on success.
        }
        throw new Error(response.status === 403 ? "Spotify Premium is required for full playback." : message);
      }

      audioRef.current.pause();
      setSourceMode("spotify");
      setSourceInfo({
        source: "Spotify Premium",
        sourceTitle: song.title,
        sourceArtist: song.artist,
        sourceAlbum: song.album
      });
      setDuration(song.duration || 30);
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(true);
      return true;
    },
    [fetchSpotify, findSpotifyTrackUri, spotifyDeviceId, spotifyToken]
  );

  const playSong = useCallback(async (song, upcoming = []) => {
    if (!song) return;

    setLoadingPreview(true);
    setProgress(0);
    setCurrentTime(0);
    setDuration(30);
    setCurrentSong(song);
    setQueue(upcoming.filter((item) => item.id !== song.id));
    setHistory((items) => [song, ...items.filter((item) => item.id !== song.id)].slice(0, 10));

    try {
      try {
        const spotifyPlayed = await trySpotifyPlayback(song);
        if (spotifyPlayed) {
          api.post(`/songs/${song.id}/play`).catch(() => {});
          return;
        }
      } catch (error) {
        toast.error(error.message || "Spotify playback failed, using preview instead.");
      }

      const { data } = await api.get(`/songs/${song.id}/preview`);
      audioRef.current.pause();
      audioRef.current.src = data.previewUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume;
      setSourceMode("preview");
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
  }, [trySpotifyPlayback, volume]);

  const togglePlay = useCallback(async () => {
    if (!currentSong) return;
    if (sourceMode === "spotify" && spotifyPlayerRef.current) {
      try {
        await spotifyPlayerRef.current.togglePlay();
        setIsPlaying((value) => !value);
      } catch {
        toast.error("Spotify player is still connecting");
      }
      return;
    }

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
  }, [currentSong, isPlaying, sourceMode]);

  const next = useCallback(() => {
    if (!queue.length) return;
    const [nextSong, ...rest] = queue;
    playSong(nextSong, rest);
  }, [playSong, queue]);

  const previous = useCallback(() => {
    if (history.length < 2) return;
    playSong(history[1], queue);
  }, [history, playSong, queue]);

  const changeVolume = useCallback((value) => {
    const nextVolume = Number(value);
    audioRef.current.volume = nextVolume;
    if (spotifyPlayerRef.current) {
      spotifyPlayerRef.current.setVolume(nextVolume).catch(() => {});
    }
    setVolume(nextVolume);
  }, []);

  const seekTo = useCallback((value) => {
    if (!currentSong) return;
    const nextProgress = Number(value);

    if (sourceMode === "spotify" && spotifyPlayerRef.current) {
      const nextTime = (nextProgress / 100) * duration;
      spotifyPlayerRef.current.seek(Math.round(nextTime * 1000)).catch(() => toast.error("Spotify seek failed"));
      setCurrentTime(nextTime);
      setProgress(nextProgress);
      return;
    }

    if (!Number.isFinite(audioRef.current.duration)) return;

    const nextTime = (nextProgress / 100) * audioRef.current.duration;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
    setProgress(nextProgress);
  }, [currentSong, duration, sourceMode]);

  const connectSpotify = useCallback(async () => {
    try {
      await startSpotifyLogin();
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  const disconnectSpotify = useCallback(() => {
    spotifyPlayerRef.current?.disconnect();
    spotifyPlayerRef.current = null;
    clearSpotifyToken();
    setSpotifyToken(null);
    setSpotifyDeviceId("");
    setSpotifyReady(false);
    if (sourceMode === "spotify") {
      setIsPlaying(false);
    }
    toast.success("Spotify disconnected");
  }, [sourceMode]);

  useEffect(() => {
    if (!spotifyConfigured) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.get("code") && !params.get("error")) return;
    if (spotifyCallbackHandledRef.current) return;
    spotifyCallbackHandledRef.current = true;

    completeSpotifyLoginFromUrl()
      .then((token) => {
        if (token) {
          setSpotifyToken(token);
          replaceSpotifyCallbackUrl();
          toast.success("Spotify connected to Beatify");
        }
      })
      .catch((error) => {
        replaceSpotifyCallbackUrl();
        toast.error(error.message);
      });
  }, [spotifyConfigured]);

  useEffect(() => {
    if (!spotifyConfigured || !spotifyToken || spotifyPlayerRef.current) return undefined;

    let cancelled = false;

    const initializeSpotifyPlayer = () => {
      if (cancelled || !window.Spotify || spotifyPlayerRef.current) return;

      const player = new window.Spotify.Player({
        name: "Beatify Web Player",
        volume,
        getOAuthToken: async (callback) => {
          const accessToken = await getSpotifyAccessToken();
          if (accessToken) callback(accessToken);
        }
      });

      player.addListener("ready", ({ device_id }) => {
        setSpotifyDeviceId(device_id);
        setSpotifyReady(true);
      });

      player.addListener("not_ready", () => {
        setSpotifyReady(false);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        setSourceMode("spotify");
        setIsPlaying(!state.paused);
        setDuration((state.duration || 0) / 1000 || 30);
        setCurrentTime((state.position || 0) / 1000);
        if (state.duration) {
          setProgress((state.position / state.duration) * 100);
        }
      });

      player.addListener("initialization_error", ({ message }) => toast.error(`Spotify initialization: ${message}`));
      player.addListener("authentication_error", ({ message }) => {
        clearSpotifyToken();
        setSpotifyToken(null);
        toast.error(`Spotify authentication: ${message}`);
      });
      player.addListener("account_error", () => toast.error("Spotify Premium is required for full playback."));
      player.addListener("playback_error", ({ message }) => toast.error(`Spotify playback: ${message}`));

      spotifyPlayerRef.current = player;
      player.connect();
    };

    if (window.Spotify) {
      initializeSpotifyPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializeSpotifyPlayer;
      if (!document.getElementById("spotify-player-sdk")) {
        const script = document.createElement("script");
        script.id = "spotify-player-sdk";
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [spotifyConfigured, spotifyToken, volume]);

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      const audioDuration = audio.duration || 30;
      setDuration(audioDuration);
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audioDuration) * 100);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", next);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", next);
    };
  }, [next]);

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
      sourceMode,
      spotifyConfigured,
      spotifyConnected: Boolean(spotifyToken && spotifyDeviceId),
      spotifyReady,
      playSong,
      togglePlay,
      next,
      previous,
      changeVolume,
      seekTo,
      connectSpotify,
      disconnectSpotify
    }),
    [
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
      sourceMode,
      spotifyConfigured,
      spotifyToken,
      spotifyDeviceId,
      spotifyReady,
      playSong,
      togglePlay,
      next,
      previous,
      changeVolume,
      seekTo,
      connectSpotify,
      disconnectSpotify
    ]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

export const useMusic = () => useContext(MusicContext);
