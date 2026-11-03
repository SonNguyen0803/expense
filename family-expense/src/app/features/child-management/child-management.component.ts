import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { FamilyRepository } from '../../core/services/family.repository';
import { AuthService } from '../../core/auth/auth.service';
import { ChildRepository } from '../../core/services/child.repository';
import { Child, GrowthRecord, ChildMilestone, MilestoneCategory, ChildGender } from '../../core/models';
import {
  calculateChildAge,
  calculateChildBMI,
  getWHOStandard,
  MILESTONE_CATEGORIES
} from '../../core/utils/child-growth.util';

type ActiveTab = 'CHART' | 'HISTORY' | 'MILESTONES' | 'PROFILE';
type ChartMetric = 'COMBINED' | 'HEIGHT' | 'WEIGHT';

@Component({
  selector: 'app-child-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NgxEchartsDirective],
  templateUrl: './child-management.component.html'
})
export class ChildManagementComponent implements OnInit {
  currentFamily;
  currentUser;

  selectedChild;
  children;
  growthRecords;
  milestones;
  latestRecord;
  previousRecord;

  // Active state
  activeTab = signal<ActiveTab>('CHART');
  chartMetric = signal<ChartMetric>('COMBINED');

  // Filters for history
  filterYear = signal<string>('ALL');
  filterMonth = signal<string>('ALL');

  // Filters for milestones
  filterMilestoneCategory = signal<string>('ALL');
  filterMilestoneStatus = signal<string>('ALL');

  // Modals state
  showChildModal = signal<boolean>(false);
  isEditChild = signal<boolean>(false);
  showRecordModal = signal<boolean>(false);
  editingRecordId = signal<string | null>(null);
  showMilestoneModal = signal<boolean>(false);

  // Forms
  childForm: FormGroup;
  recordForm: FormGroup;
  milestoneForm: FormGroup;

  // Milestone categories constant for template
  milestoneCategories = MILESTONE_CATEGORIES;

  constructor(
    public childRepo: ChildRepository,
    private familyRepo: FamilyRepository,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.currentFamily = this.familyRepo.selectedFamily;
    this.currentUser = this.authService.user;
    this.selectedChild = this.childRepo.selectedChild;
    this.children = this.childRepo.children;
    this.growthRecords = this.childRepo.growthRecords;
    this.milestones = this.childRepo.milestones;
    this.latestRecord = this.childRepo.latestRecord;
    this.previousRecord = this.childRepo.previousRecord;

    // Child form
    this.childForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['BOY', Validators.required],
      birth_date: [new Date().toISOString().split('T')[0], Validators.required],
      avatar_url: ['👶'],
      notes: ['']
    });

    // Record form
    this.recordForm = this.fb.group({
      record_date: [new Date().toISOString().split('T')[0], Validators.required],
      height: ['', [Validators.required, Validators.min(20), Validators.max(220)]],
      weight: ['', [Validators.required, Validators.min(0.5), Validators.max(150)]],
      head_circumference: [''],
      note: ['']
    });

    // Milestone form
    this.milestoneForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      category: ['MOTOR', Validators.required],
      target_age_months: [12, [Validators.required, Validators.min(0)]],
      description: [''],
      achieved: [false],
      achieved_date: ['']
    });

    // Reactively reload children when family changes
    effect(() => {
      const family = this.currentFamily();
      if (family?.id) {
        this.childRepo.loadChildren(family.id);
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
    }
  }

  // ==========================================
  // Computed Data
  // ==========================================

  // Age of selected child
  currentAge = computed(() => {
    const child = this.selectedChild();
    if (!child) return null;
    return calculateChildAge(child.birth_date);
  });

  // Current BMI based on latest record
  currentBMI = computed(() => {
    const rec = this.latestRecord();
    if (!rec) return null;
    return calculateChildBMI(rec.weight, rec.height);
  });

  // Height & Weight growth delta (compared to previous measurement)
  growthDelta = computed(() => {
    const latest = this.latestRecord();
    const prev = this.previousRecord();
    if (!latest || !prev) return null;

    const heightDelta = Math.round((latest.height - prev.height) * 10) / 10;
    const weightDelta = Math.round((latest.weight - prev.weight) * 10) / 10;

    return {
      heightDelta,
      weightDelta,
      daysBetween: Math.max(
        1,
        Math.round(
          (new Date(latest.record_date).getTime() - new Date(prev.record_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    };
  });

  // Comparison with WHO Standard
  whoComparison = computed(() => {
    const child = this.selectedChild();
    const rec = this.latestRecord();
    if (!child || !rec) return null;

    const age = calculateChildAge(child.birth_date, rec.record_date);
    const standard = getWHOStandard(child.gender, age.totalMonths);

    const heightDiff = Math.round((rec.height - standard.height) * 10) / 10;
    const weightDiff = Math.round((rec.weight - standard.weight) * 10) / 10;

    return {
      standardHeight: standard.height,
      standardWeight: standard.weight,
      heightDiff,
      weightDiff
    };
  });

  // Milestones progress stats
  milestoneStats = computed(() => {
    const list = this.milestones();
    const total = list.length;
    const achieved = list.filter(m => m.achieved).length;
    const percentage = total > 0 ? Math.round((achieved / total) * 100) : 0;
    return { total, achieved, percentage };
  });

  // Filtered History Records (sorted descending by date)
  filteredRecords = computed(() => {
    const records = this.growthRecords();
    const year = this.filterYear();
    const month = this.filterMonth();

    let list = [...records].sort(
      (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    );

    if (year !== 'ALL') {
      list = list.filter(r => new Date(r.record_date).getFullYear().toString() === year);
    }
    if (month !== 'ALL') {
      list = list.filter(r => (new Date(r.record_date).getMonth() + 1).toString() === month);
    }

    return list;
  });

  // Available Years for filter dropdown
  availableYears = computed(() => {
    const records = this.growthRecords();
    const years = new Set<string>();
    records.forEach(r => years.add(new Date(r.record_date).getFullYear().toString()));
    return Array.from(years).sort().reverse();
  });

  // Filtered Milestones
  filteredMilestones = computed(() => {
    const list = this.milestones();
    const cat = this.filterMilestoneCategory();
    const status = this.filterMilestoneStatus();

    let result = [...list];

    if (cat !== 'ALL') {
      result = result.filter(m => m.category === cat);
    }

    if (status === 'ACHIEVED') {
      result = result.filter(m => m.achieved);
    } else if (status === 'PENDING') {
      result = result.filter(m => !m.achieved);
    }

    return result.sort((a, b) => (a.target_age_months || 0) - (b.target_age_months || 0));
  });

  // ==========================================
  // Growth Chart Options (ECharts)
  // ==========================================

  growthChartOption = computed<EChartsOption>(() => {
    const child = this.selectedChild();
    const records = this.growthRecords();
    const metric = this.chartMetric();

    if (!child || records.length === 0) {
      return {
        title: {
          text: 'Chưa có dữ liệu đo lường',
          left: 'center',
          top: 'center',
          textStyle: { color: '#9CA3AF', fontSize: 14 }
        }
      };
    }

    // Sort ascending by date
    const sorted = [...records].sort(
      (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
    );

    const xLabels: string[] = [];
    const actualHeights: number[] = [];
    const whoHeights: number[] = [];
    const actualWeights: number[] = [];
    const whoWeights: number[] = [];

    sorted.forEach(r => {
      const age = calculateChildAge(child.birth_date, r.record_date);
      const who = getWHOStandard(child.gender, age.totalMonths);

      const d = new Date(r.record_date);
      const dateLabel = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      xLabels.push(`${dateLabel}\n(${age.label})`);

      actualHeights.push(r.height);
      whoHeights.push(who.height);

      actualWeights.push(r.weight);
      whoWeights.push(who.weight);
    });

    const isHeight = metric === 'HEIGHT' || metric === 'COMBINED';
    const isWeight = metric === 'WEIGHT' || metric === 'COMBINED';

    const series: any[] = [];
    const yAxis: any[] = [];

    // Left Y Axis: Height (cm)
    if (isHeight) {
      yAxis.push({
        type: 'value',
        name: 'Chiều cao (cm)',
        position: 'left',
        axisLine: { show: true, lineStyle: { color: '#3B82F6' } },
        axisLabel: { formatter: '{value} cm' },
        splitLine: { lineStyle: { color: 'rgba(156, 163, 175, 0.2)' } }
      });

      // Actual Height
      series.push({
        name: `Chiều cao của ${child.name}`,
        type: 'line',
        smooth: true,
        data: actualHeights,
        itemStyle: { color: '#3B82F6' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
            ]
          }
        }
      });

      // WHO Height
      series.push({
        name: 'Chuẩn WHO (Chiều cao)',
        type: 'line',
        smooth: true,
        data: whoHeights,
        itemStyle: { color: '#93C5FD' },
        lineStyle: { width: 2, type: 'dashed' },
        symbol: 'none'
      });
    }

    // Right Y Axis: Weight (kg)
    if (isWeight) {
      const yAxisIndex = isHeight && metric === 'COMBINED' ? 1 : 0;

      yAxis.push({
        type: 'value',
        name: 'Cân nặng (kg)',
        position: isHeight && metric === 'COMBINED' ? 'right' : 'left',
        axisLine: { show: true, lineStyle: { color: '#F97316' } },
        axisLabel: { formatter: '{value} kg' },
        splitLine: isHeight && metric === 'COMBINED' ? { show: false } : { lineStyle: { color: 'rgba(156, 163, 175, 0.2)' } }
      });

      // Actual Weight
      series.push({
        name: `Cân nặng của ${child.name}`,
        type: 'line',
        yAxisIndex,
        smooth: true,
        data: actualWeights,
        itemStyle: { color: '#F97316' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249, 115, 22, 0.35)' },
              { offset: 1, color: 'rgba(249, 115, 22, 0.02)' }
            ]
          }
        }
      });

      // WHO Weight
      series.push({
        name: 'Chuẩn WHO (Cân nặng)',
        type: 'line',
        yAxisIndex,
        smooth: true,
        data: whoWeights,
        itemStyle: { color: '#FDBA74' },
        lineStyle: { width: 2, type: 'dashed' },
        symbol: 'none'
      });
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#6B7280' }
      },
      grid: {
        left: '4%',
        right: isHeight && isWeight ? '5%' : '4%',
        top: '12%',
        bottom: '16%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLine: { lineStyle: { color: '#9CA3AF' } },
        axisLabel: { interval: 0, rotate: sorted.length > 5 ? 25 : 0 }
      },
      yAxis,
      series
    };
  });

  // ==========================================
  // Actions: Child Management
  // ==========================================

  selectChild(child: Child) {
    this.childRepo.selectChild(child);
  }

  openAddChildModal() {
    this.isEditChild.set(false);
    this.childForm.reset({
      name: '',
      gender: 'BOY',
      birth_date: new Date().toISOString().split('T')[0],
      avatar_url: '👶',
      notes: ''
    });
    this.showChildModal.set(true);
  }

  openEditChildModal() {
    const child = this.selectedChild();
    if (!child) return;
    this.isEditChild.set(true);
    this.childForm.patchValue({
      name: child.name,
      gender: child.gender,
      birth_date: child.birth_date,
      avatar_url: child.avatar_url || '👶',
      notes: child.notes || ''
    });
    this.showChildModal.set(true);
  }

  closeChildModal() {
    this.showChildModal.set(false);
  }

  async saveChild() {
    if (this.childForm.invalid) return;

    const family = this.currentFamily();
    const user = this.currentUser();
    if (!family) {
      alert('Vui lòng chọn gia đình trước');
      return;
    }

    const formVal = this.childForm.value;

    try {
      if (this.isEditChild()) {
        const child = this.selectedChild();
        if (child) {
          await this.childRepo.updateChild(child.id, formVal);
        }
      } else {
        await this.childRepo.createChild({
          family_id: family.id,
          name: formVal.name,
          gender: formVal.gender,
          birth_date: formVal.birth_date,
          avatar_url: formVal.avatar_url || '👶',
          notes: formVal.notes || '',
          created_by: user?.id || null
        });
      }
      this.closeChildModal();
    } catch (error) {
      alert('Đã xảy ra lỗi khi lưu thông tin bé');
    }
  }

  async deleteChild() {
    const child = this.selectedChild();
    if (!child) return;

    const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa hồ sơ bé "${child.name}" cùng toàn bộ dữ liệu tăng trưởng?`);
    if (!confirmDelete) return;

    try {
      await this.childRepo.deleteChild(child.id, child.family_id);
    } catch (error) {
      alert('Đã xảy ra lỗi khi xóa hồ sơ bé');
    }
  }

  // ==========================================
  // Actions: Growth Records
  // ==========================================

  openAddRecordModal() {
    this.editingRecordId.set(null);
    this.recordForm.reset({
      record_date: new Date().toISOString().split('T')[0],
      height: '',
      weight: '',
      head_circumference: '',
      note: ''
    });
    this.showRecordModal.set(true);
  }

  openEditRecordModal(record: GrowthRecord) {
    this.editingRecordId.set(record.id);
    this.recordForm.patchValue({
      record_date: record.record_date,
      height: record.height,
      weight: record.weight,
      head_circumference: record.head_circumference || '',
      note: record.note || ''
    });
    this.showRecordModal.set(true);
  }

  closeRecordModal() {
    this.showRecordModal.set(false);
    this.editingRecordId.set(null);
  }

  async saveRecord() {
    if (this.recordForm.invalid) return;

    const child = this.selectedChild();
    const family = this.currentFamily();
    const user = this.currentUser();
    if (!child || !family) return;

    const formVal = this.recordForm.value;
    const height = parseFloat(formVal.height);
    const weight = parseFloat(formVal.weight);
    const headCircumference = formVal.head_circumference ? parseFloat(formVal.head_circumference) : null;

    try {
      const editingId = this.editingRecordId();
      if (editingId) {
        await this.childRepo.updateGrowthRecord(editingId, {
          record_date: formVal.record_date,
          height,
          weight,
          head_circumference: headCircumference,
          note: formVal.note || null
        });
      } else {
        await this.childRepo.addGrowthRecord({
          child_id: child.id,
          family_id: family.id,
          record_date: formVal.record_date,
          height,
          weight,
          head_circumference: headCircumference,
          note: formVal.note || null,
          created_by: user?.id || null
        });
      }
      this.closeRecordModal();
    } catch (error) {
      alert('Đã xảy ra lỗi khi lưu số đo');
    }
  }

  async deleteRecord(record: GrowthRecord) {
    const confirmDelete = confirm(`Bạn có chắc muốn xóa số đo ngày ${this.formatDate(record.record_date)}?`);
    if (!confirmDelete) return;

    try {
      await this.childRepo.deleteGrowthRecord(record.id);
    } catch (error) {
      alert('Đã xảy ra lỗi khi xóa số đo');
    }
  }

  // ==========================================
  // Actions: Milestones
  // ==========================================

  async toggleMilestone(milestone: ChildMilestone) {
    const newStatus = !milestone.achieved;
    const today = new Date().toISOString().split('T')[0];
    try {
      await this.childRepo.toggleMilestone(
        milestone.id,
        newStatus,
        newStatus ? (milestone.achieved_date || today) : null,
        milestone.note || null
      );
    } catch (error) {
      alert('Đã xảy ra lỗi khi cập nhật mốc phát triển');
    }
  }

  openAddMilestoneModal() {
    this.milestoneForm.reset({
      title: '',
      category: 'MOTOR',
      target_age_months: 12,
      description: '',
      achieved: false,
      achieved_date: new Date().toISOString().split('T')[0]
    });
    this.showMilestoneModal.set(true);
  }

  closeMilestoneModal() {
    this.showMilestoneModal.set(false);
  }

  async saveCustomMilestone() {
    if (this.milestoneForm.invalid) return;

    const child = this.selectedChild();
    const family = this.currentFamily();
    if (!child || !family) return;

    const formVal = this.milestoneForm.value;

    try {
      await this.childRepo.addCustomMilestone({
        child_id: child.id,
        family_id: family.id,
        category: formVal.category as MilestoneCategory,
        title: formVal.title,
        description: formVal.description || null,
        target_age_months: parseInt(formVal.target_age_months, 10),
        achieved: !!formVal.achieved,
        achieved_date: formVal.achieved ? formVal.achieved_date : null,
        note: null
      });
      this.closeMilestoneModal();
    } catch (error) {
      alert('Đã xảy ra lỗi khi thêm mốc phát triển');
    }
  }

  async deleteMilestone(milestone: ChildMilestone) {
    const confirmDelete = confirm(`Xóa mốc phát triển "${milestone.title}"?`);
    if (!confirmDelete) return;

    try {
      await this.childRepo.deleteMilestone(milestone.id);
    } catch (error) {
      alert('Đã xảy ra lỗi khi xóa mốc phát triển');
    }
  }

  // ==========================================
  // Helper Formatters
  // ==========================================

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN').format(d);
  }

  getAgeAtDate(birthDate: string, recordDate: string): string {
    return calculateChildAge(birthDate, recordDate).label;
  }

  getBMIDetails(weight: number, height: number) {
    return calculateChildBMI(weight, height);
  }

  getCategoryMeta(categoryKey: MilestoneCategory) {
    return (
      this.milestoneCategories.find(c => c.key === categoryKey) || {
        key: 'OTHER' as MilestoneCategory,
        name: 'Khác',
        icon: '⭐',
        color: 'text-gray-600 bg-gray-50'
      }
    );
  }
}
