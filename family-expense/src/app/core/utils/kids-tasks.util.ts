import { TaskCategory, KidsTask, RewardItem } from '../models';

export const DEFAULT_TASK_CATEGORIES: Omit<TaskCategory, 'id' | 'created_at' | 'updated_at'>[] = [
  { family_id: null, name: 'Việc nhà', icon: '🧹', color: '#10B981', is_default: true },
  { family_id: null, name: 'Học tập', icon: '📚', color: '#3B82F6', is_default: true },
  { family_id: null, name: 'Tự lập', icon: '🛏️', color: '#8B5CF6', is_default: true },
  { family_id: null, name: 'Rèn luyện', icon: '🏃', color: '#F59E0B', is_default: true },
  { family_id: null, name: 'Hành vi tốt', icon: '⭐', color: '#EC4899', is_default: true }
];

export const DEFAULT_SAMPLE_TASKS: Omit<KidsTask, 'id' | 'family_id' | 'created_at' | 'updated_at'>[] = [
  {
    title: 'Gấp chăn màn sau khi thức dậy',
    description: 'Tự giác gấp chăn gối gọn gàng mỗi sáng',
    points: 10,
    schedule_type: 'DAILY',
    is_active: true
  },
  {
    title: 'Đánh răng sáng và tối đúng giờ',
    description: 'Chải răng sạch sẽ ít nhất 2 phút mỗi lần',
    points: 10,
    schedule_type: 'DAILY',
    is_active: true
  },
  {
    title: 'Tự dọn dẹp đồ chơi sau khi chơi',
    description: 'Cất đồ chơi vào đúng hộp/kệ quy định',
    points: 15,
    schedule_type: 'DAILY',
    is_active: true
  },
  {
    title: 'Đọc sách hoặc truyện 20 phút',
    description: 'Đọc sách bổ ích và kể lại cho bố mẹ nghe',
    points: 20,
    schedule_type: 'DAILY',
    is_active: true
  },
  {
    title: 'Hoàn thành bài tập về nhà',
    description: 'Làm hết bài tập cô giáo giao trước 20h',
    points: 25,
    schedule_type: 'DAILY',
    is_active: true
  },
  {
    title: 'Phụ bố mẹ dọn bàn ăn & dọn bát',
    description: 'Bê thức ăn, lấy đũa thìa và lau bàn sau ăn',
    points: 15,
    schedule_type: 'DAILY',
    is_active: true
  },
  {
    title: 'Tập thể dục hoặc vận động 20 phút',
    description: 'Đi bộ, nhảy dây, đá bóng hoặc đạp xe',
    points: 15,
    schedule_type: 'DAILY',
    is_active: true
  }
];

export const DEFAULT_SAMPLE_REWARDS: Omit<RewardItem, 'id' | 'family_id' | 'created_at' | 'updated_at'>[] = [
  {
    title: '30 phút xem TV / chơi game',
    description: 'Xem hoạt hình hoặc chơi game yêu thích vào cuối tuần',
    icon: '🎮',
    points_cost: 40,
    is_active: true
  },
  {
    title: 'Đi ăn kem / trà sữa cùng gia đình',
    description: 'Tự chọn vị kem yêu thích nhất',
    icon: '🍦',
    points_cost: 50,
    is_active: true
  },
  {
    title: 'Được chọn món ăn tối cho cả nhà',
    description: 'Bố mẹ sẽ nấu hoặc dẫn đi ăn món con chọn',
    icon: '🍕',
    points_cost: 70,
    is_active: true
  },
  {
    title: 'Đi chơi công viên / khu vui chơi',
    description: 'Chuyến đi chơi vui nhộn vào thứ 7 hoặc chủ nhật',
    icon: '🎡',
    points_cost: 150,
    is_active: true
  },
  {
    title: 'Món đồ chơi hoặc bộ truyện yêu thích',
    description: 'Bố mẹ thưởng món quà con hằng mong ước',
    icon: '🎁',
    points_cost: 250,
    is_active: true
  }
];

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  requiredCondition: string;
}

export const ACHIEVEMENTS_LIST: BadgeDefinition[] = [
  {
    key: 'FIRST_TASK',
    name: 'Bước khởi đầu',
    description: 'Hoàn thành nhiệm vụ đầu tiên',
    icon: '🌟',
    requiredCondition: '1 nhiệm vụ hoàn thành'
  },
  {
    key: 'TASK_5',
    name: 'Bé ngoan chăm chỉ',
    description: 'Hoàn thành 5 nhiệm vụ',
    icon: '🔥',
    requiredCondition: '5 nhiệm vụ hoàn thành'
  },
  {
    key: 'TASK_20',
    name: 'Siêu chiến binh',
    description: 'Hoàn thành 20 nhiệm vụ',
    icon: '⚡',
    requiredCondition: '20 nhiệm vụ hoàn thành'
  },
  {
    key: 'TASK_50',
    name: 'Thần đồng việc nhà',
    description: 'Hoàn thành 50 nhiệm vụ',
    icon: '👑',
    requiredCondition: '50 nhiệm vụ hoàn thành'
  },
  {
    key: 'POINTS_100',
    name: 'Chú heo đất',
    description: 'Tích lũy được tổng cộng 100 điểm thưởng',
    icon: '💰',
    requiredCondition: '100 điểm kiếm được'
  },
  {
    key: 'POINTS_300',
    name: 'Triệu phú nhí',
    description: 'Tích lũy được tổng cộng 300 điểm thưởng',
    icon: '🏆',
    requiredCondition: '300 điểm kiếm được'
  },
  {
    key: 'FIRST_REWARD',
    name: 'Đổi quà đầu tiên',
    description: 'Đổi thành công món quà đầu tiên từ điểm thưởng',
    icon: '🎁',
    requiredCondition: '1 lần đổi quà'
  }
];

export function calculateChildLevel(totalEarned: number): { level: number; title: string; nextLevelPoints: number; progressPercent: number } {
  if (totalEarned < 50) {
    return {
      level: 1,
      title: '🌱 Mầm non chăm chỉ',
      nextLevelPoints: 50,
      progressPercent: Math.round((totalEarned / 50) * 100)
    };
  } else if (totalEarned < 150) {
    return {
      level: 2,
      title: '⭐ Bé ngoan xuất sắc',
      nextLevelPoints: 150,
      progressPercent: Math.round(((totalEarned - 50) / 100) * 100)
    };
  } else if (totalEarned < 300) {
    return {
      level: 3,
      title: '🚀 Siêu sao chăm chỉ',
      nextLevelPoints: 300,
      progressPercent: Math.round(((totalEarned - 150) / 150) * 100)
    };
  } else if (totalEarned < 500) {
    return {
      level: 4,
      title: '🛡️ Hiệp sĩ nhỏ',
      nextLevelPoints: 500,
      progressPercent: Math.round(((totalEarned - 300) / 200) * 100)
    };
  } else {
    return {
      level: 5,
      title: '👑 Nhà vô địch gia đình',
      nextLevelPoints: 500,
      progressPercent: 100
    };
  }
}

const DAY_MAP = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function isTaskScheduledForDate(task: KidsTask, date: Date): boolean {
  if (!task.is_active) return false;

  const currentDayCode = DAY_MAP[date.getDay()];
  const dateStr = date.toISOString().split('T')[0];

  switch (task.schedule_type) {
    case 'DAILY':
      return true;
    case 'WEEKLY':
      // Weekly default on Sunday or Saturday, or matching due_date
      return task.schedule_days && task.schedule_days.length > 0
        ? task.schedule_days.includes(currentDayCode)
        : currentDayCode === 'SUN' || currentDayCode === 'SAT';
    case 'CUSTOM_DAYS':
      return !!task.schedule_days && task.schedule_days.includes(currentDayCode);
    case 'ONCE':
      return !task.due_date || task.due_date === dateStr || task.due_date >= dateStr;
    default:
      return true;
  }
}

export const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  DAILY: 'Hàng ngày',
  WEEKLY: 'Hàng tuần',
  CUSTOM_DAYS: 'Các ngày tùy chọn',
  ONCE: 'Một lần'
};

export const DAY_LABELS: Record<string, string> = {
  MON: 'T2',
  TUE: 'T3',
  WED: 'T4',
  THU: 'T5',
  FRI: 'T6',
  SAT: 'T7',
  SUN: 'CN'
};
