import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer style={{ backgroundColor: "#1a1a1a" }} className="text-white border-t-2 border-black">
      <div className="px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="mb-4">
                <Image 
                  src="/plate-yard-logo-white.svg" 
                  alt="The Plate Yard" 
                  width={200} 
                  height={60}
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm opacity-80 mb-4 font-bold">FACTORY SECONDS. FIRST CLASS GAINS.</p>
              <p className="text-sm text-gray-400">
                Official Hi-Temp bumper plates with minor blemishes at major savings.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
                QUICK LINKS
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="hover:text-lime-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-lime-400 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/my-account" className="hover:text-lime-400 transition-colors">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link href="/modify-order" className="hover:text-lime-400 transition-colors">
                    Modify Order
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
                CONTACT
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>1013 Hazeltn ln.</li>
                <li>Fuquay-Varina, NC 27526</li>
                <li className="pt-2">
                  <a href="mailto:info@theplateyard.com" className="hover:text-lime-400 transition-colors">
                    info@theplateyard.com
                  </a>
                </li>
                <li>
                  <a href="tel:+16073295976" className="hover:text-lime-400 transition-colors">
                    (607) 329-5976
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} The Plate Yard. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
