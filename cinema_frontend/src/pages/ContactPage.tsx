import { useState } from 'react';
import { MainLayout } from '../components/layouts';
import { Mail, Phone, MapPin, Clock, Send, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    alert('Thank you for contacting us! We will respond as soon as possible.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <MainLayout>
      <main className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-6xl px-4">
          {/* Hero Section */}
          <div className="py-16 md:py-24">
            <div className="p-4">
              <div
                className="flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-xl bg-cover bg-center bg-no-repeat p-4 md:gap-8"
                style={{
                  backgroundImage: 'linear-gradient(rgba(16, 24, 34, 0.7) 0%, rgba(16, 24, 34, 0.9) 100%), url("https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2070")'
                }}
              >
                <div className="flex flex-col gap-2 text-center">
                  <h1 className="text-white text-4xl font-black leading-tight tracking-tight md:text-5xl">
                    Contact Us
                  </h1>
                  <h2 className="text-white/80 text-base font-normal leading-normal md:text-lg">
                    We are always ready to support you. Please contact us for any inquiries
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="py-16">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Contact Information */}
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-white text-3xl font-bold mb-6">Contact Information</h2>
                  <p className="text-white/70 mb-8">
                    We are committed to bringing you the best movie experience.
                    Don't hesitate to contact us if you need support.
                  </p>
                </div>

                {/* Contact Cards */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
                    <MapPin className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-2">Address</h3>
                      <p className="text-white/70">
                        123 ABC Street, District 1<br />
                        Ho Chi Minh City, Vietnam
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
                    <Phone className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-2">Phone</h3>
                      <p className="text-white/70">
                        Hotline: 1900 XXX XXX<br />
                        Office: (028) XXX XXXX
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
                    <Mail className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-2">Email</h3>
                      <p className="text-white/70">
                        Support: support@cinephile.vn<br />
                        Business: business@cinephile.vn
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
                    <Clock className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-2">Business Hours</h3>
                      <p className="text-white/70">
                        Monday - Sunday: 8:00 AM - 10:00 PM<br />
                        Public holidays: 9:00 AM - 9:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-white text-xl font-semibold mb-4">Follow Us</h3>
                  <div className="flex gap-4">
                    <a
                      href="#"
                      className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Facebook className="w-5 h-5 text-blue-500" />
                    </a>
                    <a
                      href="#"
                      className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Instagram className="w-5 h-5 text-pink-500" />
                    </a>
                    <a
                      href="#"
                      className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Twitter className="w-5 h-5 text-blue-400" />
                    </a>
                    <a
                      href="#"
                      className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Youtube className="w-5 h-5 text-red-500" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-white text-3xl font-bold mb-6">Send Message</h2>
                  <p className="text-white/70 mb-8">
                    Have questions or need support? Leave your information and we will contact you as soon as possible.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-white text-sm font-medium mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                      <option value="" className="bg-gray-900">Select subject</option>
                      <option value="support" className="bg-gray-900">Technical Support</option>
                      <option value="booking" className="bg-gray-900">Ticket Booking</option>
                      <option value="refund" className="bg-gray-900">Refund</option>
                      <option value="partnership" className="bg-gray-900">Partnership</option>
                      <option value="other" className="bg-gray-900">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-white text-sm font-medium mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                      placeholder="Describe your issue in detail..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}