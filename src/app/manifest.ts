import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BizNepal",
    short_name: "BizNepal",
    description: "Nepal's All-in-One Business Listing & E-Commerce Super App",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#0D7377",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      }
    ]
  }
}
