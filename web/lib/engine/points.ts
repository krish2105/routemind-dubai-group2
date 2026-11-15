import type { Point } from "@/lib/types";

/** Approximate area centroids across Dubai (APPROXIMATE, for simulation only). */
const SZR = ["szr"] as const;
export const HUB: Point = { id: "hub", name: "DubaiDash Hub, Al Quoz", lat: 25.1437, lng: 55.2306, corridors: ["szr"] };

export const POINT_POOL: Point[] = [
  { id: "downtown", name: "Downtown Dubai", lat: 25.1972, lng: 55.2744, corridors: ["szr"] },
  { id: "business-bay", name: "Business Bay", lat: 25.185, lng: 55.265, corridors: ["szr", "alkhail"] },
  { id: "difc", name: "DIFC", lat: 25.213, lng: 55.28, corridors: ["szr"] },
  { id: "city-walk", name: "City Walk", lat: 25.205, lng: 55.26, corridors: [] },
  { id: "jumeirah", name: "Jumeirah", lat: 25.2048, lng: 55.2417, corridors: [] },
  { id: "umm-suqeim", name: "Umm Suqeim", lat: 25.145, lng: 55.195, corridors: [] },
  { id: "al-wasl", name: "Al Wasl", lat: 25.2, lng: 55.25, corridors: [] },
  { id: "satwa", name: "Al Satwa", lat: 25.225, lng: 55.27, corridors: [] },
  { id: "marina", name: "Dubai Marina", lat: 25.0805, lng: 55.1403, corridors: ["szr"] },
  { id: "jlt", name: "Jumeirah Lakes Towers", lat: 25.0689, lng: 55.1424, corridors: ["szr"] },
  { id: "palm", name: "Palm Jumeirah", lat: 25.1124, lng: 55.139, corridors: [] },
  { id: "discovery", name: "Discovery Gardens", lat: 25.042, lng: 55.145, corridors: [] },
  { id: "emirates-hills", name: "Emirates Hills", lat: 25.075, lng: 55.17, corridors: [] },
  { id: "springs", name: "The Springs", lat: 25.056, lng: 55.168, corridors: [] },
  { id: "al-barsha", name: "Al Barsha", lat: 25.113, lng: 55.198, corridors: ["szr"] },
  { id: "dubai-hills", name: "Dubai Hills", lat: 25.102, lng: 55.242, corridors: ["alkhail"] },
  { id: "motor-city", name: "Motor City", lat: 25.05, lng: 55.233, corridors: [] },
  { id: "sports-city", name: "Sports City", lat: 25.04, lng: 55.22, corridors: [] },
  { id: "jvc", name: "Jumeirah Village Circle", lat: 25.06, lng: 55.209, corridors: [] },
  { id: "arabian-ranches", name: "Arabian Ranches", lat: 25.054, lng: 55.268, corridors: [] },
  { id: "deira", name: "Deira", lat: 25.2697, lng: 55.3095, corridors: [] },
  { id: "bur-dubai", name: "Bur Dubai", lat: 25.2532, lng: 55.2975, corridors: [] },
  { id: "karama", name: "Al Karama", lat: 25.242, lng: 55.3, corridors: [] },
  { id: "oud-metha", name: "Oud Metha", lat: 25.237, lng: 55.31, corridors: ["alkhail"] },
  { id: "festival-city", name: "Festival City", lat: 25.22, lng: 55.355, corridors: ["alkhail"] },
  { id: "ras-al-khor", name: "Ras Al Khor", lat: 25.18, lng: 55.34, corridors: ["alkhail"] },
  { id: "nad-al-sheba", name: "Nad Al Sheba", lat: 25.16, lng: 55.3, corridors: ["alkhail"] },
  { id: "nahda", name: "Al Nahda", lat: 25.29, lng: 55.37, corridors: [] },
  { id: "qusais", name: "Al Qusais", lat: 25.29, lng: 55.38, corridors: [] },
  { id: "mirdif", name: "Mirdif", lat: 25.22, lng: 55.42, corridors: [] },
  { id: "warqa", name: "Warqa", lat: 25.19, lng: 55.42, corridors: [] },
  { id: "intl-city", name: "International City", lat: 25.163, lng: 55.406, corridors: [] },
  { id: "silicon-oasis", name: "Dubai Silicon Oasis", lat: 25.1217, lng: 55.38, corridors: [] },
  { id: "dip", name: "Dubai Investment Park", lat: 24.99, lng: 55.17, corridors: [] },
  { id: "jebel-ali", name: "Jebel Ali", lat: 25.005, lng: 55.06, corridors: ["szr"] },
  { id: "al-quoz", name: "Al Quoz", lat: 25.14, lng: 55.225, corridors: ["szr"] },
];
void SZR;
