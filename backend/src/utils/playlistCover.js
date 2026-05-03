const gradients = [
  "from-emerald-400 via-lime-300 to-cyan-400",
  "from-fuchsia-500 via-rose-400 to-orange-300",
  "from-sky-400 via-indigo-400 to-violet-500",
  "from-amber-300 via-emerald-300 to-teal-500",
  "from-red-400 via-pink-400 to-purple-500"
];

export const generatePlaylistCover = (name = "Beatify") => {
  const total = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return gradients[total % gradients.length];
};
