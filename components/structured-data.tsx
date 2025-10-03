export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The Plate Yard",
    "url": "https://theplateyrd.com",
    "logo": "https://theplateyrd.com/social-preview.jpg",
    "description": "USA-made Hi-Temp bumper plates with minor cosmetic blemishes at wholesale prices",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    },
    "sameAs": [
      // Add your social media profiles here when available
    ],
    "offers": {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Product",
        "name": "Hi-Temp Factory Second Bumper Plates",
        "description": "Official Hi-Temp bumper plates with minor cosmetic blemishes at wholesale prices",
        "brand": "Hi-Temp",
        "category": "Fitness Equipment"
      },
      "seller": {
        "@type": "Organization",
        "name": "The Plate Yard"
      },
      "availability": "https://schema.org/PreOrder",
      "priceValidUntil": "2025-12-31"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  )
}
