import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  console.log("Generating PWA Manifest...");
  return {
    name: "MUDWASH Premium Detailing",
    short_name: "MUDWASH",
    description: "Professional mobile automotive detailing and ceramic coating services.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#f69621",
    orientation: "portrait",
    icons: [
      {
        src: "/mudwash-logo-final.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/mudwash-logo-final.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/mudwash-logo-final.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/mudwash-logo-final.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
