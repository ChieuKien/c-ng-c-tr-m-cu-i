import { TarotExperience, type TarotReadingResult } from '@/features/tarot3d';

// Trang /rut-bai — trải nghiệm rút bài Tarot 3D toàn màn hình.
export default function RutBai() {
  const handleReading = (result: TarotReadingResult) => {
    // Chỗ để lưu lịch sử (Supabase / Lovable Cloud), gửi analytics, hoặc chuyển sang trang đặt lịch.
    console.info('Trải bài xong', result.spread, result.draws.map((d) => d.card.id));
  };

  return (
    <TarotExperience
      brand={{
        name: 'Vinh Tarot',
        backText: 'VINH TAROT',
        bookingUrl: 'https://vinhtarot.com', // đổi thành link Messenger / Zalo đặt lịch
        bookingLabel: 'Đặt lịch xem chuyên sâu',
        homeHref: '/',
      }}
      onReading={handleReading}
    />
  );
}
