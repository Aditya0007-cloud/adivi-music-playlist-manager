export const getYoutubeQuery = (song) => {
  if (!song) return "";
  return song.youtubeQuery || `${song.title} ${song.artist} official song`;
};

export const getYoutubeEmbedUrl = (song, autoplay = true) => {
  const params = new URLSearchParams({
    listType: "search",
    list: getYoutubeQuery(song),
    rel: "0",
    modestbranding: "1",
    playsinline: "1"
  });

  if (autoplay) params.set("autoplay", "1");

  return `https://www.youtube.com/embed?${params.toString()}`;
};

export const getYoutubeSearchUrl = (song) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(getYoutubeQuery(song))}`;
