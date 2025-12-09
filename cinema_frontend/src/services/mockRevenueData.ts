// Mock data for Revenue Management
export const mockRevenueData = {
  stats: {
    total_revenue: 125000000, // 125M VND
    tickets_sold: 25000,
    avg_ticket_price: 50000, // 50k VND
    revenue_change: 15.5,
    tickets_change: 12.3,
    price_change: 2.8
  },
  trends: [
    { label: '2025-01', amount: 85000000 },
    { label: '2025-02', amount: 92000000 },
    { label: '2025-03', amount: 98000000 },
    { label: '2025-04', amount: 105000000 },
    { label: '2025-05', amount: 118000000 },
    { label: '2025-06', amount: 125000000 }
  ],
  top_movies: [
    {
      id: 'movie1',
      title: 'Avengers: Endgame',
      revenue: 45000000,
      tickets_sold: 9000,
      poster_url: 'https://example.com/poster1.jpg',
      percentage: 100
    },
    {
      id: 'movie2',
      title: 'Spider-Man: No Way Home',
      revenue: 38000000,
      tickets_sold: 7600,
      poster_url: 'https://example.com/poster2.jpg',
      percentage: 84
    },
    {
      id: 'movie3',
      title: 'Black Panther: Wakanda Forever',
      revenue: 32000000,
      tickets_sold: 6400,
      poster_url: 'https://example.com/poster3.jpg',
      percentage: 71
    }
  ]
  // Không có entity_details vì đây là view tổng quan
};

// Mock data cho các filter khác nhau
export const mockCinemaData = {
  stats: {
    total_revenue: 45000000,
    tickets_sold: 9000,
    avg_ticket_price: 50000,
    revenue_change: 8.2,
    tickets_change: 6.1,
    price_change: 1.9
  },
  trends: [
    { label: 'Week 1', amount: 8500000 },
    { label: 'Week 2', amount: 9200000 },
    { label: 'Week 3', amount: 9800000 },
    { label: 'Week 4', amount: 10500000 },
    { label: 'Week 5', amount: 11800000 }
  ],
  top_movies: [
    {
      id: 'movie1',
      title: 'Avengers: Endgame',
      revenue: 18000000,
      tickets_sold: 3600,
      poster_url: 'https://example.com/poster1.jpg',
      percentage: 100
    },
    {
      id: 'movie2',
      title: 'Spider-Man: No Way Home',
      revenue: 15200000,
      tickets_sold: 3040,
      poster_url: 'https://example.com/poster2.jpg',
      percentage: 84
    }
  ],
  comparison_data: [
    {
      id: 'cinema1',
      name: 'CGV Vincom Center',
      location: 'Hanoi, Vietnam',
      revenue: 45000000,
      tickets_sold: 9000,
      shows: 120,
      occupancy: 85,
      percentage: 100
    },
    {
      id: 'cinema2',
      name: 'CGV Times City',
      location: 'Hanoi, Vietnam',
      revenue: 38000000,
      tickets_sold: 7600,
      shows: 95,
      occupancy: 78,
      percentage: 84
    },
    {
      id: 'cinema3',
      name: 'CGV Royal City',
      location: 'Hanoi, Vietnam',
      revenue: 32000000,
      tickets_sold: 6400,
      shows: 80,
      occupancy: 72,
      percentage: 71
    }
  ]
};

export const mockMovieData = {
  stats: {
    total_revenue: 45000000,
    tickets_sold: 9000,
    avg_ticket_price: 50000,
    revenue_change: 18.7,
    tickets_change: 15.8,
    price_change: 2.5
  },
  trends: [
    { label: '2025-04-01', amount: 1200000 },
    { label: '2025-04-02', amount: 1350000 },
    { label: '2025-04-03', amount: 1180000 },
    { label: '2025-04-04', amount: 1420000 },
    { label: '2025-04-05', amount: 1580000 },
    { label: '2025-04-06', amount: 1650000 },
    { label: '2025-04-07', amount: 1120000 }
  ],
  top_movies: [
    {
      id: 'movie1',
      title: 'Avengers: Endgame',
      revenue: 45000000,
      tickets_sold: 9000,
      poster_url: 'https://example.com/poster1.jpg',
      percentage: 100
    }
  ],
  comparison_data: [
    {
      id: 'movie1',
      title: 'Avengers: Endgame',
      genre: 'Action',
      revenue: 45000000,
      tickets_sold: 9000,
      shows: 120,
      occupancy: 85,
      percentage: 100,
      poster_url: 'https://example.com/poster1.jpg'
    },
    {
      id: 'movie2',
      title: 'Spider-Man: No Way Home',
      genre: 'Action',
      revenue: 38000000,
      tickets_sold: 7600,
      shows: 95,
      occupancy: 78,
      percentage: 84,
      poster_url: 'https://example.com/poster2.jpg'
    },
    {
      id: 'movie3',
      title: 'Black Panther: Wakanda Forever',
      genre: 'Action',
      revenue: 32000000,
      tickets_sold: 6400,
      shows: 80,
      occupancy: 72,
      percentage: 71,
      poster_url: 'https://example.com/poster3.jpg'
    }
  ]
};