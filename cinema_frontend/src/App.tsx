import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EmailVerification } from './components/EmailVerification';
import { HomePage, MovieDetailPage, LoginPage, RegisterPage, AuthCallbackPage, ForgotPasswordPage, ResetPasswordPage, MovieBookingPage, SeatSelectionPage, PaymentPage, MyTicketsPage, AboutPage, PoliciesPage, ContactPage, UploadTestPage } from './pages';
import { PromotionsPage } from './pages';
import { AdminDashboardPage, AddMoviePage, MoviesPage as AdminMoviesPage, EditMoviePage, AddCinemaPage, CinemasPage as AdminCinemasPage, AddRoomsPage, EditCinemaPage, EditRoomPage, UsersPage, EditUserPage, ShowtimesPage, ManageTicketsPage, PromotionsPage as AdminPromotionsPage, AddPromotionPage, EditPromotionPage, RevenuePage } from './pages/admin';
import { MoviesPage as PublicMoviesPage, CinemasPage as PublicCinemasPage } from './pages';
import { useEffect } from 'react';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/movies" element={<PublicMoviesPage />} />
            <Route path="/cinemas" element={<PublicCinemasPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/upload-test" element={<UploadTestPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/verify-email" element={<ProtectedRoute requireVerification={false}><EmailVerification /></ProtectedRoute>} />
            
            {/* Booking Routes - Require Login */}
            <Route path="/booking/:id" element={<ProtectedRoute><MovieBookingPage /></ProtectedRoute>} />
            <Route path="/booking/seats/:showtimeId" element={<ProtectedRoute><SeatSelectionPage /></ProtectedRoute>} />
            <Route path="/booking/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="/my-tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
            
            {/* Admin Routes - Require Admin Login (no email verification for admins) */}
            <Route path="/admin" element={<ProtectedRoute adminOnly requireVerification={false}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/movies" element={<ProtectedRoute adminOnly requireVerification={false}><AdminMoviesPage /></ProtectedRoute>} />
            <Route path="/admin/movies/add" element={<ProtectedRoute adminOnly requireVerification={false}><AddMoviePage /></ProtectedRoute>} />
            <Route path="/admin/movies/edit/:id" element={<ProtectedRoute adminOnly requireVerification={false}><EditMoviePage /></ProtectedRoute>} />
            <Route path="/admin/cinemas" element={<ProtectedRoute adminOnly requireVerification={false}><AdminCinemasPage /></ProtectedRoute>} />
            <Route path="/admin/cinemas/add" element={<ProtectedRoute adminOnly requireVerification={false}><AddCinemaPage /></ProtectedRoute>} />
            <Route path="/admin/cinemas/:cinemaId/edit" element={<ProtectedRoute adminOnly requireVerification={false}><EditCinemaPage /></ProtectedRoute>} />
            <Route path="/admin/cinemas/:cinemaId/rooms/add" element={<ProtectedRoute adminOnly requireVerification={false}><AddRoomsPage /></ProtectedRoute>} />
            <Route path="/admin/cinemas/:cinemaId/rooms/:roomId/edit" element={<ProtectedRoute adminOnly requireVerification={false}><EditRoomPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly requireVerification={false}><UsersPage /></ProtectedRoute>} />
            <Route path="/admin/users/edit/:id" element={<ProtectedRoute adminOnly requireVerification={false}><EditUserPage /></ProtectedRoute>} />
            <Route path="/admin/showtimes" element={<ProtectedRoute adminOnly requireVerification={false}><ShowtimesPage /></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute adminOnly requireVerification={false}><ManageTicketsPage /></ProtectedRoute>} />
            <Route path="/admin/promotions" element={<ProtectedRoute adminOnly requireVerification={false}><AdminPromotionsPage /></ProtectedRoute>} />
            <Route path="/admin/promotions/add" element={<ProtectedRoute adminOnly requireVerification={false}><AddPromotionPage /></ProtectedRoute>} />
            <Route path="/admin/promotions/edit/:id" element={<ProtectedRoute adminOnly requireVerification={false}><EditPromotionPage /></ProtectedRoute>} />
            <Route path="/admin/revenue" element={<ProtectedRoute adminOnly requireVerification={false}><RevenuePage /></ProtectedRoute>} />
          </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
