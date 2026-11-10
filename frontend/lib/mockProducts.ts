import dummyProductImage from "@/assets/dummy_product.jpg";
import type { Product } from "./types";

// Isolated fixture for frontend QA. Loaded dynamically only when demo mode is on.
// Clearly labelled; never sent to Midtrans, never written to the database.
export const demoProducts: Product[] = [
  {
    id: -1,
    name: "Demo Tee - Sample",
    price: 149000,
    stock: 6,
    description: "Demo product for frontend preview only. Not for sale.",
    category: "Baju",
    image_url: dummyProductImage.src,
    images: [dummyProductImage.src],
    is_coming_soon: false,
    isDemo: true,
  },
];
