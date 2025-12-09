import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layouts';
import { Shield, FileText, Lock, Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function PoliciesPage() {
  return (
    <MainLayout>
      <main className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-4xl px-4">
          {/* Hero Section */}
          <div className="py-16 md:py-24">
            <div className="p-4">
              <div
                className="flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-xl bg-cover bg-center bg-no-repeat p-4 md:gap-8"
                style={{
                  backgroundImage: 'linear-gradient(rgba(16, 24, 34, 0.7) 0%, rgba(16, 24, 34, 0.9) 100%), url("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070")'
                }}
              >
                <div className="flex flex-col gap-2 text-center">
                  <h1 className="text-white text-4xl font-black leading-tight tracking-tight md:text-5xl">
                    Policies & Terms
                  </h1>
                  <h2 className="text-white/80 text-base font-normal leading-normal md:text-lg">
                    Learn about our policies and terms of service
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="py-16">
            <div className="flex flex-col gap-12">
              {/* Navigation Cards */}
              <div className="grid gap-6 md:grid-cols-2">
                <Link
                  to="#terms"
                  className="group flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-red-500" />
                    <h3 className="text-white text-xl font-bold">Terms of Service</h3>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Terms and conditions for using our ticket booking service
                  </p>
                </Link>

                <Link
                  to="#privacy"
                  className="group flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-red-500" />
                    <h3 className="text-white text-xl font-bold">Privacy Policy</h3>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    How we collect, use and protect your personal information
                  </p>
                </Link>
              </div>

              {/* Terms of Service */}
              <section id="terms" className="scroll-mt-24">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-red-500" />
                    <h2 className="text-white text-3xl font-bold">Terms of Service</h2>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                    <div className="prose prose-invert max-w-none">
                      <h3 className="text-white text-xl font-semibold mb-4">1. Acceptance of Terms</h3>
                      <p className="text-white/70 mb-6">
                        By accessing and using Cinephile services, you agree to comply with the terms and conditions outlined in this document.
                      </p>

                      <h3 className="text-white text-xl font-semibold mb-4">2. Ticket Booking Service</h3>
                      <p className="text-white/70 mb-6">
                        We provide online movie ticket booking services. Users can book tickets for showtimes at our partner cinemas.
                      </p>

                      <h3 className="text-white text-xl font-semibold mb-4">3. Booking Process</h3>
                      <ul className="text-white/70 mb-6 list-disc list-inside space-y-2">
                        <li>Select movie and showtime</li>
                        <li>Choose seats</li>
                        <li>Make online payment</li>
                        <li>Receive e-tickets via email/SMS</li>
                      </ul>

                      <h3 className="text-white text-xl font-semibold mb-4">4. Rights and Responsibilities</h3>
                      <p className="text-white/70 mb-6">
                        Users have the right to access services and receive proper service according to regulations. We are committed to providing high-quality services.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Privacy Policy */}
              <section id="privacy" className="scroll-mt-24">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <Lock className="w-8 h-8 text-red-500" />
                    <h2 className="text-white text-3xl font-bold">Privacy Policy</h2>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                    <div className="prose prose-invert max-w-none">
                      <h3 className="text-white text-xl font-semibold mb-4">1. Information Collection</h3>
                      <p className="text-white/70 mb-6">
                        We collect personal information including name, email, and phone number when you register an account or book tickets.
                      </p>

                      <h3 className="text-white text-xl font-semibold mb-4">2. Information Usage</h3>
                      <ul className="text-white/70 mb-6 list-disc list-inside space-y-2">
                        <li>Process ticket bookings</li>
                        <li>Send movie and promotional information</li>
                        <li>Improve our services</li>
                        <li>Comply with legal requirements</li>
                      </ul>

                      <h3 className="text-white text-xl font-semibold mb-4">3. Information Security</h3>
                      <p className="text-white/70 mb-6">
                        We use advanced security measures to protect your personal information from unauthorized access.
                      </p>

                      <h3 className="text-white text-xl font-semibold mb-4">4. Information Sharing</h3>
                      <p className="text-white/70 mb-6">
                        We do not sell, exchange personal information to third parties, except when required by law.
                      </p>

                      <h3 className="text-white text-xl font-semibold mb-4">5. User Rights</h3>
                      <p className="text-white/70 mb-6">
                        You have the right to access, modify or delete your personal information at any time.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Info */}
              <section className="rounded-xl border border-white/10 bg-white/5 p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-red-500" />
                    <h2 className="text-white text-3xl font-bold">Support Contact</h2>
                  </div>

                  <p className="text-white/70">
                    If you have questions about our policies or need support, please contact us:
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-red-500" />
                      <span className="text-white/70">support@cinephile.vn</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-red-500" />
                      <span className="text-white/70">1900 XXX XXX</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-red-500" />
                      <span className="text-white/70">8:00 AM - 10:00 PM daily</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-red-500" />
                      <span className="text-white/70">Ho Chi Minh City, Vietnam</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}