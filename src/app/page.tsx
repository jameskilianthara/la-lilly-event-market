'use client';

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Users,
  Share2,
  FileCheck,
  Instagram,
  Linkedin
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "AI-Powered Planning",
    description: "Our intelligent system creates the perfect event blueprint by understanding your vision and matching you with industry professionals."
  },
  {
    icon: Users,
    title: "Training Academy",
    description: "Professional development school for event managers and craftsmen. Learn from industry veterans with thousands of successful events."
  },
  {
    icon: Share2,
    title: "Inventory & Resource Management",
    description: "Shared inventory database across partner companies. Optimize equipment, transport, and labor allocation for maximum efficiency."
  },
  {
    icon: FileCheck,
    title: "Quality Assurance",
    description: "Every event backed by our industry experience and dedicated support from planning to execution."
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">

      {/* Hero Section - Raw Reality of Event Making */}
      <section className="relative min-h-screen bg-black overflow-hidden">
        {/* Chaotic Background Images */}
        <div className="absolute inset-0">
          {/* Multiple layered images for chaos effect */}
          <div className="absolute inset-0 opacity-20">
            <Image
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2000&auto=format&fit=crop"
              alt="Behind the scenes event setup chaos"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />
          
          {/* Scattered floating elements - representing chaos */}
          <div className="absolute top-20 left-10 w-4 h-4 bg-blue-500 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="absolute top-32 right-20 w-3 h-3 bg-yellow-400 rounded-full opacity-70 animate-bounce" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-40 left-32 w-5 h-5 bg-blue-400 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-10 w-2 h-2 bg-green-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-20 right-1/4 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '2s' }} />
        </div>

        {/* Left side - Raw story */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white"
            >
              {/* Foundry headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-8">
                <span className="block text-white mb-2">PLAN</span>
                <span className="block text-white mb-2">EXTRAORDINARY</span>
                <span className="block bg-gradient-to-r from-orange-400 to-blue-600 bg-clip-text text-transparent">
                  EVENTS.
                </span>
              </h1>
              
              {/* The real story */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="space-y-4 mb-10"
              >
                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                  Built by industry veterans with <em className="text-orange-400 font-medium">thousands of successful events</em>,<br />
                  we create <strong className="text-white">extraordinary experiences</strong> through innovation and expertise.
                </p>
                <p className="text-base sm:text-lg text-gray-400">
                  AI-powered planning. Professional training. Shared resources. Transparent marketplace.<br />
                  <span className="text-orange-400 font-medium">This is how the industry evolves.</span>
                </p>
              </motion.div>

              {/* Raw CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="space-y-4"
              >
                <Link
                  href="/forge"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xl rounded-xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-600/50"
                >
                  Plan My Event →
                </Link>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Industry Veterans</span>
                  <span>•</span>
                  <span>Thousands of Events</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right side - Visual story */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* Main behind-the-scenes image */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop"
                  alt="Event planners working frantically behind the scenes"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Overlay text on image */}
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <p className="text-sm font-medium">3:30 AM - Still setting up</p>
                    <p className="text-xs opacity-75">&quot;Just 5 more hours to showtime&quot;</p>
                  </div>
                </div>
              </div>
              
              {/* Smaller chaos images */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-xl overflow-hidden shadow-xl border-4 border-white">
                <Image
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop"
                  alt="Event coordination excellence"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
              
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full overflow-hidden shadow-xl border-4 border-blue-500">
                <Image
                  src="https://images.unsplash.com/photo-1464207687429-7505649dae38?q=80&w=800&auto=format&fit=crop"
                  alt="Final result - the magic moment"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom truth strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>2,847 sleepless nights</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>15,293 last-minute calls</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>∞ moments of pure magic</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Highlights - The Reality */}
      <section id="features" className="py-16 sm:py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Industry veterans create extraordinary experiences
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Every event is crafted with precision through <em className="text-orange-400">AI-powered planning</em> and shared industry resources
            </p>
          </motion.div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="h-full bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 border border-gray-700 hover:border-blue-500/50 p-8 rounded-2xl transition-all duration-300 group-hover:scale-105 shadow-lg">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl mb-6 group-hover:from-blue-800/60 group-hover:to-blue-700/60 transition-all duration-300 border border-blue-700/30">
                    <feature.icon className="w-6 h-6 text-blue-400" aria-hidden="true" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                    {feature.description}
                  </p>

                  {/* Decorative gradient */}
                  <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            {/* Left side - Branding */}
            <div className="text-center sm:text-left">
              <Link
                href="/"
                className="inline-block mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md"
                aria-label="EventFoundry homepage"
              >
                <div className="flex items-center space-x-2 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-blue-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">EF</span>
                  </div>
                  <span className="text-white font-bold text-lg">EventFoundry</span>
                </div>
              </Link>
              <div className="text-gray-400 text-sm">
                <span>Founded in Kochi India · Industry veterans</span>
              </div>
            </div>
            
            {/* Right side - Contact & Social */}
            <div className="flex items-center gap-6">
              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <Link
                  href="https://instagram.com/eventfoundry"
                  className="p-2 text-gray-400 hover:text-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </Link>
                <Link
                  href="https://linkedin.com/company/eventfoundry"
                  className="p-2 text-gray-400 hover:text-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md"
                  aria-label="Connect with us on LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </Link>
              </div>
              
              {/* Contact Email */}
              <Link
                href="mailto:hello@eventfoundry.com"
                className="text-gray-300 hover:text-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md font-medium"
                aria-label="Send us an email"
              >
                hello@eventfoundry.com
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}