"use server";

const YOGA_API_POSES_URL = "https://yoga-api-nzy4.onrender.com/v1/poses";

export interface YogaPoseMedia {
  image: string;
  svg?: string;
  sourceName: string;
  attributionRequired: boolean;
}

interface RawYogaPose {
  english_name: string;
  url_png?: string;
  url_svg?: string;
}

const POSE_ALIASES: Record<string, string[]> = {
  "adho-mukha": ["Downward-Facing Dog"],
  "virabhadrasana-2": ["Warrior Two", "Warrior II"],
  vrksasana: ["Tree"],
  trikonasana: ["Triangle"],
  "setu-bandha": ["Bridge"],
  paschimottanasana: ["Seated Forward Bend"],
  balasana: ["Child's Pose"],
  savasana: ["Corpse"],
  ustrasana: ["Camel"],
  "ardha-matsyendrasana": ["Half Lord of the Fishes"],
  utkatasana: ["Chair"],
  uttanasana: ["Standing Forward Bend"],
  sarvangasana: ["Shoulder Stand"],
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export async function fetchYogaPoseMediaMap(): Promise<Record<string, YogaPoseMedia>> {
  try {
    const response = await fetch(YOGA_API_POSES_URL, { next: { revalidate: 86400 } });
    if (!response.ok) throw new Error(`Yoga API responded ${response.status}`);
    const poses = (await response.json()) as RawYogaPose[];
    const byName = new Map(poses.map((pose) => [normalize(pose.english_name), pose]));
    const media: Record<string, YogaPoseMedia> = {};

    for (const [localId, names] of Object.entries(POSE_ALIASES)) {
      const pose = names.map((name) => byName.get(normalize(name))).find(Boolean);
      if (!pose?.url_png) continue;
      media[localId] = {
        image: pose.url_png,
        svg: pose.url_svg,
        sourceName: pose.english_name,
        attributionRequired: true,
      };
    }

    return media;
  } catch (err) {
    console.error("Failed to load Yoga API pose media:", err);
    return {};
  }
}
