import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BizNepal",
    short_name: "BizNepal",
    description: "Nepal's Business Directory — Find local businesses, jobs, events and offers",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#DC2626",
    categories: ["business", "shopping", "local"],
    lang: "en-NP",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-192x192.png", 
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512", 
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow"
      },
      {
        src: "/screenshot-desktop.png",
        sizes: "1280x720",
        type: "image/png", 
        form_factor: "wide"
      }
    ]
  }
}
