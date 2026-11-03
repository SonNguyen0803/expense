import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import {
  TaskCategory,
  KidsTask,
  TaskSubmission,
  RewardItem,
  RewardRedemption,
  PointTransaction,
  ChildAchievement,
  ChildPointSummary,
  Child
} from '../models';
import {
  DEFAULT_TASK_CATEGORIES,
  DEFAULT_SAMPLE_TASKS,
  DEFAULT_SAMPLE_REWARDS,
  ACHIEVEMENTS_LIST,
  calculateChildLevel
} from '../utils/kids-tasks.util';

@Injectable({
  providedIn: 'root'
})
export class KidsTaskRepository {
  private categoriesSignal = signal<TaskCategory[]>([]);
  private tasksSignal = signal<KidsTask[]>([]);
  private submissionsSignal = signal<TaskSubmission[]>([]);
  private rewardsSignal = signal<RewardItem[]>([]);
  private redemptionsSignal = signal<RewardRedemption[]>([]);
  private pointTransactionsSignal = signal<PointTransaction[]>([]);
  private achievementsSignal = signal<ChildAchievement[]>([]);
  private loadingSignal = signal<boolean>(false);

  // Readonly signals
  categories = this.categoriesSignal.asReadonly();
  tasks = this.tasksSignal.asReadonly();
  submissions = this.submissionsSignal.asReadonly();
  rewards = this.rewardsSignal.asReadonly();
  redemptions = this.redemptionsSignal.asReadonly();
  pointTransactions = this.pointTransactionsSignal.asReadonly();
  achievements = this.achievementsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  // Pending submissions (waiting for parent approval)
  pendingSubmissions = computed(() => {
    return this.submissionsSignal().filter(s => s.status === 'PENDING');
  });

  // Pending reward redemptions
  pendingRedemptions = computed(() => {
    return this.redemptionsSignal().filter(r => r.status === 'PENDING');
  });

  constructor(private supabase: SupabaseService) {}

  private getLocalKey(entity: string, familyId: string): string {
    return `family_kids_${entity}_${familyId}`;
  }

  // ==========================================
  // Master Loader for a Family
  // ==========================================
  async loadAll(familyId: string) {
    this.loadingSignal.set(true);
    try {
      await Promise.all([
        this.loadCategories(familyId),
        this.loadTasks(familyId),
        this.loadSubmissions(familyId),
        this.loadRewards(familyId),
        this.loadRedemptions(familyId),
        this.loadPointTransactions(familyId),
        this.loadAchievements(familyId)
      ]);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // ==========================================
  // 1 & 2. Task Categories & Tasks
  // ==========================================
  async loadCategories(familyId: string): Promise<TaskCategory[]> {
    try {
      let data: TaskCategory[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('task_categories')
          .select('*')
          .or(`family_id.eq.${familyId},is_default.eq.true`)
          .order('name');
        if (!res.error && res.data && res.data.length > 0) {
          data = res.data;
        }
      } catch (err) {
        console.warn('Supabase task_categories query failed, using local cache:', err);
      }

      if (!data || data.length === 0) {
        const cached = localStorage.getItem(this.getLocalKey('categories', familyId));
        if (cached) {
          data = JSON.parse(cached);
        } else {
          // Initialize default categories
          data = DEFAULT_TASK_CATEGORIES.map((cat, idx) => ({
            ...cat,
            id: 'tcat_def_' + idx,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          localStorage.setItem(this.getLocalKey('categories', familyId), JSON.stringify(data));
        }
      } else {
        localStorage.setItem(this.getLocalKey('categories', familyId), JSON.stringify(data));
      }

      this.categoriesSignal.set(data || []);
      return data || [];
    } catch (e) {
      console.error('Error loading task categories:', e);
      return [];
    }
  }

  async createCategory(familyId: string, name: string, icon: string, color: string): Promise<TaskCategory> {
    const newCat: Omit<TaskCategory, 'id' | 'created_at' | 'updated_at'> = {
      family_id: familyId,
      name,
      icon,
      color,
      is_default: false
    };

    let created: TaskCategory | null = null;
    try {
      const res = await (this.supabase.db as any).from('task_categories').insert(newCat).select().single();
      if (!res.error && res.data) created = res.data;
    } catch (err) {
      console.warn('Supabase create category failed:', err);
    }

    if (!created) {
      created = {
        ...newCat,
        id: 'tcat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const list = [...this.categoriesSignal(), created];
    this.categoriesSignal.set(list);
    localStorage.setItem(this.getLocalKey('categories', familyId), JSON.stringify(list));
    return created;
  }

  async loadTasks(familyId: string): Promise<KidsTask[]> {
    try {
      let data: KidsTask[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('kids_tasks')
          .select('*, category:task_categories(*), child:children(*)')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false });

        if (!res.error && res.data) data = res.data;
      } catch (err) {
        console.warn('Supabase kids_tasks query failed, using local cache:', err);
      }

      if (!data || data.length === 0) {
        const cached = localStorage.getItem(this.getLocalKey('tasks', familyId));
        if (cached) {
          data = JSON.parse(cached);
        } else {
          // Initialize sample tasks
          const cats = this.categoriesSignal();
          data = DEFAULT_SAMPLE_TASKS.map((t, idx) => ({
            ...t,
            id: 'task_def_' + idx,
            family_id: familyId,
            child_id: null,
            category_id: cats[idx % cats.length]?.id || null,
            category: cats[idx % cats.length] || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          localStorage.setItem(this.getLocalKey('tasks', familyId), JSON.stringify(data));
        }
      } else {
        localStorage.setItem(this.getLocalKey('tasks', familyId), JSON.stringify(data));
      }

      this.tasksSignal.set(data || []);
      return data || [];
    } catch (e) {
      console.error('Error loading tasks:', e);
      return [];
    }
  }

  async createTask(taskData: Omit<KidsTask, 'id' | 'created_at' | 'updated_at'>): Promise<KidsTask> {
    let created: KidsTask | null = null;
    try {
      const res = await (this.supabase.db as any)
        .from('kids_tasks')
        .insert({
          family_id: taskData.family_id,
          child_id: taskData.child_id || null,
          category_id: taskData.category_id || null,
          title: taskData.title,
          description: taskData.description || null,
          points: taskData.points,
          schedule_type: taskData.schedule_type,
          schedule_days: taskData.schedule_days || null,
          due_date: taskData.due_date || null,
          is_active: taskData.is_active,
          created_by: taskData.created_by || null
        })
        .select('*, category:task_categories(*), child:children(*)')
        .single();
      if (!res.error && res.data) created = res.data;
    } catch (err) {
      console.warn('Supabase create task failed:', err);
    }

    if (!created) {
      const cat = this.categoriesSignal().find(c => c.id === taskData.category_id);
      created = {
        ...taskData,
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        category: cat || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const list = [created, ...this.tasksSignal()];
    this.tasksSignal.set(list);
    localStorage.setItem(this.getLocalKey('tasks', taskData.family_id), JSON.stringify(list));
    return created;
  }

  async updateTask(id: string, updates: Partial<KidsTask>, familyId: string): Promise<KidsTask | null> {
    try {
      await (this.supabase.db as any).from('kids_tasks').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Supabase update task failed:', err);
    }

    const cat = updates.category_id ? this.categoriesSignal().find(c => c.id === updates.category_id) : undefined;

    let updatedItem: KidsTask | null = null;
    const list = this.tasksSignal().map(t => {
      if (t.id === id) {
        updatedItem = {
          ...t,
          ...updates,
          category: cat !== undefined ? cat : t.category,
          updated_at: new Date().toISOString()
        };
        return updatedItem;
      }
      return t;
    });

    this.tasksSignal.set(list);
    localStorage.setItem(this.getLocalKey('tasks', familyId), JSON.stringify(list));
    return updatedItem;
  }

  async deleteTask(id: string, familyId: string): Promise<void> {
    try {
      await (this.supabase.db as any).from('kids_tasks').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete task failed:', err);
    }

    const list = this.tasksSignal().filter(t => t.id !== id);
    this.tasksSignal.set(list);
    localStorage.setItem(this.getLocalKey('tasks', familyId), JSON.stringify(list));
  }

  // ==========================================
  // 4. Task Submissions & Approvals
  // ==========================================
  async loadSubmissions(familyId: string): Promise<TaskSubmission[]> {
    try {
      let data: TaskSubmission[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('task_submissions')
          .select('*, task:kids_tasks(*), child:children(*)')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false });

        if (!res.error && res.data) data = res.data;
      } catch (err) {
        console.warn('Supabase task_submissions query failed, using local cache:', err);
      }

      if (!data) {
        const cached = localStorage.getItem(this.getLocalKey('submissions', familyId));
        data = cached ? JSON.parse(cached) : [];
      } else {
        localStorage.setItem(this.getLocalKey('submissions', familyId), JSON.stringify(data));
      }

      this.submissionsSignal.set(data || []);
      return data || [];
    } catch (e) {
      console.error('Error loading submissions:', e);
      return [];
    }
  }

  /**
   * Child marks task as completed -> Submits for parent approval
   */
  async submitTask(
    task: KidsTask,
    child: Child,
    note?: string
  ): Promise<TaskSubmission> {
    const today = new Date().toISOString().split('T')[0];
    const subData: Omit<TaskSubmission, 'id' | 'created_at' | 'updated_at'> = {
      task_id: task.id,
      child_id: child.id,
      family_id: task.family_id,
      submission_date: today,
      status: 'PENDING',
      child_note: note || null,
      points_awarded: task.points,
      task,
      child
    };

    let created: TaskSubmission | null = null;
    try {
      const res = await (this.supabase.db as any)
        .from('task_submissions')
        .insert({
          task_id: task.id,
          child_id: child.id,
          family_id: task.family_id,
          submission_date: today,
          status: 'PENDING',
          child_note: note || null,
          points_awarded: task.points
        })
        .select('*, task:kids_tasks(*), child:children(*)')
        .single();
      if (!res.error && res.data) created = res.data;
    } catch (err) {
      console.warn('Supabase submit task failed:', err);
    }

    if (!created) {
      created = {
        ...subData,
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const list = [created, ...this.submissionsSignal()];
    this.submissionsSignal.set(list);
    localStorage.setItem(this.getLocalKey('submissions', task.family_id), JSON.stringify(list));
    return created;
  }

  /**
   * Parent approves task completion -> Awards points to child
   */
  async approveTask(
    submission: TaskSubmission,
    reviewedBy?: string,
    feedback?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const updates = {
      status: 'APPROVED' as const,
      feedback: feedback || 'Làm tốt lắm con! Bố mẹ rất tự hào về con.',
      reviewed_by: reviewedBy || null,
      reviewed_at: now
    };

    try {
      await (this.supabase.db as any).from('task_submissions').update(updates).eq('id', submission.id);
    } catch (err) {
      console.warn('Supabase approve submission failed:', err);
    }

    // Update submission in state
    const list = this.submissionsSignal().map(s => {
      if (s.id === submission.id) {
        return { ...s, ...updates, updated_at: now };
      }
      return s;
    });
    this.submissionsSignal.set(list);
    localStorage.setItem(this.getLocalKey('submissions', submission.family_id), JSON.stringify(list));

    // Award Points
    const taskTitle = submission.task?.title || 'Hoàn thành nhiệm vụ';
    await this.addPointTransaction({
      child_id: submission.child_id,
      family_id: submission.family_id,
      amount: submission.points_awarded,
      type: 'TASK_REWARD',
      reference_id: submission.id,
      description: `Hoàn thành: "${taskTitle}" (+${submission.points_awarded} điểm)`
    });

    // Check & unlock achievements
    await this.checkAndUnlockAchievements(submission.child_id, submission.family_id);
  }

  /**
   * Parent rejects task submission with feedback
   */
  async rejectTask(
    submission: TaskSubmission,
    reviewedBy?: string,
    feedback?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const updates = {
      status: 'REJECTED' as const,
      feedback: feedback || 'Chưa hoàn thành đầy đủ, con hãy làm lại nhé!',
      reviewed_by: reviewedBy || null,
      reviewed_at: now
    };

    try {
      await (this.supabase.db as any).from('task_submissions').update(updates).eq('id', submission.id);
    } catch (err) {
      console.warn('Supabase reject submission failed:', err);
    }

    const list = this.submissionsSignal().map(s => (s.id === submission.id ? { ...s, ...updates, updated_at: now } : s));
    this.submissionsSignal.set(list);
    localStorage.setItem(this.getLocalKey('submissions', submission.family_id), JSON.stringify(list));
  }

  /**
   * Parent directly marks a task completed & approves on behalf of child
   */
  async quickCompleteTask(
    task: KidsTask,
    child: Child,
    reviewedBy?: string
  ): Promise<void> {
    const sub = await this.submitTask(task, child, 'Bố mẹ xác nhận trực tiếp');
    await this.approveTask(sub, reviewedBy, 'Tuyệt vời!');
  }

  // ==========================================
  // 5. Point Management & Ledger
  // ==========================================
  async loadPointTransactions(familyId: string): Promise<PointTransaction[]> {
    try {
      let data: PointTransaction[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('point_transactions')
          .select('*')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false });

        if (!res.error && res.data) data = res.data;
      } catch (err) {
        console.warn('Supabase point_transactions query failed, using local cache:', err);
      }

      if (!data) {
        const cached = localStorage.getItem(this.getLocalKey('points', familyId));
        data = cached ? JSON.parse(cached) : [];
      } else {
        localStorage.setItem(this.getLocalKey('points', familyId), JSON.stringify(data));
      }

      this.pointTransactionsSignal.set(data || []);
      return data || [];
    } catch (e) {
      console.error('Error loading point transactions:', e);
      return [];
    }
  }

  async addPointTransaction(
    tx: Omit<PointTransaction, 'id' | 'created_at'>
  ): Promise<PointTransaction> {
    let created: PointTransaction | null = null;
    try {
      const res = await (this.supabase.db as any)
        .from('point_transactions')
        .insert({
          child_id: tx.child_id,
          family_id: tx.family_id,
          amount: tx.amount,
          type: tx.type,
          reference_id: tx.reference_id || null,
          description: tx.description
        })
        .select()
        .single();
      if (!res.error && res.data) created = res.data;
    } catch (err) {
      console.warn('Supabase add point transaction failed:', err);
    }

    if (!created) {
      created = {
        ...tx,
        id: 'ptx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        created_at: new Date().toISOString()
      };
    }

    const list = [created, ...this.pointTransactionsSignal()];
    this.pointTransactionsSignal.set(list);
    localStorage.setItem(this.getLocalKey('points', tx.family_id), JSON.stringify(list));
    return created;
  }

  /**
   * Manual Bonus or Penalty added by parent
   */
  async adjustPoints(
    childId: string,
    familyId: string,
    amount: number,
    type: 'BONUS' | 'PENALTY',
    description: string
  ): Promise<PointTransaction> {
    const finalAmount = type === 'BONUS' ? Math.abs(amount) : -Math.abs(amount);
    const tx = await this.addPointTransaction({
      child_id: childId,
      family_id: familyId,
      amount: finalAmount,
      type,
      description: `${type === 'BONUS' ? '⭐ Thưởng nóng' : '⚠️ Trừ điểm'}: ${description} (${finalAmount > 0 ? '+' : ''}${finalAmount} điểm)`
    });

    await this.checkAndUnlockAchievements(childId, familyId);
    return tx;
  }

  getChildPoints(childId: string): { balance: number; earned: number; spent: number } {
    const txs = this.pointTransactionsSignal().filter(t => t.child_id === childId);
    let balance = 0;
    let earned = 0;
    let spent = 0;

    for (const t of txs) {
      balance += t.amount;
      if (t.amount > 0) earned += t.amount;
      else spent += Math.abs(t.amount);
    }

    return {
      balance: Math.max(0, balance),
      earned,
      spent
    };
  }

  // ==========================================
  // 6. Reward Store & Redemptions
  // ==========================================
  async loadRewards(familyId: string): Promise<RewardItem[]> {
    try {
      let data: RewardItem[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('reward_items')
          .select('*')
          .eq('family_id', familyId)
          .order('points_cost', { ascending: true });

        if (!res.error && res.data) data = res.data;
      } catch (err) {
        console.warn('Supabase reward_items query failed, using local cache:', err);
      }

      if (!data || data.length === 0) {
        const cached = localStorage.getItem(this.getLocalKey('rewards', familyId));
        if (cached) {
          data = JSON.parse(cached);
        } else {
          // Initialize sample rewards
          data = DEFAULT_SAMPLE_REWARDS.map((r, idx) => ({
            ...r,
            id: 'rew_def_' + idx,
            family_id: familyId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          localStorage.setItem(this.getLocalKey('rewards', familyId), JSON.stringify(data));
        }
      } else {
        localStorage.setItem(this.getLocalKey('rewards', familyId), JSON.stringify(data));
      }

      this.rewardsSignal.set(data || []);
      return data || [];
    } catch (e) {
      console.error('Error loading rewards:', e);
      return [];
    }
  }

  async createReward(rewardData: Omit<RewardItem, 'id' | 'created_at' | 'updated_at'>): Promise<RewardItem> {
    let created: RewardItem | null = null;
    try {
      const res = await (this.supabase.db as any).from('reward_items').insert(rewardData).select().single();
      if (!res.error && res.data) created = res.data;
    } catch (err) {
      console.warn('Supabase create reward failed:', err);
    }

    if (!created) {
      created = {
        ...rewardData,
        id: 'rew_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const list = [...this.rewardsSignal(), created].sort((a, b) => a.points_cost - b.points_cost);
    this.rewardsSignal.set(list);
    localStorage.setItem(this.getLocalKey('rewards', rewardData.family_id), JSON.stringify(list));
    return created;
  }

  async updateReward(id: string, updates: Partial<RewardItem>, familyId: string): Promise<void> {
    try {
      await (this.supabase.db as any).from('reward_items').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Supabase update reward failed:', err);
    }

    const list = this.rewardsSignal().map(r => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r));
    this.rewardsSignal.set(list);
    localStorage.setItem(this.getLocalKey('rewards', familyId), JSON.stringify(list));
  }

  async deleteReward(id: string, familyId: string): Promise<void> {
    try {
      await (this.supabase.db as any).from('reward_items').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete reward failed:', err);
    }

    const list = this.rewardsSignal().filter(r => r.id !== id);
    this.rewardsSignal.set(list);
    localStorage.setItem(this.getLocalKey('rewards', familyId), JSON.stringify(list));
  }

  async loadRedemptions(familyId: string): Promise<RewardRedemption[]> {
    try {
      let data: RewardRedemption[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('reward_redemptions')
          .select('*, reward:reward_items(*), child:children(*)')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false });

        if (!res.error && res.data) data = res.data;
      } catch (err) {
        console.warn('Supabase reward_redemptions query failed, using local cache:', err);
      }

      if (!data) {
        const cached = localStorage.getItem(this.getLocalKey('redemptions', familyId));
        data = cached ? JSON.parse(cached) : [];
      } else {
        localStorage.setItem(this.getLocalKey('redemptions', familyId), JSON.stringify(data));
      }

      this.redemptionsSignal.set(data || []);
      return data || [];
    } catch (e) {
      console.error('Error loading redemptions:', e);
      return [];
    }
  }

  async redeemReward(
    reward: RewardItem,
    child: Child,
    note?: string
  ): Promise<RewardRedemption> {
    const pts = this.getChildPoints(child.id);
    if (pts.balance < reward.points_cost) {
      throw new Error(`Bé chưa đủ điểm để đổi quà này (Cần ${reward.points_cost} điểm, hiện có ${pts.balance} điểm)`);
    }

    const today = new Date().toISOString().split('T')[0];
    const redData: Omit<RewardRedemption, 'id' | 'created_at' | 'updated_at'> = {
      reward_id: reward.id,
      child_id: child.id,
      family_id: reward.family_id,
      points_spent: reward.points_cost,
      status: 'PENDING',
      request_date: today,
      note: note || null,
      reward,
      child
    };

    let created: RewardRedemption | null = null;
    try {
      const res = await (this.supabase.db as any)
        .from('reward_redemptions')
        .insert({
          reward_id: reward.id,
          child_id: child.id,
          family_id: reward.family_id,
          points_spent: reward.points_cost,
          status: 'PENDING',
          request_date: today,
          note: note || null
        })
        .select('*, reward:reward_items(*), child:children(*)')
        .single();
      if (!res.error && res.data) created = res.data;
    } catch (err) {
      console.warn('Supabase redeem reward failed:', err);
    }

    if (!created) {
      created = {
        ...redData,
        id: 'rdm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const list = [created, ...this.redemptionsSignal()];
    this.redemptionsSignal.set(list);
    localStorage.setItem(this.getLocalKey('redemptions', reward.family_id), JSON.stringify(list));
    return created;
  }

  async approveRedemption(redemption: RewardRedemption, reviewedBy?: string): Promise<void> {
    const now = new Date().toISOString();
    const updates = {
      status: 'APPROVED' as const,
      reviewed_by: reviewedBy || null,
      reviewed_at: now
    };

    try {
      await (this.supabase.db as any).from('reward_redemptions').update(updates).eq('id', redemption.id);
    } catch (err) {
      console.warn('Supabase approve redemption failed:', err);
    }

    const list = this.redemptionsSignal().map(r => (r.id === redemption.id ? { ...r, ...updates, updated_at: now } : r));
    this.redemptionsSignal.set(list);
    localStorage.setItem(this.getLocalKey('redemptions', redemption.family_id), JSON.stringify(list));

    // Deduct points
    const rewTitle = redemption.reward?.title || 'Đổi phần thưởng';
    await this.addPointTransaction({
      child_id: redemption.child_id,
      family_id: redemption.family_id,
      amount: -redemption.points_spent,
      type: 'REWARD_REDEEM',
      reference_id: redemption.id,
      description: `Đổi quà: "${rewTitle}" (-${redemption.points_spent} điểm)`
    });

    await this.checkAndUnlockAchievements(redemption.child_id, redemption.family_id);
  }

  async fulfillRedemption(redemptionId: string, familyId: string): Promise<void> {
    const updates = { status: 'FULFILLED' as const, updated_at: new Date().toISOString() };
    try {
      await (this.supabase.db as any).from('reward_redemptions').update(updates).eq('id', redemptionId);
    } catch (err) {
      console.warn('Supabase fulfill redemption failed:', err);
    }

    const list = this.redemptionsSignal().map(r => (r.id === redemptionId ? { ...r, ...updates } : r));
    this.redemptionsSignal.set(list);
    localStorage.setItem(this.getLocalKey('redemptions', familyId), JSON.stringify(list));
  }

  async rejectRedemption(redemptionId: string, familyId: string): Promise<void> {
    const updates = { status: 'REJECTED' as const, updated_at: new Date().toISOString() };
    try {
      await (this.supabase.db as any).from('reward_redemptions').update(updates).eq('id', redemptionId);
    } catch (err) {
      console.warn('Supabase reject redemption failed:', err);
    }

    const list = this.redemptionsSignal().map(r => (r.id === redemptionId ? { ...r, ...updates } : r));
    this.redemptionsSignal.set(list);
    localStorage.setItem(this.getLocalKey('redemptions', familyId), JSON.stringify(list));
  }

  // ==========================================
  // 7. Achievement & Ranking
  // ==========================================
  async loadAchievements(familyId: string): Promise<ChildAchievement[]> {
    try {
      let data: ChildAchievement[] | null = null;
      try {
        const res = await (this.supabase.db as any)
          .from('child_achievements')
          .select('*')
          .eq('family_id', familyId);

        if (!res.error && res.data) data = res.data;
      } catch (err) {
        console.warn('Supabase achievements query failed, using local cache:', err);
      }

      if (!data) {
        const cached = localStorage.getItem(this.getLocalKey('achievements', familyId));
        data = cached ? JSON.parse(cached) : [];
      } else {
        localStorage.setItem(this.getLocalKey('achievements', familyId), JSON.stringify(data));
      }

      this.achievementsSignal.set(data || []);
      return data || [];
    } catch (e) {
      console.error('Error loading achievements:', e);
      return [];
    }
  }

  async checkAndUnlockAchievements(childId: string, familyId: string): Promise<void> {
    const approvedSubs = this.submissionsSignal().filter(s => s.child_id === childId && s.status === 'APPROVED');
    const completedCount = approvedSubs.length;
    const pts = this.getChildPoints(childId);
    const approvedRedemptions = this.redemptionsSignal().filter(r => r.child_id === childId && (r.status === 'APPROVED' || r.status === 'FULFILLED'));

    const currentBadges = new Set(this.achievementsSignal().filter(a => a.child_id === childId).map(a => a.badge_key));
    const toUnlock: string[] = [];

    if (completedCount >= 1 && !currentBadges.has('FIRST_TASK')) toUnlock.push('FIRST_TASK');
    if (completedCount >= 5 && !currentBadges.has('TASK_5')) toUnlock.push('TASK_5');
    if (completedCount >= 20 && !currentBadges.has('TASK_20')) toUnlock.push('TASK_20');
    if (completedCount >= 50 && !currentBadges.has('TASK_50')) toUnlock.push('TASK_50');

    if (pts.earned >= 100 && !currentBadges.has('POINTS_100')) toUnlock.push('POINTS_100');
    if (pts.earned >= 300 && !currentBadges.has('POINTS_300')) toUnlock.push('POINTS_300');

    if (approvedRedemptions.length >= 1 && !currentBadges.has('FIRST_REWARD')) toUnlock.push('FIRST_REWARD');

    for (const key of toUnlock) {
      const ach: ChildAchievement = {
        id: 'ach_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        child_id: childId,
        family_id: familyId,
        badge_key: key,
        unlocked_at: new Date().toISOString()
      };

      try {
        await (this.supabase.db as any).from('child_achievements').insert({
          child_id: childId,
          family_id: familyId,
          badge_key: key
        });
      } catch (err) {
        console.warn('Insert achievement failed:', err);
      }

      const list = [...this.achievementsSignal(), ach];
      this.achievementsSignal.set(list);
      localStorage.setItem(this.getLocalKey('achievements', familyId), JSON.stringify(list));
    }
  }

  /**
   * Generates Ranking / Leaderboard for all children in the family
   */
  getChildLeaderboard(children: Child[]): ChildPointSummary[] {
    const summaries: ChildPointSummary[] = [];

    for (const child of children) {
      const pts = this.getChildPoints(child.id);
      const approvedSubs = this.submissionsSignal().filter(s => s.child_id === child.id && s.status === 'APPROVED');
      const badges = this.achievementsSignal().filter(a => a.child_id === child.id);
      const lvl = calculateChildLevel(pts.earned);

      summaries.push({
        childId: child.id,
        childName: child.name,
        childGender: child.gender,
        currentPoints: pts.balance,
        totalEarned: pts.earned,
        totalSpent: pts.spent,
        completedTasksCount: approvedSubs.length,
        level: lvl.level,
        levelTitle: lvl.title,
        badgesCount: badges.length
      });
    }

    // Sort by currentPoints descending, then totalEarned descending
    return summaries.sort((a, b) => b.currentPoints - a.currentPoints || b.totalEarned - a.totalEarned);
  }
}
