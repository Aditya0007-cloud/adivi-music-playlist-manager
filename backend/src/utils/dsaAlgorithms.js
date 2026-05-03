// Beatify DSA utility file.
// These algorithms are intentionally simple and commented for a college viva.

export class LinkedListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

export class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  append(value) {
    const node = new LinkedListNode(value);
    if (!this.head) {
      this.head = node;
      this.tail = node;
      return;
    }
    this.tail.next = node;
    this.tail = node;
  }

  toArray() {
    const result = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
}

export const arrayToLinkedList = (songs) => {
  const list = new LinkedList();
  songs.forEach((song) => list.append(song));
  return list;
};

// Array/List: Mongo returns songs as an array. Linear search scans one by one.
export const linearSongSearch = (songs, query = "") => {
  const q = query.toLowerCase();
  return songs.filter((song) =>
    [song.title, song.artist, song.album, song.mood].some((field) =>
      String(field).toLowerCase().includes(q)
    )
  );
};

// Sorting: JavaScript arrays act like dynamic arrays, and this comparator
// lets Beatify sort by song name, artist, or duration.
export const sortSongs = (songs, sortBy = "title") => {
  const key = sortBy === "artist" ? "artist" : sortBy === "duration" ? "duration" : "title";
  return [...songs].sort((a, b) => {
    if (key === "duration") return a.duration - b.duration;
    return String(a[key]).localeCompare(String(b[key]));
  });
};

// Binary Search: Works only on data sorted by title. Each loop halves the range.
export const binarySearchByTitle = (songs, targetTitle = "") => {
  const sorted = sortSongs(songs, "title");
  let left = 0;
  let right = sorted.length - 1;
  const steps = [];
  const target = targetTitle.toLowerCase();

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const current = sorted[mid].title.toLowerCase();
    steps.push({ left, right, mid, title: sorted[mid].title });

    if (current === target) {
      return { found: sorted[mid], steps };
    }
    if (current < target) left = mid + 1;
    else right = mid - 1;
  }

  return { found: null, steps };
};

// HashMap: Map gives near O(1) lookup by id, useful for matching playlist ids
// to full song objects without repeatedly looping over the full catalog.
export const buildSongMap = (songs) => new Map(songs.map((song) => [String(song._id || song.id), song]));

// Stack: Most recent song is kept at the front. Limit keeps memory small.
export const pushRecentStack = (recentlyPlayed, songId, limit = 10) => {
  const withoutDuplicate = recentlyPlayed.filter((item) => String(item.song || item.songId) !== String(songId));
  return [{ song: songId, playedAt: new Date() }, ...withoutDuplicate].slice(0, limit);
};

// Queue: Enqueue at back, dequeue from front. Used by the frontend player.
export const enqueue = (queue, song) => [...queue, song];
export const dequeue = (queue) => ({ next: queue[0] || null, queue: queue.slice(1) });
