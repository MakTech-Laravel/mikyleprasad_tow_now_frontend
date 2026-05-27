export type DemoReel = {
  id: number;
  username: string;
  caption: string;
  videoUrl: string;
  likes: number;
  comments: number;
  shares: number;
};

const reelVideoFiles = [
  '1758288967_68cd5c47e76df.mp4',
  '1758967077_68d7b525190fa.mp4',
  'video_8.mp4',
  '1758289002_68cd5c6ab6715.mp4',
  'Article-Rosy-Daisy-Hand-painted-Dm-to-place-your-order-.-new-collection-handmade-f.mp4',
  'K6ikTdo4xuXLRArFNwiAYdHHh2puXADObz03JG4W.mp4',
  'video.mp4',
  'Hand-painted-stories-on-fabric-🌻-Sola-🌸-Daisy-Mist-handmade-art-you-can-wear-.Sunf_.mp4',
  'video_4.mp4',
  'video_10.mp4',
  '1758423197_68cf689d10f42.mp4',
  '1758288931_68cd5c23e5247.mp4',
] as const;

const usernames = [
  '@urban.motion',
  '@wave.story',
  '@food.loop',
  '@lens.daily',
  '@craft.vibes',
  '@reel.factory',
] as const;

function buildLocalVideoPath(fileName: string) {
  return `/reels/${encodeURIComponent(fileName)}`;
}

const ITEM_COUNT = 20;

export const demoReels: DemoReel[] = Array.from({ length: ITEM_COUNT }, (_, index) => {
  const fileName = reelVideoFiles[index % reelVideoFiles.length];
  const id = index + 1;
  return {
    id,
    username: usernames[index % usernames.length],
    caption: `Reel #${id} from local library. Scroll for continuous looped feed.`,
    videoUrl: buildLocalVideoPath(fileName),
    likes: 1500 + id * 13,
    comments: 40 + (id % 220),
    shares: 8 + (id % 75),
  };
});
