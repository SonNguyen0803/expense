import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FamilyRepository } from '../../core/services/family.repository';
import { ChildRepository } from '../../core/services/child.repository';
import { AuthService } from '../../core/auth/auth.service';
import { KidsTaskRepository } from '../../core/services/kids-task.repository';
import {
  Child,
  KidsTask,
  TaskCategory,
  TaskSubmission,
  RewardItem,
  RewardRedemption,
  PointTransaction,
  TaskScheduleType
} from '../../core/models';
import {
  ACHIEVEMENTS_LIST,
  calculateChildLevel,
  isTaskScheduledForDate,
  SCHEDULE_TYPE_LABELS,
  DAY_LABELS
} from '../../core/utils/kids-tasks.util';
import { formatDateDDMMYYYY } from '../../core/utils/date.util';

type ActiveTab = 'TASKS' | 'APPROVALS' | 'REWARDS' | 'POINTS' | 'RANKING' | 'CATEGORIES';
type TaskViewMode = 'TODAY' | 'ALL';

@Component({
  selector: 'app-kids-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './kids-tasks.component.html'
})
export class KidsTasksComponent implements OnInit {
  // Properties initialized in constructor
  currentFamily;
  currentUser;
  children;
  selectedChild;
  categories;
  tasks;
  submissions;
  rewards;
  redemptions;
  pointTransactions;
  achievements;
  pendingSubmissions;
  pendingRedemptions;

  // Active state signals
  activeTab = signal<ActiveTab>('TASKS');
  taskViewMode = signal<TaskViewMode>('TODAY');
  filterCategory = signal<string>('ALL');

  // Modals state
  showTaskModal = signal<boolean>(false);
  editingTaskId = signal<string | null>(null);

  showRewardModal = signal<boolean>(false);
  editingRewardId = signal<string | null>(null);

  showAdjustPointsModal = signal<boolean>(false);
  showCategoryModal = signal<boolean>(false);
  showSubmitNoteModal = signal<boolean>(false);
  submittingTask = signal<KidsTask | null>(null);
  taskSubmitNote = signal<string>('');

  showApprovalModal = signal<boolean>(false);
  reviewingSubmission = signal<TaskSubmission | null>(null);
  approvalFeedback = signal<string>('');

  // Forms
  taskForm: FormGroup;
  rewardForm: FormGroup;
  adjustPointsForm: FormGroup;
  categoryForm: FormGroup;

  // Constants
  achievementsList = ACHIEVEMENTS_LIST;
  scheduleLabels = SCHEDULE_TYPE_LABELS;
  dayLabels = DAY_LABELS;
  dayKeys = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  constructor(
    public taskRepo: KidsTaskRepository,
    public childRepo: ChildRepository,
    private familyRepo: FamilyRepository,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    // Initialize properties in constructor to follow project convention
    this.currentFamily = this.familyRepo.selectedFamily;
    this.currentUser = this.authService.user;
    this.children = this.childRepo.children;
    this.selectedChild = this.childRepo.selectedChild;

    this.categories = this.taskRepo.categories;
    this.tasks = this.taskRepo.tasks;
    this.submissions = this.taskRepo.submissions;
    this.rewards = this.taskRepo.rewards;
    this.redemptions = this.taskRepo.redemptions;
    this.pointTransactions = this.taskRepo.pointTransactions;
    this.achievements = this.taskRepo.achievements;
    this.pendingSubmissions = this.taskRepo.pendingSubmissions;
    this.pendingRedemptions = this.taskRepo.pendingRedemptions;

    // Task Form
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category_id: [''],
      child_id: [''], // empty = all children
      points: [10, [Validators.required, Validators.min(1), Validators.max(500)]],
      schedule_type: ['DAILY', Validators.required],
      schedule_days: [[]],
      due_date: [''],
      is_active: [true]
    });

    // Reward Form
    this.rewardForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      icon: ['🎁', Validators.required],
      points_cost: [50, [Validators.required, Validators.min(1), Validators.max(2000)]],
      is_active: [true]
    });

    // Adjust Points Form
    this.adjustPointsForm = this.fb.group({
      child_id: ['', Validators.required],
      type: ['BONUS', Validators.required],
      amount: [20, [Validators.required, Validators.min(1)]],
      description: ['', [Validators.required, Validators.minLength(3)]]
    });

    // Category Form
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      icon: ['📝', Validators.required],
      color: ['#3B82F6', Validators.required]
    });

    // Reactively reload all tasks & children when family changes
    effect(() => {
      const family = this.currentFamily();
      if (family?.id) {
        this.childRepo.loadChildren(family.id);
        this.taskRepo.loadAll(family.id);
      }
    });
  }

  async ngOnInit() {
    let family = this.currentFamily();
    if (!family) {
      const families = await this.familyRepo.loadFamilies();
      family = families && families.length > 0 ? families[0] : null;
    }
    if (family) {
      await this.childRepo.loadChildren(family.id);
      await this.taskRepo.loadAll(family.id);
    }
  }

  // ==========================================
  // Computed State
  // ==========================================

  // Active child points summary
  activeChildPoints = computed(() => {
    const child = this.selectedChild();
    if (!child) return { balance: 0, earned: 0, spent: 0 };
    return this.taskRepo.getChildPoints(child.id);
  });

  // Active child level
  activeChildLevel = computed(() => {
    const pts = this.activeChildPoints();
    return calculateChildLevel(pts.earned);
  });

  // Active child badges
  activeChildBadges = computed(() => {
    const child = this.selectedChild();
    if (!child) return [];
    const myAchievements = new Set(
      this.achievements()
        .filter(a => a.child_id === child.id)
        .map(a => a.badge_key)
    );
    return this.achievementsList.map(b => ({
      ...b,
      unlocked: myAchievements.has(b.key)
    }));
  });

  // Leaderboard of all kids in family
  leaderboard = computed(() => {
    const kids = this.children();
    // Dependency on pointTransactions and submissions signals
    this.pointTransactions();
    this.submissions();
    return this.taskRepo.getChildLeaderboard(kids);
  });

  // Filtered Tasks for the current view
  filteredTasks = computed(() => {
    const allTasks = this.tasks();
    const child = this.selectedChild();
    const cat = this.filterCategory();
    const mode = this.taskViewMode();
    const today = new Date();

    return allTasks.filter(task => {
      // Filter by child assignment: task for this child or for all kids
      if (child && task.child_id && task.child_id !== child.id) {
        return false;
      }
      // Filter by category
      if (cat !== 'ALL' && task.category_id !== cat) {
        return false;
      }
      // Filter by today's schedule
      if (mode === 'TODAY' && !isTaskScheduledForDate(task, today)) {
        return false;
      }
      return true;
    });
  });

  // Active child completed tasks for today
  completedTasksTodayIds = computed(() => {
    const child = this.selectedChild();
    if (!child) return new Set<string>();
    const todayStr = new Date().toISOString().split('T')[0];
    const done = this.submissions().filter(
      s => s.child_id === child.id && s.submission_date === todayStr && s.status !== 'REJECTED'
    );
    return new Set(done.map(s => s.task_id));
  });

  // Filtered Point Transactions for selected child (or all kids)
  filteredTransactions = computed(() => {
    const child = this.selectedChild();
    const allTxs = this.pointTransactions();
    if (!child) return allTxs;
    return allTxs.filter(t => t.child_id === child.id);
  });

  // ==========================================
  // Actions: Child Switcher
  // ==========================================
  selectChild(child: Child | null) {
    this.childRepo.selectChild(child);
  }

  // ==========================================
  // Actions: Tasks
  // ==========================================
  openAddTaskModal() {
    this.editingTaskId.set(null);
    const defaultCat = this.categories()[0]?.id || '';
    const child = this.selectedChild();
    this.taskForm.reset({
      title: '',
      description: '',
      category_id: defaultCat,
      child_id: child ? child.id : '',
      points: 15,
      schedule_type: 'DAILY',
      schedule_days: [],
      due_date: '',
      is_active: true
    });
    this.showTaskModal.set(true);
  }

  openEditTaskModal(task: KidsTask) {
    this.editingTaskId.set(task.id);
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      category_id: task.category_id || '',
      child_id: task.child_id || '',
      points: task.points,
      schedule_type: task.schedule_type,
      schedule_days: task.schedule_days || [],
      due_date: task.due_date || '',
      is_active: task.is_active
    });
    this.showTaskModal.set(true);
  }

  closeTaskModal() {
    this.showTaskModal.set(false);
    this.editingTaskId.set(null);
  }

  toggleDayInSchedule(dayCode: string) {
    const currentDays: string[] = this.taskForm.get('schedule_days')?.value || [];
    const index = currentDays.indexOf(dayCode);
    if (index >= 0) {
      currentDays.splice(index, 1);
    } else {
      currentDays.push(dayCode);
    }
    this.taskForm.patchValue({ schedule_days: [...currentDays] });
  }

  isDaySelected(dayCode: string): boolean {
    const currentDays: string[] = this.taskForm.get('schedule_days')?.value || [];
    return currentDays.includes(dayCode);
  }

  async saveTask() {
    if (this.taskForm.invalid) return;

    const family = this.currentFamily();
    const user = this.currentUser();
    if (!family) return;

    const formVal = this.taskForm.value;
    const editingId = this.editingTaskId();

    try {
      if (editingId) {
        await this.taskRepo.updateTask(
          editingId,
          {
            title: formVal.title,
            description: formVal.description || null,
            category_id: formVal.category_id || null,
            child_id: formVal.child_id || null,
            points: Number(formVal.points),
            schedule_type: formVal.schedule_type,
            schedule_days: formVal.schedule_days,
            due_date: formVal.due_date || null,
            is_active: formVal.is_active
          },
          family.id
        );
      } else {
        await this.taskRepo.createTask({
          family_id: family.id,
          child_id: formVal.child_id || null,
          category_id: formVal.category_id || null,
          title: formVal.title,
          description: formVal.description || null,
          points: Number(formVal.points),
          schedule_type: formVal.schedule_type as TaskScheduleType,
          schedule_days: formVal.schedule_days,
          due_date: formVal.due_date || null,
          is_active: formVal.is_active,
          created_by: user?.id || null
        });
      }
      this.closeTaskModal();
    } catch (e) {
      alert('Đã xảy ra lỗi khi lưu nhiệm vụ');
    }
  }

  async deleteTask(task: KidsTask) {
    const family = this.currentFamily();
    if (!family) return;

    const confirmed = confirm(`Bạn có chắc muốn xóa nhiệm vụ "${task.title}"?`);
    if (!confirmed) return;

    try {
      await this.taskRepo.deleteTask(task.id, family.id);
    } catch (e) {
      alert('Đã xảy ra lỗi khi xóa nhiệm vụ');
    }
  }

  // ==========================================
  // Actions: Task Submission & Approval
  // ==========================================
  openSubmitTaskModal(task: KidsTask) {
    const child = this.selectedChild();
    if (!child) {
      alert('Vui lòng chọn bé trước khi nộp nhiệm vụ');
      return;
    }
    this.submittingTask.set(task);
    this.taskSubmitNote.set('');
    this.showSubmitNoteModal.set(true);
  }

  closeSubmitTaskModal() {
    this.showSubmitNoteModal.set(false);
    this.submittingTask.set(null);
  }

  async confirmSubmitTask() {
    const task = this.submittingTask();
    const child = this.selectedChild();
    if (!task || !child) return;

    try {
      await this.taskRepo.submitTask(task, child, this.taskSubmitNote());
      this.closeSubmitTaskModal();
      alert(`Đã gửi hoàn thành nhiệm vụ "${task.title}". Chờ bố mẹ duyệt để nhận ${task.points} điểm thưởng nhé! ⭐`);
    } catch (e) {
      alert('Đã xảy ra lỗi khi nộp nhiệm vụ');
    }
  }

  async quickApproveDirectly(task: KidsTask) {
    const child = this.selectedChild();
    if (!child) {
      alert('Vui lòng chọn bé trước');
      return;
    }
    const user = this.currentUser();
    try {
      await this.taskRepo.quickCompleteTask(task, child, user?.id);
      alert(`Tuyệt vời! Đã duyệt hoàn thành và cộng ${task.points} điểm cho bé ${child.name}! ⭐`);
    } catch (e) {
      alert('Đã xảy ra lỗi');
    }
  }

  openApprovalModal(submission: TaskSubmission) {
    this.reviewingSubmission.set(submission);
    this.approvalFeedback.set('Làm tốt lắm con! Bố mẹ rất tự hào về con.');
    this.showApprovalModal.set(true);
  }

  closeApprovalModal() {
    this.showApprovalModal.set(false);
    this.reviewingSubmission.set(null);
  }

  async approveSubmission() {
    const sub = this.reviewingSubmission();
    const user = this.currentUser();
    if (!sub) return;

    try {
      await this.taskRepo.approveTask(sub, user?.id, this.approvalFeedback());
      this.closeApprovalModal();
      alert(`Đã duyệt thành công! Bé đã nhận được +${sub.points_awarded} điểm! 🎉`);
    } catch (e) {
      alert('Đã xảy ra lỗi khi duyệt nhiệm vụ');
    }
  }

  async rejectSubmission() {
    const sub = this.reviewingSubmission();
    const user = this.currentUser();
    if (!sub) return;

    try {
      await this.taskRepo.rejectTask(sub, user?.id, this.approvalFeedback());
      this.closeApprovalModal();
    } catch (e) {
      alert('Đã xảy ra lỗi');
    }
  }

  // ==========================================
  // Actions: Reward Store
  // ==========================================
  openAddRewardModal() {
    this.editingRewardId.set(null);
    this.rewardForm.reset({
      title: '',
      description: '',
      icon: '🎁',
      points_cost: 50,
      is_active: true
    });
    this.showRewardModal.set(true);
  }

  openEditRewardModal(reward: RewardItem) {
    this.editingRewardId.set(reward.id);
    this.rewardForm.patchValue({
      title: reward.title,
      description: reward.description || '',
      icon: reward.icon,
      points_cost: reward.points_cost,
      is_active: reward.is_active
    });
    this.showRewardModal.set(true);
  }

  closeRewardModal() {
    this.showRewardModal.set(false);
    this.editingRewardId.set(null);
  }

  async saveReward() {
    if (this.rewardForm.invalid) return;

    const family = this.currentFamily();
    if (!family) return;

    const formVal = this.rewardForm.value;
    const editingId = this.editingRewardId();

    try {
      if (editingId) {
        await this.taskRepo.updateReward(
          editingId,
          {
            title: formVal.title,
            description: formVal.description || null,
            icon: formVal.icon,
            points_cost: Number(formVal.points_cost),
            is_active: formVal.is_active
          },
          family.id
        );
      } else {
        await this.taskRepo.createReward({
          family_id: family.id,
          title: formVal.title,
          description: formVal.description || null,
          icon: formVal.icon,
          points_cost: Number(formVal.points_cost),
          is_active: formVal.is_active
        });
      }
      this.closeRewardModal();
    } catch (e) {
      alert('Đã xảy ra lỗi khi lưu phần thưởng');
    }
  }

  async deleteReward(reward: RewardItem) {
    const family = this.currentFamily();
    if (!family) return;

    const confirmed = confirm(`Bạn có chắc muốn xóa phần thưởng "${reward.title}"?`);
    if (!confirmed) return;

    try {
      await this.taskRepo.deleteReward(reward.id, family.id);
    } catch (e) {
      alert('Đã xảy ra lỗi');
    }
  }

  async redeemReward(reward: RewardItem) {
    const child = this.selectedChild();
    if (!child) {
      alert('Vui lòng chọn bé trước khi đổi quà');
      return;
    }

    const pts = this.activeChildPoints();
    if (pts.balance < reward.points_cost) {
      alert(`Bé chưa đủ điểm! Cần ${reward.points_cost} điểm nhưng bé hiện có ${pts.balance} điểm. Hãy hoàn thành thêm nhiệm vụ nhé! 💪`);
      return;
    }

    const confirmed = confirm(`Bé có muốn đổi ${reward.points_cost} điểm để nhận "${reward.title}" không?`);
    if (!confirmed) return;

    try {
      await this.taskRepo.redeemReward(reward, child);
      alert(`Đã gửi yêu cầu đổi quà "${reward.title}" thành công! Bố mẹ sẽ duyệt và trao quà cho con nhé! 🎁`);
    } catch (e: any) {
      alert(e.message || 'Đã xảy ra lỗi khi đổi quà');
    }
  }

  async approveRedemption(redemption: RewardRedemption) {
    const user = this.currentUser();
    try {
      await this.taskRepo.approveRedemption(redemption, user?.id);
      alert('Đã duyệt yêu cầu đổi quà thành công và trừ điểm của bé!');
    } catch (e) {
      alert('Đã xảy ra lỗi');
    }
  }

  async fulfillRedemption(redemption: RewardRedemption) {
    const family = this.currentFamily();
    if (!family) return;
    try {
      await this.taskRepo.fulfillRedemption(redemption.id, family.id);
    } catch (e) {
      alert('Đã xảy ra lỗi');
    }
  }

  async rejectRedemption(redemption: RewardRedemption) {
    const family = this.currentFamily();
    if (!family) return;
    try {
      await this.taskRepo.rejectRedemption(redemption.id, family.id);
    } catch (e) {
      alert('Đã xảy ra lỗi');
    }
  }

  // ==========================================
  // Actions: Manual Points Adjustment
  // ==========================================
  openAdjustPointsModal(defaultType: 'BONUS' | 'PENALTY' = 'BONUS') {
    const child = this.selectedChild();
    this.adjustPointsForm.reset({
      child_id: child ? child.id : (this.children()[0]?.id || ''),
      type: defaultType,
      amount: 20,
      description: defaultType === 'BONUS' ? 'Thưởng nóng vì ngoan ngoãn, tự giác' : 'Trừ điểm vì chưa nghe lời'
    });
    this.showAdjustPointsModal.set(true);
  }

  closeAdjustPointsModal() {
    this.showAdjustPointsModal.set(false);
  }

  async saveAdjustPoints() {
    if (this.adjustPointsForm.invalid) return;

    const family = this.currentFamily();
    if (!family) return;

    const formVal = this.adjustPointsForm.value;
    try {
      await this.taskRepo.adjustPoints(
        formVal.child_id,
        family.id,
        Number(formVal.amount),
        formVal.type,
        formVal.description
      );
      this.closeAdjustPointsModal();
      alert('Đã cập nhật điểm thành công!');
    } catch (e) {
      alert('Đã xảy ra lỗi');
    }
  }

  // ==========================================
  // Actions: Categories
  // ==========================================
  openAddCategoryModal() {
    this.categoryForm.reset({
      name: '',
      icon: '📝',
      color: '#3B82F6'
    });
    this.showCategoryModal.set(true);
  }

  closeCategoryModal() {
    this.showCategoryModal.set(false);
  }

  async saveCategory() {
    if (this.categoryForm.invalid) return;

    const family = this.currentFamily();
    if (!family) return;

    const formVal = this.categoryForm.value;
    try {
      await this.taskRepo.createCategory(family.id, formVal.name, formVal.icon, formVal.color);
      this.closeCategoryModal();
    } catch (e) {
      alert('Đã xảy ra lỗi khi tạo danh mục');
    }
  }

  // ==========================================
  // Formatters
  // ==========================================
  formatDate(dateInput: string | Date | null | undefined): string {
    return formatDateDDMMYYYY(dateInput);
  }

  getChildNameById(childId?: string | null): string {
    if (!childId) return 'Tất cả các bé';
    const c = this.children().find(ch => ch.id === childId);
    return c ? c.name : 'Tất cả các bé';
  }

  getCategoryMeta(categoryId?: string | null): TaskCategory | null {
    if (!categoryId) return null;
    return this.categories().find(c => c.id === categoryId) || null;
  }
}
