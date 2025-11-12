import React from "react";
import { Heart, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 text-white pt-16 pb-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2.5 rounded-2xl shadow-lg">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">HopeCare</h3>
                <p className="text-xs text-cyan-200">Healthcare Simplified</p>
              </div>
            </div>
            <p className="text-sm text-cyan-100 leading-relaxed">
              Committed to providing quality healthcare through advanced medical technology and compassionate care.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <button
                  key={i}
                  className="bg-white/10 backdrop-blur-sm p-2 rounded-xl hover:bg-white/20 transition-all hover:scale-110"
                >
                  <Icon className="w-5 h-5 text-cyan-200" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["About Us", "Departments", "Doctors", "Blog", "Careers"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-cyan-200 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-lg mb-4">Services</h4>
            <ul className="space-y-2">
              {["Emergency Care", "Surgery", "Diagnostics", "Pharmacy", "Health Records"].map((service) => (
                <li key={service}>
                  <a href="#" className="text-sm text-cyan-200 hover:text-white transition-colors">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-cyan-100">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 flex-shrink-0 text-cyan-300" />
                <span>45 MG Road, Guwahati, Assam</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 flex-shrink-0 text-cyan-300" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 flex-shrink-0 text-cyan-300" />
                <span>care@hopecare.com</span>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-sm font-semibold text-cyan-200 mb-2">24/7 Emergency</p>
              <p className="text-sm text-cyan-100">108 / +91 98100 12345</p>
            </div>
          </div>
        </div>

        <div className="border-t border-cyan-700/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-cyan-200">
            © 2025 HopeCare Hospital. All rights reserved.
          </p>
          <p className="text-sm text-cyan-200">
            Designed with <Heart className="w-4 h-4 inline fill-red-500 text-red-500" /> by Team Achievers
          </p>
        </div>
      </div>
    </footer>
  );
}
