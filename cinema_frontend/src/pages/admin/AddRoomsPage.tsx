import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRight, Plus, Trash2, Loader2, Building2, Armchair, Check } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { cinemaService } from '../../services';

// Seat types enum - thêm INACTIVE cho ghế hỏng/lối đi
type SeatType = 'STANDARD' | 'VIP' | 'COUPLE' | 'INACTIVE';

// Seat interface
interface SeatConfig {
  row: string;
  number: number;
  type: SeatType;
  isSelected: boolean;
  isActive: boolean;
}

// Room interface
interface RoomConfig {
  id: string;
  name: string;
  rows: number;
  seatsPerRow: number;
  seats: SeatConfig[][];
}

// Seat type colors
const SEAT_COLORS: Record<SeatType, string> = {
  STANDARD: 'bg-purple-600 hover:bg-purple-500',
  VIP: 'bg-amber-500 hover:bg-amber-400',
  COUPLE: 'bg-pink-500 hover:bg-pink-400',
  INACTIVE: 'bg-gray-700 hover:bg-gray-600 opacity-50',
};

const SEAT_LABELS: Record<SeatType, string> = {
  STANDARD: 'Ghế thường',
  VIP: 'Ghế VIP',
  COUPLE: 'Ghế đôi',
  INACTIVE: 'Inactive',
};

// Generate row labels (A, B, C, ... Z)
const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function AddRoomsPage() {
  const navigate = useNavigate();
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const location = useLocation();
  const cinemaName = location.state?.cinemaName || 'New Cinema';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentSeatType, setCurrentSeatType] = useState<SeatType>('STANDARD');
  
  // Rooms state
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [activeRoomIndex, setActiveRoomIndex] = useState<number>(0);

  // Generate initial seats for a room
  // Hàng cuối cùng sẽ là ghế đôi (COUPLE)
  const generateSeats = (rows: number, seatsPerRow: number): SeatConfig[][] => {
    const seats: SeatConfig[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: SeatConfig[] = [];
      const isLastRow = r === rows - 1;
      for (let s = 1; s <= seatsPerRow; s++) {
        row.push({
          row: ROW_LABELS[r],
          number: s,
          type: isLastRow ? 'COUPLE' : 'STANDARD',
          isSelected: false,
          isActive: true,
        });
      }
      seats.push(row);
    }
    return seats;
  };

  // Add new room
  const addRoom = () => {
    const defaultRows = 10;
    const defaultSeatsPerRow = 12;
    const newRoom: RoomConfig = {
      id: `room-${Date.now()}`,
      name: `Phòng ${rooms.length + 1}`,
      rows: defaultRows,
      seatsPerRow: defaultSeatsPerRow,
      seats: generateSeats(defaultRows, defaultSeatsPerRow),
    };
    setRooms([...rooms, newRoom]);
    setActiveRoomIndex(rooms.length);
  };

  // Remove room
  const removeRoom = (index: number) => {
    const newRooms = rooms.filter((_, i) => i !== index);
    setRooms(newRooms);
    if (activeRoomIndex >= newRooms.length) {
      setActiveRoomIndex(Math.max(0, newRooms.length - 1));
    }
  };

  // Update room name
  const updateRoomName = (index: number, name: string) => {
    const newRooms = [...rooms];
    newRooms[index].name = name;
    setRooms(newRooms);
  };

  // Toggle seat selection
  const toggleSeatSelection = (roomIndex: number, rowIndex: number, seatIndex: number) => {
    const newRooms = [...rooms];
    newRooms[roomIndex].seats[rowIndex][seatIndex].isSelected = 
      !newRooms[roomIndex].seats[rowIndex][seatIndex].isSelected;
    setRooms(newRooms);
  };

  // Apply seat type to selected seats
  const applyTypeToSelected = () => {
    if (rooms.length === 0) return;
    
    const newRooms = [...rooms];
    newRooms[activeRoomIndex].seats = newRooms[activeRoomIndex].seats.map(row =>
      row.map(seat => ({
        ...seat,
        type: seat.isSelected ? currentSeatType : seat.type,
        isSelected: false,
      }))
    );
    setRooms(newRooms);
  };

  // Select all seats in a row
  const selectRow = (roomIndex: number, rowIndex: number) => {
    const newRooms = [...rooms];
    const allSelected = newRooms[roomIndex].seats[rowIndex].every(s => s.isSelected);
    newRooms[roomIndex].seats[rowIndex] = newRooms[roomIndex].seats[rowIndex].map(seat => ({
      ...seat,
      isSelected: !allSelected,
    }));
    setRooms(newRooms);
  };

  // Update room dimensions
  const updateRoomDimensions = (roomIndex: number, rows: number, seatsPerRow: number) => {
    const newRooms = [...rooms];
    newRooms[roomIndex].rows = rows;
    newRooms[roomIndex].seatsPerRow = seatsPerRow;
    newRooms[roomIndex].seats = generateSeats(rows, seatsPerRow);
    setRooms(newRooms);
  };

  // Count seats by type for current room
  const getSeatCounts = (roomIndex: number) => {
    if (rooms.length === 0 || roomIndex >= rooms.length) {
      return { STANDARD: 0, VIP: 0, COUPLE: 0, INACTIVE: 0, total: 0, active: 0 };
    }
    
    const counts = { STANDARD: 0, VIP: 0, COUPLE: 0, INACTIVE: 0, total: 0, active: 0 };
    rooms[roomIndex].seats.flat().forEach(seat => {
      counts[seat.type]++;
      counts.total++;
      if (seat.type !== 'INACTIVE') {
        counts.active++;
      }
    });
    return counts;
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!cinemaId) {
      setError('Cinema ID not found');
      return;
    }

    if (rooms.length === 0) {
      setError('Please add at least 1 screening room');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for API - theo format yêu cầu
      // INACTIVE seats sẽ được gửi với is_active: false và seat_type: STANDARD
      const roomsData = {
        cinema_id: cinemaId,
        rooms: rooms.map(room => ({
          name: room.name,
          seats: room.seats.flat().map(seat => ({
            row: seat.row,
            number: seat.number,
            seat_type: seat.type === 'INACTIVE' ? 'STANDARD' as const : seat.type,
            is_active: seat.type !== 'INACTIVE',
          })),
        })),
      };

      console.log('Rooms data:', roomsData);
      
      // Call API to add rooms
      await cinemaService.addRoomsToCinema(roomsData);
      
      setSuccess(true);
      
      // Navigate to cinemas list after 2 seconds
      setTimeout(() => {
        navigate('/admin/cinemas');
      }, 2000);
    } catch (err) {
      console.error('Error adding rooms:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while adding screening rooms');
    } finally {
      setIsLoading(false);
    }
  };

  // Skip adding rooms
  const handleSkip = () => {
    navigate('/admin/cinemas');
  };

  if (success) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Cinema created successfully!</h2>
            <p className="text-gray-400 mb-4">
              Cinema "{cinemaName}" has been created with {rooms.length} screening rooms
            </p>
            <p className="text-gray-500 text-sm">Đang chuyển hướng...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin')}>
            Dashboard
          </span>
          <ChevronRight size={16} />
          <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin/cinemas')}>
            Cinemas
          </span>
          <ChevronRight size={16} />
          <span className="text-white">Cấu hình phòng - {cinemaName}</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-600/20 rounded-lg">
              <Armchair size={28} className="text-pink-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Cấu hình phòng chiếu</h1>
              <p className="text-gray-400">Rạp: {cinemaName}</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
              <Check size={16} />
            </div>
            <span className="text-green-400 font-medium">Thông tin rạp</span>
          </div>
          <div className="flex-1 h-0.5 bg-pink-600" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <span className="text-white font-medium">Cấu hình phòng & ghế</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Rooms Section */}
        <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 size={20} className="text-pink-500" />
              Phòng chiếu & Sơ đồ ghế
            </h2>
            <button
              type="button"
              onClick={addRoom}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Add Room
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Armchair size={48} className="mx-auto mb-4 opacity-50" />
              <p className="mb-4">No screening rooms yet</p>
              <button
                type="button"
                onClick={addRoom}
                className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 rounded-lg transition-colors"
              >
                <Plus size={18} />
                Add first room
              </button>
            </div>
          ) : (
            <>
              {/* Room Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {rooms.map((room, index) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setActiveRoomIndex(index)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      activeRoomIndex === index
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {room.name}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRoom(index);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 size={14} />
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Room Editor */}
              {rooms[activeRoomIndex] && (
                <div className="space-y-6">
                  {/* Room Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tên phòng
                      </label>
                      <input
                        type="text"
                        value={rooms[activeRoomIndex].name}
                        onChange={(e) => updateRoomName(activeRoomIndex, e.target.value)}
                        className="w-full px-4 py-2 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Số hàng
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={26}
                        value={rooms[activeRoomIndex].rows}
                        onChange={(e) => updateRoomDimensions(
                          activeRoomIndex,
                          parseInt(e.target.value) || 1,
                          rooms[activeRoomIndex].seatsPerRow
                        )}
                        className="w-full px-4 py-2 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Số ghế mỗi hàng
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={rooms[activeRoomIndex].seatsPerRow}
                        onChange={(e) => updateRoomDimensions(
                          activeRoomIndex,
                          rooms[activeRoomIndex].rows,
                          parseInt(e.target.value) || 1
                        )}
                        className="w-full px-4 py-2 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                      />
                    </div>
                  </div>

                  {/* Seat Type Selector */}
                  <div className="flex flex-wrap items-center gap-4 p-4 bg-[#0f0f1a] rounded-lg">
                    <span className="text-sm text-gray-400">Chọn loại ghế:</span>
                    {(Object.keys(SEAT_COLORS) as SeatType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCurrentSeatType(type)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                          currentSeatType === type
                            ? 'border-white bg-white/10'
                            : 'border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded ${SEAT_COLORS[type].split(' ')[0]}`} />
                        <span className="text-sm text-white">{SEAT_LABELS[type]}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={applyTypeToSelected}
                      className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors ml-auto"
                    >
                      Apply to selected seats
                    </button>
                  </div>

                  {/* Seat Stats */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {(() => {
                      const counts = getSeatCounts(activeRoomIndex);
                      return (
                        <>
                          <span className="text-gray-400">
                            Tổng: <span className="text-white font-medium">{counts.total} ghế</span>
                          </span>
                          <span className="text-green-400">
                            Hoạt động: <span className="font-medium">{counts.active}</span>
                          </span>
                          <span className="text-purple-400">
                            Thường: <span className="font-medium">{counts.STANDARD}</span>
                          </span>
                          <span className="text-amber-400">
                            VIP: <span className="font-medium">{counts.VIP}</span>
                          </span>
                          <span className="text-pink-400">
                            Đôi: <span className="font-medium">{counts.COUPLE}</span>
                          </span>
                          {counts.INACTIVE > 0 && (
                            <span className="text-gray-500">
                              Inactive: <span className="font-medium">{counts.INACTIVE}</span>
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Seat Layout */}
                  <div className="bg-[#0f0f1a] rounded-xl p-6 overflow-x-auto">
                    {/* Screen */}
                    <div className="flex justify-center mb-8">
                      <div className="relative w-full max-w-2xl">
                        <div className="w-full h-2 bg-gradient-to-r from-transparent via-gray-500 to-transparent rounded-b-full" />
                        <p className="text-center text-gray-500 text-xs mt-2 uppercase tracking-widest">Màn hình</p>
                      </div>
                    </div>

                    {/* Seats Grid */}
                    <div className="flex flex-col items-center gap-1.5">
                      {rooms[activeRoomIndex].seats.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex items-center gap-1.5">
                          {/* Row Label */}
                          <button
                            type="button"
                            onClick={() => selectRow(activeRoomIndex, rowIndex)}
                            className="w-6 h-6 flex items-center justify-center text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                            title={`Chọn hàng ${ROW_LABELS[rowIndex]}`}
                          >
                            {ROW_LABELS[rowIndex]}
                          </button>
                          
                          {/* Seats */}
                          <div className="flex gap-1">
                            {row.map((seat, seatIndex) => {
                              // Ghế đôi: ghế lẻ (1,3,5...) bo tròn trái, ghế chẵn (2,4,6...) bo tròn phải
                              const isCouple = seat.type === 'COUPLE';
                              const isOddSeat = seat.number % 2 === 1;
                              const coupleRounding = isCouple 
                                ? (isOddSeat ? 'rounded-l rounded-r-none' : 'rounded-r rounded-l-none')
                                : 'rounded';
                              // Không có gap giữa 2 ghế đôi (ghế chẵn không có margin-left)
                              const coupleSpacing = isCouple && !isOddSeat ? '-ml-1' : '';
                              
                              return (
                                <button
                                  key={`${seat.row}${seat.number}`}
                                  type="button"
                                  onClick={() => toggleSeatSelection(activeRoomIndex, rowIndex, seatIndex)}
                                  className={`
                                    w-7 h-7 ${coupleRounding} text-[10px] font-medium transition-all relative
                                    ${SEAT_COLORS[seat.type]}
                                    ${seat.isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0f0f1a] scale-110 z-10' : ''}
                                    ${coupleSpacing}
                                  `}
                                  title={`${seat.row}${seat.number} - ${SEAT_LABELS[seat.type]}`}
                                >
                                  {seat.type === 'INACTIVE' ? (
                                    <span className="text-gray-400 line-through">{seat.number}</span>
                                  ) : (
                                    seat.number
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Row Label (right) */}
                          <span className="w-6 text-center text-xs text-gray-400">
                            {ROW_LABELS[rowIndex]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Seat Legend */}
                    <div className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-purple-600" />
                        <span className="text-xs text-gray-400">Ghế thường</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-amber-500" />
                        <span className="text-xs text-gray-400">Ghế VIP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-pink-500" />
                        <span className="text-xs text-gray-400">Ghế đôi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-gray-700 opacity-50" />
                        <span className="text-xs text-gray-400">Inactive</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded ring-2 ring-white bg-purple-600" />
                        <span className="text-xs text-gray-400">Đang chọn</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleSkip}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Skip, add room later
          </button>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/cinemas/add')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || rooms.length === 0}
              className="flex items-center gap-2 px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Hoàn tất
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AddRoomsPage;
