import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PremiumNotification } from './premium-notification';

interface LandingPageProps {
  onStartHosting: () => void;
  onStartScanning: () => void;
}

export function LandingPage({ onStartHosting, onStartScanning }: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [showPremiumNotification, setShowPremiumNotification] = useState(false);

  const features = [
    {
      icon: '🔒',
      title: 'Military-Grade Encryption',
      description: 'AES-256-GCM encryption ensures your data stays private and secure during transfer.',
      highlight: 'End-to-end encrypted'
    },
    {
      icon: '⚡',
      title: 'Instant Transfer',
      description: 'Direct peer-to-peer connection via WebRTC for lightning-fast file and text sharing.',
      highlight: 'Zero server storage'
    },
    {
      icon: '🚫',
      title: 'No Registration Required',
      description: 'Start sharing immediately without creating accounts or providing personal information.',
      highlight: 'Completely anonymous'
    },
    {
      icon: '🌐',
      title: 'Cross-Platform',
      description: 'Works on any device with a modern browser - mobile, tablet, desktop, any OS.',
      highlight: 'Universal compatibility'
    },
    {
      icon: '🎯',
      title: 'Simple QR Sharing',
      description: 'Just scan a QR code to instantly connect devices. No complex setup required.',
      highlight: 'One-scan connection'
    },
    {
      icon: '♻️',
      title: 'Ephemeral Sessions',
      description: 'Sessions expire automatically and no data is stored anywhere permanently.',
      highlight: 'Privacy by design'
    }
  ];

  const stats = [
    { number: '256-bit', label: 'Encryption Strength' },
    { number: '0ms', label: 'Server Delay' },
    { number: '100%', label: 'Free Forever' },
    { number: '∞', label: 'File Size Limit*' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              🎉 Launch Special - Everything FREE Forever!
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Share Files <span className="text-blue-600">Instantly</span>
              <br />
              <span className="text-indigo-600">Securely</span> & <span className="text-blue-600">Privately</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              The fastest way to share files and text between any devices. 
              <br className="hidden md:block" />
              <strong>Military-grade encryption</strong> • <strong>No registration</strong> • <strong>Completely free</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={onStartHosting}
                size="lg" 
                className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <i className="fas fa-share-alt mr-3"></i>
                Start Sharing Now
              </Button>
              
              <Button 
                onClick={onStartScanning}
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg font-semibold border-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <i className="fas fa-qrcode mr-3"></i>
                Scan QR Code
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-white/50">
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose InstantShare?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with privacy-first principles and modern technology for the ultimate sharing experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className={`p-6 border-2 transition-all duration-300 cursor-pointer ${
                  hoveredFeature === index 
                    ? 'border-blue-300 shadow-xl scale-105 bg-blue-50/50' 
                    : 'border-gray-200 hover:border-blue-200 hover:shadow-lg'
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardContent className="text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                  <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                    {feature.highlight}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to secure file sharing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Create Session',
                description: 'Click "Start Sharing" to create a secure session and generate a unique QR code.',
                icon: '🔗'
              },
              {
                step: '2', 
                title: 'Connect Devices',
                description: 'Scan the QR code with another device or share the session link directly.',
                icon: '📱'
              },
              {
                step: '3',
                title: 'Share Securely',
                description: 'Send files and messages with end-to-end encryption. No data touches our servers.',
                icon: '🚀'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Share Securely?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust InstantShare for their secure file sharing needs.
            <br />
            <strong>No registration required</strong> • <strong>Always free</strong> • <strong>Start in seconds</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={onStartHosting}
              size="lg" 
              variant="secondary"
              className="px-8 py-4 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <i className="fas fa-rocket mr-3"></i>
              Get Started Free
            </Button>
            
            <Button 
              onClick={() => setShowPremiumNotification(true)}
              size="lg" 
              variant="outline"
              className="px-8 py-4 text-lg font-semibold border-2 border-white/30 text-white hover:bg-white/10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <i className="fas fa-star mr-3"></i>
              Premium Coming Soon
            </Button>
          </div>

          <p className="text-sm opacity-75 mt-6">
            * File size limited by browser memory and connection speed
          </p>
        </div>
      </section>

      {/* Premium Notification Modal */}
      {showPremiumNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PremiumNotification onDismiss={() => setShowPremiumNotification(false)} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">InstantShare</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                The most secure and private way to share files and text between devices. 
                Built with modern web technologies and privacy-first principles.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="fab fa-github"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-300">
                <li>End-to-end encryption</li>
                <li>No registration</li>
                <li>Cross-platform</li>
                <li>Real-time sharing</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Security</h4>
              <ul className="space-y-2 text-gray-300">
                <li>AES-256 encryption</li>
                <li>WebRTC P2P</li>
                <li>No data storage</li>
                <li>Open source</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 InstantShare. All rights reserved. Made with ❤️ for privacy.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
