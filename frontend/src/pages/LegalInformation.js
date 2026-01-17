import React from 'react';
import Head from 'next/head';
import { ArrowLeft, Scale, ShieldCheck, Gavel, Mail, MapPin, Info, User, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const LegalInformation = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8">
      <Head>
        <title>Legal Information | GameOn</title>
      </Head>

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-300 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-gradient">Legal Information</span>
            </h1>
            <p className="text-white/60 text-lg max-w-3xl mx-auto">
              Official legal details and compliance information for GameOn platform.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          
          {/* 1. About GameOn */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                <Info className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">1. About GameOn</h2>
            </div>
            <p className="text-white/80 leading-relaxed">
              GameOn is a premium esports tournament platform designed to provide a competitive environment for gamers to showcase their skills. We focus on organizing high-quality tournaments across various popular gaming titles, ensuring a fair and transparent experience for all participants.
            </p>
          </div>

          {/* 2. Legal Business Details */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">2. Legal Business Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/80">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <p className="text-purple-400 text-sm font-semibold uppercase mb-1">Legal Business Name</p>
                <p className="text-white font-medium">Vivek Badgujar</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <p className="text-purple-400 text-sm font-semibold uppercase mb-1">Ownership</p>
                <p className="text-white font-medium">Sole Proprietor (Individual)</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <p className="text-purple-400 text-sm font-semibold uppercase mb-1">Country</p>
                <p className="text-white font-medium">India</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <p className="text-purple-400 text-sm font-semibold uppercase mb-1">Location</p>
                <p className="text-white font-medium">Ahmedabad, Gujarat, India</p>
              </div>
            </div>
          </div>

          {/* 3. Nature of the Platform */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                <ShieldCheck className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">3. Nature of the Platform</h2>
            </div>
            <p className="text-white/80 leading-relaxed">
              GameOn is a <span className="text-green-400 font-semibold">skill-based esports tournament platform</span>. The competitions hosted on this platform are strictly games of skill, where the outcome depends predominantly upon the superior knowledge, training, attention, experience, and adroitness of the participants.
            </p>
          </div>

          {/* 4. No Gambling or Games of Chance */}
          <div className="glass-card p-8 border-l-4 border-red-500/50">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">4. No Gambling or Games of Chance</h2>
            </div>
            <div className="space-y-4 text-white/80">
              <p className="font-semibold text-red-400 uppercase tracking-wider">Strict Prohibition Notice:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>There is <span className="font-bold text-white uppercase">NO gambling</span> permitted on this platform.</li>
                <li>There is <span className="font-bold text-white uppercase">NO betting</span> or wagering involved in any tournaments.</li>
                <li>There is <span className="font-bold text-white uppercase">NO wagering</span> allowed on the outcomes of any games.</li>
                <li>We do not host or promote any <span className="font-bold text-white uppercase">games of chance</span>.</li>
              </ul>
            </div>
          </div>

          {/* 5. Participation Fees */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">5. Participation Fees</h2>
            </div>
            <p className="text-white/80 leading-relaxed">
              Any payments collected from users on GameOn are strictly <span className="text-yellow-400 font-semibold">participation fees</span>. These fees are used for the organization, management, and maintenance of the tournaments and the platform. By paying the participation fee, users are only gaining entry into a competitive skill-based event.
            </p>
          </div>

          {/* 6. Compliance With Indian Laws */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                <Gavel className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">6. Compliance With Indian Laws</h2>
            </div>
            <p className="text-white/80 leading-relaxed">
              Vivek Badgujar (GameOn) operates in full compliance with all applicable <span className="text-blue-400 font-semibold">Indian laws</span>. In India, offering skill-based games is a legitimate business activity protected under Article 19(1)(g) of the Constitution of India, as recognized by various Hon'ble Courts, including the Supreme Court of India.
            </p>
          </div>

          {/* 7. User Responsibility */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">7. User Responsibility</h2>
            </div>
            <p className="text-white/80 leading-relaxed">
              Users are responsible for ensuring that their participation in skill-based tournaments is legal in their respective jurisdiction. Users from states where skill-based gaming with entry fees is restricted are prohibited from participating in such tournaments on GameOn.
            </p>
          </div>

          {/* 8. Contact Information */}
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mr-4">
                <Mail className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">8. Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/80">
              <div className="flex items-start p-4 bg-white/5 rounded-lg">
                <Mail className="w-5 h-5 text-cyan-400 mr-3 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-white/60">Email Support</p>
                  <p className="text-white">support@gameonesport.xyz</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-white/5 rounded-lg">
                <MapPin className="w-5 h-5 text-cyan-400 mr-3 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-white/60">Registered Address</p>
                  <p className="text-white">Ahmedabad, Gujarat, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* 9. Disclaimer */}
          <div className="glass-card p-8 bg-white/5">
            <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimer</h2>
            <p className="text-white/60 text-sm leading-relaxed italic">
              The information provided on this page is for general informational purposes only. While we strive to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or suitability with respect to the platform or the information contained on the platform for any purpose. Any reliance you place on such information is therefore strictly at your own risk.
            </p>
          </div>

        </div>

        {/* Footer Links */}
        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <Link href="/terms" className="text-white/40 hover:text-white transition-colors text-sm">Terms & Conditions</Link>
          <span className="text-white/20">•</span>
          <Link href="/privacy" className="text-white/40 hover:text-white transition-colors text-sm">Privacy Policy</Link>
          <span className="text-white/20">•</span>
          <Link href="/refund" className="text-white/40 hover:text-white transition-colors text-sm">Refund Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default LegalInformation;
