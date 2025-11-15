import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  FileText,
  Shield,
  RefreshCw,
  Eye
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const policyLinks = [
    { to: '/terms', label: 'Terms & Conditions', icon: FileText },
    { to: '/privacy', label: 'Privacy Policy', icon: Shield },
    { to: '/refund', label: 'Refund Policy', icon: RefreshCw },
    { to: '/fairplay', label: 'Fair Play Policy', icon: Eye }
  ];

  const quickLinks = [
    { to: '/tournaments', label: 'Tournaments' },
    { to: '/media', label: 'Media Gallery' },
    { to: '/support', label: 'Support' },
    { to: '/wallet', label: 'Wallet' }
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: 'https://www.instagram.com/gameon_.official?utm_source=qr&igsh=MWt5YW52bHM5NWRjZA==', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' }
  ];

  return (
    <footer className="bg-gradient-to-t from-black via-gray-900 to-gray-800 border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-400 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">GameOn</h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              India's premier esports tournament platform. Join thousands of gamers competing for real cash prizes in fair and secure tournaments.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-white/70 hover:text-white" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.to}
                    className="text-white/60 hover:text-white transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal & Policies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-white">Legal & Policies</h4>
            <ul className="space-y-3">
              {policyLinks.map((policy, index) => (
                <li key={index}>
                  <Link
                    href={policy.to}
                    className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors duration-300 text-sm group"
                  >
                    <policy.icon className="w-4 h-4 group-hover:text-blue-400 transition-colors duration-300" />
                    <span>{policy.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-white">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a 
                  href="mailto:support@gameon.com" 
                  className="text-white/60 hover:text-white transition-colors duration-300 text-sm"
                >
                  support@gameon.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a 
                  href="tel:+91-8488956724" 
                  className="text-white/60 hover:text-white transition-colors duration-300 text-sm"
                >
                  +91-8488956724
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-white/60 text-sm">
                  Ahmebadab, Gujarat, India
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-white/10 mt-12 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-white/60 text-sm text-center md:text-left">
              <p>© {currentYear} GameOn. All rights reserved.</p>
              <p className="mt-1">
                Designed with Love for the gaming community
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs text-white/40">
              <span>🔒 Secure Payments</span>
              <span>⚡ Instant Payouts</span>
              <span>🛡️ Fair Play Guaranteed</span>
              <span>🎮 24/7 Support</span>
            </div>
          </div>
        </motion.div>

        {/* Legal Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
        >
          <p className="text-yellow-300 text-xs text-center leading-relaxed">
            <strong>Legal Notice:</strong> GameOn operates under Indian gaming laws. 
            Participants must be 18+ years old. Gambling is prohibited. 
            This platform is for skill-based gaming tournaments only. 
            Please play responsibly.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;