import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layouts';
import { Rocket, Eye, Heart, Film, Armchair, UtensilsCrossed, Ticket, Flag, Wrench, Facebook, Github, Mail } from 'lucide-react';

export default function AboutPage() {
  return (
    <MainLayout>
      <main className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-4xl px-4">
          {/* Hero Section */}
          <div className="py-16 md:py-24">
            <div className="p-4">
              <div 
                className="flex min-h-[480px] flex-col items-center justify-center gap-6 rounded-xl bg-cover bg-center bg-no-repeat p-4 md:gap-8"
                style={{
                  backgroundImage: 'linear-gradient(rgba(16, 24, 34, 0.7) 0%, rgba(16, 24, 34, 0.9) 100%), url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070")'
                }}
              >
                <div className="flex flex-col gap-2 text-center">
                  <h1 className="text-white text-4xl font-black leading-tight tracking-tight md:text-5xl">
                    About Cinephile
                  </h1>
                  <h2 className="text-white/80 text-base font-normal leading-normal md:text-lg">
                    Experience cinema like never before. Discover our story and what makes us the ultimate destination for movie lovers.
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Section - Main Focus */}
          <div className="py-16">
            <div className="flex flex-col gap-8 text-center">
              <h1 className="text-white tracking-tight text-3xl font-bold leading-tight md:text-4xl">
                Developer
              </h1>
              
              {/* Developer Card */}
              <div className="flex flex-col items-center gap-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8 md:p-12">
                {/* Avatar with gold border */}
                <div className="relative">
                  <div className="w-40 h-40 md:w-52 md:h-52 rounded-full p-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/30">
                    <img
                      src="https://res.cloudinary.com/dawxdwbjk/image/upload/v1757871265/chat/7be07d90-e172-4594-a31e-7243f853efe0/b26393f6-9c94-4d7f-ad07-8405841d351f.jpg"
                      alt="Developer"
                      className="w-full h-full rounded-full object-cover border-4 border-gray-900"
                    />
                  </div>
                  {/* Decorative ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-400/30 animate-pulse" style={{ margin: '-8px' }}></div>
                </div>

                {/* Developer Info */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-white text-2xl md:text-3xl font-bold">Nguyễn Minh Phước</h2>
                    <p className="text-yellow-400 text-lg font-medium mt-1">Full-Stack Developer</p>
                  </div>
                  
                  <p className="text-white/70 text-base leading-relaxed max-w-2xl mx-auto">
                    Đam mê xây dựng các ứng dụng web hiện đại với trải nghiệm người dùng tuyệt vời. 
                    Chuyên môn về Java Springboot, Node.js, Python và các công nghệ cloud. 
                    Luôn tìm kiếm những giải pháp sáng tạo để giải quyết các vấn đề phức tạp.
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {['React', 'TypeScript', 'Node.js', 'Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Socket.IO', 'TailwindCSS'].map((skill) => (
                      <span 
                        key={skill}
                        className="px-3 py-1 text-sm font-medium text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Social Links */}
                  <div className="flex justify-center gap-4 mt-6">
                    <a
                      href="https://www.facebook.com/phuoc.nguyen.351071"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Facebook size={20} />
                      <span className="text-sm font-medium">Facebook</span>
                    </a>
                    <a
                      href="https://github.com/Phuocsiucap"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <Github size={20} />
                      <span className="text-sm font-medium">GitHub</span>
                    </a>
                    <a
                      href="mailto:nguyenvanphuoc09112004@gmail.com"
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Mail size={20} />
                      <span className="text-sm font-medium">Email</span>
                    </a>
                  </div>
                </div>

                {/* Project Info */}
                <div className="w-full border-t border-white/10 pt-8 mt-4">
                  <h3 className="text-white text-xl font-bold mb-4">Về Dự Án Cinephile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-yellow-400 font-bold text-2xl">5+</p>
                      <p className="text-white/60 text-sm">Microservices</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-yellow-400 font-bold text-2xl">Real-time</p>
                      <p className="text-white/60 text-sm">Socket.IO Integration</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-yellow-400 font-bold text-2xl">100%</p>
                      <p className="text-white/60 text-sm">Responsive Design</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Section */}
          <div className="flex flex-col gap-10 py-10">
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-white tracking-tight text-3xl font-bold leading-tight md:text-4xl">
                Our Commitment
              </h1>
              <p className="text-white/70 text-base font-normal leading-normal max-w-3xl mx-auto">
                We are committed to delivering the best cinema experience, combining advanced technology with a passion for film.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-1 flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6 text-center items-center">
                <div className="text-red-500 text-4xl">
                  <Rocket size={40} />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-white text-lg font-bold leading-tight">Mission</h2>
                  <p className="text-white/60 text-sm font-normal leading-normal">
                    Create memorable movie moments with excellent quality, service and ambiance.
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6 text-center items-center">
                <div className="text-red-500 text-4xl">
                  <Eye size={40} />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-white text-lg font-bold leading-tight">Vision</h2>
                  <p className="text-white/60 text-sm font-normal leading-normal">
                    Become a pioneer in the film industry, continuously enhancing the big screen experience.
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6 text-center items-center">
                <div className="text-red-500 text-4xl">
                  <Heart size={40} />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-white text-lg font-bold leading-tight">Values</h2>
                  <p className="text-white/60 text-sm font-normal leading-normal">
                    Passion for film, commitment to quality and community focus are at the core of everything we do.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="py-10">
            <h2 className="text-white text-2xl font-bold leading-tight tracking-tight px-4 pb-5 pt-5 text-center">
              Development Journey
            </h2>
            <div className="grid grid-cols-[40px_1fr] gap-x-2 px-4">
              <div className="flex flex-col items-center gap-1 pt-3">
                <div className="text-red-500 text-2xl"><Flag size={24} /></div>
                <div className="w-[2px] bg-white/20 h-full"></div>
              </div>
              <div className="flex flex-1 flex-col pb-8 pt-2">
                <p className="text-white/60 text-sm font-normal leading-normal">2024</p>
                <p className="text-white text-lg font-medium leading-normal">Project initiation</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-[2px] bg-white/20 h-full"></div>
              </div>
              <div className="flex flex-1 flex-col pb-8">
                <p className="text-white/60 text-sm font-normal leading-normal">2024</p>
                <p className="text-white text-lg font-medium leading-normal">Development of realtime booking system</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-[2px] bg-white/20 h-full"></div>
              </div>
              <div className="flex flex-1 flex-col pb-8">
                <p className="text-white/60 text-sm font-normal leading-normal">2024</p>
                <p className="text-white text-lg font-medium leading-normal">Payment integration</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-[2px] bg-white/20 h-2 grow"></div>
                <div className="text-red-500 text-2xl"><Wrench size={24} /></div>
              </div>
              <div className="flex flex-1 flex-col pt-1">
                <p className="text-white/60 text-sm font-normal leading-normal">2025</p>
                <p className="text-white text-lg font-medium leading-normal">Official version launch</p>
              </div>
            </div>
          </div>

          {/* What We Offer Section */}
          <div className="flex flex-col gap-10 py-16">
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-white tracking-tight text-3xl font-bold leading-tight md:text-4xl">
                Exceptional Cinema Experience
              </h1>
              <p className="text-white/70 text-base font-normal leading-normal max-w-3xl mx-auto">
                Chúng tôi cung cấp nhiều dịch vụ được thiết kế để làm cho trải nghiệm xem phim của bạn trở nên đặc biệt.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-3 rounded-lg bg-white/5 p-4 text-center">
                <div className="text-red-500 text-3xl"><Film size={32} /></div>
                <p className="text-white text-sm font-medium">Phim Mới Nhất</p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-lg bg-white/5 p-4 text-center">
                <div className="text-red-500 text-3xl"><Armchair size={32} /></div>
                <p className="text-white text-sm font-medium">Premium Seats</p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-lg bg-white/5 p-4 text-center">
                <div className="text-red-500 text-3xl"><UtensilsCrossed size={32} /></div>
                <p className="text-white text-sm font-medium">Delicious Food</p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-lg bg-white/5 p-4 text-center">
                <div className="text-red-500 text-3xl"><Ticket size={32} /></div>
                <p className="text-white text-sm font-medium">Easy Booking</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-6 rounded-xl bg-red-500/10 p-10">
              <h2 className="text-white text-3xl font-bold">Ready for an Amazing Experience?</h2>
              <p className="text-white/70 max-w-xl">
                Come to Cinephile and immerse yourself in the magical world of cinema. Discover the latest blockbusters, classic films and much more.
              </p>
              <Link 
                to="/"
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-red-600 text-white text-base font-bold leading-normal tracking-wide transition-colors hover:bg-red-700"
              >
                <span>Explore Movies Now</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}
