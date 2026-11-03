import { ChildGender, ChildMilestone, MilestoneCategory } from '../models';

export interface WHOStandardPoint {
  month: number;
  boyHeight: number;
  boyWeight: number;
  girlHeight: number;
  girlWeight: number;
}

// WHO Child Growth Standards Median (P50) from birth to 5 years (60 months)
export const WHO_GROWTH_STANDARDS: WHOStandardPoint[] = [
  { month: 0, boyHeight: 49.9, boyWeight: 3.3, girlHeight: 49.1, girlWeight: 3.2 },
  { month: 1, boyHeight: 54.7, boyWeight: 4.5, girlHeight: 53.7, girlWeight: 4.2 },
  { month: 2, boyHeight: 58.4, boyWeight: 5.6, girlHeight: 57.1, girlWeight: 5.1 },
  { month: 3, boyHeight: 61.4, boyWeight: 6.4, girlHeight: 59.8, girlWeight: 5.8 },
  { month: 4, boyHeight: 63.9, boyWeight: 7.0, girlHeight: 62.1, girlWeight: 6.4 },
  { month: 5, boyHeight: 65.9, boyWeight: 7.5, girlHeight: 64.0, girlWeight: 6.9 },
  { month: 6, boyHeight: 67.6, boyWeight: 7.9, girlHeight: 65.7, girlWeight: 7.3 },
  { month: 7, boyHeight: 69.2, boyWeight: 8.3, girlHeight: 67.3, girlWeight: 7.6 },
  { month: 8, boyHeight: 70.6, boyWeight: 8.6, girlHeight: 68.7, girlWeight: 7.9 },
  { month: 9, boyHeight: 72.0, boyWeight: 8.9, girlHeight: 70.1, girlWeight: 8.2 },
  { month: 10, boyHeight: 73.3, boyWeight: 9.2, girlHeight: 71.5, girlWeight: 8.5 },
  { month: 11, boyHeight: 74.5, boyWeight: 9.4, girlHeight: 72.8, girlWeight: 8.7 },
  { month: 12, boyHeight: 75.7, boyWeight: 9.6, girlHeight: 74.0, girlWeight: 8.9 },
  { month: 15, boyHeight: 79.1, boyWeight: 10.3, girlHeight: 77.5, girlWeight: 9.6 },
  { month: 18, boyHeight: 82.3, boyWeight: 10.9, girlHeight: 80.7, girlWeight: 10.2 },
  { month: 21, boyHeight: 85.1, boyWeight: 11.5, girlHeight: 83.7, girlWeight: 10.9 },
  { month: 24, boyHeight: 87.8, boyWeight: 12.2, girlHeight: 86.4, girlWeight: 11.5 },
  { month: 30, boyHeight: 92.4, boyWeight: 13.3, girlHeight: 91.2, girlWeight: 12.7 },
  { month: 36, boyHeight: 96.1, boyWeight: 14.3, girlHeight: 95.1, girlWeight: 13.9 },
  { month: 42, boyHeight: 99.9, boyWeight: 15.3, girlHeight: 99.0, girlWeight: 15.0 },
  { month: 48, boyHeight: 103.3, boyWeight: 16.3, girlHeight: 102.7, girlWeight: 16.1 },
  { month: 54, boyHeight: 106.7, boyWeight: 17.3, girlHeight: 106.2, girlWeight: 17.2 },
  { month: 60, boyHeight: 110.0, boyWeight: 18.3, girlHeight: 109.4, girlWeight: 18.2 },
  { month: 72, boyHeight: 116.0, boyWeight: 20.5, girlHeight: 115.5, girlWeight: 20.2 },
  { month: 84, boyHeight: 121.7, boyWeight: 22.9, girlHeight: 121.1, girlWeight: 22.4 },
  { month: 96, boyHeight: 127.3, boyWeight: 25.6, girlHeight: 126.6, girlWeight: 25.0 },
  { month: 108, boyHeight: 132.6, boyWeight: 28.6, girlHeight: 132.5, girlWeight: 28.2 },
  { month: 120, boyHeight: 137.8, boyWeight: 31.9, girlHeight: 138.6, girlWeight: 31.9 }
];

/**
 * Get WHO standard median height & weight for gender and age in months (interpolated).
 */
export function getWHOStandard(gender: ChildGender, ageMonths: number): { height: number; weight: number } {
  const m = Math.max(0, ageMonths);
  const data = WHO_GROWTH_STANDARDS;

  if (m <= data[0].month) {
    return {
      height: gender === 'BOY' ? data[0].boyHeight : data[0].girlHeight,
      weight: gender === 'BOY' ? data[0].boyWeight : data[0].girlWeight
    };
  }

  const last = data[data.length - 1];
  if (m >= last.month) {
    return {
      height: gender === 'BOY' ? last.boyHeight : last.girlHeight,
      weight: gender === 'BOY' ? last.boyWeight : last.girlWeight
    };
  }

  // Linear interpolation
  for (let i = 0; i < data.length - 1; i++) {
    const p1 = data[i];
    const p2 = data[i + 1];
    if (m >= p1.month && m <= p2.month) {
      const ratio = (m - p1.month) / (p2.month - p1.month);
      const h1 = gender === 'BOY' ? p1.boyHeight : p1.girlHeight;
      const h2 = gender === 'BOY' ? p2.boyHeight : p2.girlHeight;
      const w1 = gender === 'BOY' ? p1.boyWeight : p1.girlWeight;
      const w2 = gender === 'BOY' ? p2.boyWeight : p2.girlWeight;
      return {
        height: Math.round((h1 + (h2 - h1) * ratio) * 10) / 10,
        weight: Math.round((w1 + (w2 - w1) * ratio) * 10) / 10
      };
    }
  }

  return { height: 0, weight: 0 };
}

/**
 * Calculate age details from birth date to target date.
 */
export function calculateChildAge(birthDateStr: string, atDateStr?: string): {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  label: string;
} {
  const birth = new Date(birthDateStr);
  const target = atDateStr ? new Date(atDateStr) : new Date();

  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonthDays = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const safeYears = Math.max(0, years);
  const safeMonths = Math.max(0, months);
  const safeDays = Math.max(0, days);
  const totalMonths = Math.max(0, safeYears * 12 + safeMonths + Math.round((safeDays / 30) * 10) / 10);

  let label = '';
  if (safeYears === 0 && safeMonths === 0) {
    label = `${safeDays} ngày tuổi`;
  } else if (safeYears === 0) {
    label = `${safeMonths} tháng ${safeDays > 0 ? safeDays + ' ngày' : ''}`.trim() + ' tuổi';
  } else {
    label = `${safeYears} tuổi ${safeMonths > 0 ? safeMonths + ' tháng' : ''}`.trim();
  }

  return {
    years: safeYears,
    months: safeMonths,
    days: safeDays,
    totalMonths,
    label
  };
}

/**
 * Calculate BMI and nutritional status classification.
 */
export function calculateChildBMI(weightKg: number, heightCm: number): {
  bmi: number;
  label: string;
  badgeClass: string;
} {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return { bmi: 0, label: 'Chưa đủ dữ liệu', badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
  }
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  if (bmi < 14) {
    return {
      bmi,
      label: 'Nhẹ cân',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    };
  } else if (bmi <= 17.5) {
    return {
      bmi,
      label: 'Chuẩn phát triển',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    };
  } else if (bmi <= 19) {
    return {
      bmi,
      label: 'Nguy cơ thừa cân',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
  } else {
    return {
      bmi,
      label: 'Thừa cân',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
    };
  }
}

/**
 * Milestone category labels and icons.
 */
export const MILESTONE_CATEGORIES: {
  key: MilestoneCategory;
  name: string;
  icon: string;
  color: string;
}[] = [
  { key: 'MOTOR', name: 'Vận động', icon: '🏃‍♂️', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  { key: 'LANGUAGE', name: 'Ngôn ngữ', icon: '🗣️', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  { key: 'COGNITIVE', name: 'Nhận thức', icon: '🧠', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  { key: 'SOCIAL', name: 'Cảm xúc & Xã hội', icon: '🤝', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
  { key: 'OTHER', name: 'Khác', icon: '⭐', color: 'text-gray-600 bg-gray-50 dark:bg-gray-700/20' }
];

/**
 * Standard WHO and developmental milestones template for children 0-5 years.
 */
export const STANDARD_MILESTONES_TEMPLATE: {
  category: MilestoneCategory;
  title: string;
  description: string;
  target_age_months: number;
}[] = [
  // 0 - 3 months
  { category: 'MOTOR', title: 'Ngẩng đầu khi nằm sấp', description: 'Bé ngẩng đầu được 45-90 độ khi đặt nằm sấp', target_age_months: 2 },
  { category: 'LANGUAGE', title: 'Phát âm ê a, hóng chuyện', description: 'Bé đáp lại lời trò chuyện bằng âm giọng nhỏ nhẹ', target_age_months: 2 },
  { category: 'SOCIAL', title: 'Nụ cười xã giao đầu tiên', description: 'Bé mỉm cười có chủ đích khi nhìn thấy mặt bố mẹ', target_age_months: 2 },

  // 4 - 6 months
  { category: 'MOTOR', title: 'Biết lật / lẫy vững vàng', description: 'Tự lật từ ngửa sang sấp và sấp sang ngửa', target_age_months: 5 },
  { category: 'COGNITIVE', title: 'Với và cầm nắm đồ chơi', description: 'Chủ động đưa tay với lấy đồ vật trong tầm nhìn', target_age_months: 5 },
  { category: 'LANGUAGE', title: 'Bập bẹ âm đơn ba, ma, da', description: 'Bắt đầu phát âm các phụ âm ghép đơn giản', target_age_months: 6 },

  // 7 - 9 months
  { category: 'MOTOR', title: 'Tự ngồi vững không cần đỡ', description: 'Ngồi thẳng lưng chơi đồ chơi bằng hai tay', target_age_months: 7 },
  { category: 'MOTOR', title: 'Bò hoặc trườn tiến lên phía trước', description: 'Phối hợp tay chân để di chuyển khắp phòng', target_age_months: 8 },
  { category: 'COGNITIVE', title: 'Tìm đồ vật bị che khuất (Ú òa)', description: 'Hiểu tính tồn tại của đồ vật khi bị giấu', target_age_months: 8 },
  { category: 'SOCIAL', title: 'Phân biệt người quen và người lạ', description: 'Biểu hiện bẽn lẽn hoặc e ngại trước người lạ', target_age_months: 8 },

  // 10 - 12 months
  { category: 'MOTOR', title: 'Tự đứng vịn thành giường/bàn', description: 'Đứng vững vàng khi có điểm tựa', target_age_months: 10 },
  { category: 'LANGUAGE', title: 'Nói từ đơn đầu tiên (ba, mẹ...)', description: 'Nói từ đầu tiên có ý nghĩa rõ ràng', target_age_months: 11 },
  { category: 'SOCIAL', title: 'Vẫy tay chào tạm biệt & vỗ tay', description: 'Biết vẫy tay "bye bye" hoặc vỗ tay theo bài hát', target_age_months: 11 },

  // 12 - 18 months
  { category: 'MOTOR', title: 'Tự đi độc lập những bước đầu tiên', description: 'Thả tay tự bước đi không cần ai dắt', target_age_months: 13 },
  { category: 'COGNITIVE', title: 'Chỉ tay vào bộ phận cơ thể hoặc đồ vật', description: 'Chỉ đúng mắt, mũi, miệng hoặc quả bóng khi được hỏi', target_age_months: 15 },
  { category: 'MOTOR', title: 'Tự cầm cốc uống nước hoặc thìa xúc', description: 'Kỹ năng vận động tinh tự phục vụ bản thân', target_age_months: 16 },
  { category: 'LANGUAGE', title: 'Vốn từ 10-20 từ đơn', description: 'Gọi tên được các đồ vật quen thuộc hàng ngày', target_age_months: 18 },

  // 19 - 24 months (2 years)
  { category: 'MOTOR', title: 'Chạy nhanh & leo trèo bậc thang', description: 'Vận động thể chất linh hoạt, thích khám phá', target_age_months: 20 },
  { category: 'LANGUAGE', title: 'Ghép câu 2 - 3 từ có nghĩa', description: 'Nói câu ngắn như "mẹ bế con", "uống nước đi"', target_age_months: 22 },
  { category: 'COGNITIVE', title: 'Bắt chước hành động người lớn', description: 'Giả vờ quét nhà, nấu ăn, gọi điện thoại', target_age_months: 24 },

  // 3 - 5 years
  { category: 'MOTOR', title: 'Nhảy bật bằng hai chân & đi xe 3 bánh', description: 'Điều khiển cơ thể thăng bằng và nhịp nhàng', target_age_months: 36 },
  { category: 'LANGUAGE', title: 'Nói câu dài & hay hỏi "Tại sao?"', description: 'Giao tiếp lưu loát, kể lại những việc diễn ra trong ngày', target_age_months: 36 },
  { category: 'SOCIAL', title: 'Tự mặc quần áo & đi giày đơn giản', description: 'Tính tự lập trong sinh hoạt cá nhân', target_age_months: 42 }
];

export function getDefaultMilestones(childId: string, familyId: string): Omit<ChildMilestone, 'id' | 'created_at' | 'updated_at'>[] {
  return STANDARD_MILESTONES_TEMPLATE.map(t => ({
    child_id: childId,
    family_id: familyId,
    category: t.category,
    title: t.title,
    description: t.description,
    target_age_months: t.target_age_months,
    achieved: false,
    achieved_date: null,
    note: null
  }));
}
