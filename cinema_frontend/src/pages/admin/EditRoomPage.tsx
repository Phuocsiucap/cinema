import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Loader2, Armchair, Check, Save } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { cinemaService } from '../../services';
import type { CinemaRoom, Seat } from '../../types/cinema';

// Seat types enum - thêm INACTIVE cho ghế hỏng/lối đi
type SeatTypeLocal = 'STANDARD' | 'VIP' | 'COUPLE' | 'INACTIVE';

// Seat interface
interface SeatConfig {
  row: string;
  number: number;
  type: SeatTypeLocal;
  isSelected: boolean;
  isActive: boolean;
}

// Seat type colors
const SEAT_COLORS: Record<SeatTypeLocal, string> = {
  STANDARD: 'bg-purple-600 hover:bg-purple-500',
  VIP: 'bg-amber-500 hover:bg-amber-400',
  COUPLE: 'bg-pink-500 hover:bg-pink-400',
  INACTIVE: 'bg-gray-700 hover:bg-gray-600 opacity-50',
};

const SEAT_LABELS: Record<SeatTypeLocal, string> = {
  STANDARD: 'Standard Seat',
  VIP: 'VIP Seat',
  COUPLE: 'Couple Seat',
  INACTIVE: 'Inactive',
};

// Generate row labels (A, B, C, ... Z)
const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function EditRoomPage() {
  const navigate = useNavigate();
  const { cinemaId, roomId } = useParams<{ cinemaId: string; roomId: string }>();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentSeatType, setCurrentSeatType] = useState<SeatTypeLocal>('STANDARD');
  
  // Room state
  const [roomName, setRoomName] = useState('');
  const [rows, setRows] = useState(10);
  const [seatsPerRow, setSeatsPerRow] = useState(12);
  const [seats, setSeats] = useState<SeatConfig[][]>([]);
  const [originalRoom, setOriginalRoom] = useState<CinemaRoom | null>(null);

  // Convert API seats to SeatConfig
  const convertApiSeatsToConfig = (apiSeats: Seat[]): SeatConfig[][] => {
    if (apiSeats.length === 0) return [];
    
    // Group seats by row
    const rowsMap = new Map<string, Seat[]>();
    apiSeats.forEach(seat => {
      if (!rowsMap.has(seat.row)) {
        rowsMap.set(seat.row, []);
      }
      rowsMap.get(seat.row)!.push(seat);
    });
    
    // Sort rows and seats
    const sortedRows = Array.from(rowsMap.keys()).sort();
    const seatGrid: SeatConfig[][] = [];
    
    sortedRows.forEach(rowLabel => {
      const rowSeats = rowsMap.get(rowLabel)!.sort((a, b) => a.number - b.number);
      const configRow: SeatConfig[] = rowSeats.map(seat => ({
        row: seat.row,
        number: seat.number,
        type: seat.is_active ? seat.seat_type as SeatTypeLocal : 'INACTIVE',
        isSelected: false,
        isActive: seat.is_active,
      }));
      seatGrid.push(configRow);
    });
    
    return seatGrid;
  };

  // Generate new seats for a room
  const generateSeats = (numRows: number, numSeatsPerRow: number): SeatConfig[][] => {
    const newSeats: SeatConfig[][] = [];
    for (let r = 0; r < numRows; r++) {
      const row: SeatConfig[] = [];
      const isLastRow = r === numRows - 1;
      for (let s = 1; s <= numSeatsPerRow; s++) {
        row.push({
          row: ROW_LABELS[r],
          number: s,
          type: isLastRow ? 'COUPLE' : 'STANDARD',
          isSelected: false,
          isActive: true,
        });
      }
      newSeats.push(row);
    }
    return newSeats;
  };

  // Fetch room data on mount
  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;
      
      try {
        setIsFetching(true);
        const data = await cinemaService.getRoom(roomId);
        setOriginalRoom(data);
        setRoomName(data.name);
        
        if (data.seats.length > 0) {
          const seatGrid = convertApiSeatsToConfig(data.seats);
          setSeats(seatGrid);
          setRows(seatGrid.length);
          setSeatsPerRow(seatGrid[0]?.length || 12);
        } else {
          setSeats(generateSeats(10, 12));
        }
      } catch (err) {
        console.error('Error fetching room:', err);
        setError('Cannot load room information');
      } finally {
        setIsFetching(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Toggle seat selection
  const toggleSeatSelection = (rowIndex: number, seatIndex: number) => {
    const newSeats = [...seats];
    newSeats[rowIndex][seatIndex].isSelected = !newSeats[rowIndex][seatIndex].isSelected;
    setSeats(newSeats);
  };

  // Apply seat type to selected seats
  const applyTypeToSelected = () => {
    const newSeats = seats.map(row =>
      row.map(seat => ({
        ...seat,
        type: seat.isSelected ? currentSeatType : seat.type,
        isSelected: false,
      }))
    );
    setSeats(newSeats);
  };

  // Select all seats in a row
  const selectRow = (rowIndex: number) => {
    const newSeats = [...seats];
    const allSelected = newSeats[rowIndex].every(s => s.isSelected);
    newSeats[rowIndex] = newSeats[rowIndex].map(seat => ({
      ...seat,
      isSelected: !allSelected,
    }));
    setSeats(newSeats);
  };

  // Update room dimensions (regenerate seats)
  const updateRoomDimensions = (newRows: number, newSeatsPerRow: number) => {
    setRows(newRows);
    setSeatsPerRow(newSeatsPerRow);
    setSeats(generateSeats(newRows, newSeatsPerRow));
  };

  // Count seats by type
  const getSeatCounts = () => {
    const counts = { STANDARD: 0, VIP: 0, COUPLE: 0, INACTIVE: 0, total: 0, active: 0 };
    seats.flat().forEach(seat => {
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
    if (!roomId) {
      setError('Room ID not found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for API
      const roomData = {
        name: roomName,
        seats: seats.flat().map(seat => ({
          row: seat.row,
          number: seat.number,
          seat_type: seat.type === 'INACTIVE' ? 'STANDARD' as const : seat.type,
          is_active: seat.type !== 'INACTIVE',
        })),
      };

      console.log('Room data:', roomData);
      
      // Call API to update room
      await cinemaService.updateRoom(roomId, roomData);
      
      setSuccess(true);
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        navigate(`/admin/cinemas/${cinemaId}/edit`);
      }, 2000);
    } catch (err) {
      console.error('Error updating room:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật phòng chiếu');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-pink-500 mx-auto mb-4" />
            <p className="text-gray-400">Đang tải thông tin phòng...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (success) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Cập nhật thành công!</h2>
            <p className="text-gray-400 mb-4">
              Room "{roomName}" has been updated
            </p>
            <p className="text-gray-500 text-sm">Đang chuyển hướng...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const counts = getSeatCounts();

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
          <span className="hover:text-white cursor-pointer" onClick={() => navigate(`/admin/cinemas/${cinemaId}/edit`)}>
            Edit Cinema
          </span>
          <ChevronRight size={16} />
          <span className="text-white">Edit Room</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-600/20 rounded-lg">
              <Armchair size={28} className="text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold text-white">Edit Screening Room</h1>
          </div>
          <p className="text-gray-400 ml-14">Cập nhật thông tin phòng: {originalRoom?.name}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Room Editor */}
        <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Armchair size={20} className="text-amber-500" />
            Cấu hình phòng
          </h2>

          {/* Room Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tên phòng
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
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
                value={rows}
                onChange={(e) => updateRoomDimensions(parseInt(e.target.value) || 1, seatsPerRow)}
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
                value={seatsPerRow}
                onChange={(e) => updateRoomDimensions(rows, parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
            </div>
          </div>

          {/* Seat Type Selector */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-[#0f0f1a] rounded-lg mb-6">
            <span className="text-sm text-gray-400">Chọn loại ghế:</span>
            {(Object.keys(SEAT_COLORS) as SeatTypeLocal[]).map((type) => (
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
          <div className="flex flex-wrap gap-4 text-sm mb-6">
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
              {seats.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-1.5">
                  {/* Row Label */}
                  <button
                    type="button"
                    onClick={() => selectRow(rowIndex)}
                    className="w-6 h-6 flex items-center justify-center text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title={`Chọn hàng ${ROW_LABELS[rowIndex]}`}
                  >
                    {ROW_LABELS[rowIndex]}
                  </button>
                  
                  {/* Seats */}
                  <div className="flex gap-1">
                    {row.map((seat, seatIndex) => {
                      const isCouple = seat.type === 'COUPLE';
                      const isOddSeat = seat.number % 2 === 1;
                      const coupleRounding = isCouple 
                        ? (isOddSeat ? 'rounded-l rounded-r-none' : 'rounded-r rounded-l-none')
                        : 'rounded';
                      const coupleSpacing = isCouple && !isOddSeat ? '-ml-1' : '';
                      
                      return (
                        <button
                          key={`${seat.row}${seat.number}`}
                          type="button"
                          onClick={() => toggleSeatSelection(rowIndex, seatIndex)}
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

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate(`/admin/cinemas/${cinemaId}/edit`)}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

export default EditRoomPage;
