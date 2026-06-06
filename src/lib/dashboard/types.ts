export type DashboardCurrency = {
  code: string;
  symbol: string;
  supportsDecimals?: boolean;
};

export type DashboardApiResponse = {
  period: {
    from: string;
    to: string;
  };
  newEnrollments: {
    count: number;
    sparkline: number[];
  };
  attendanceRate: {
    presented: number;
    totalScheduled: number;
    ratePercent: number;
  };
  occupancyRate: {
    enrolledStudents: number;
    maxCapacity: number;
    ratePercent: number;
  };
  revenueCurrentMonth: number;
  revenuePreviousMonth: number;
  revenueByMonth: Array<{
    month: number;
    amount: number;
  }>;
  averageTicket: {
    totalRevenue: number;
    activeStudents: number;
    value: number;
  };
  topServicesByRevenue: Array<{
    serviceId: string;
    serviceName: string;
    imageUrl: string | null;
    revenue: number;
  }>;
};

export type EnrollmentSparklinePoint = {
  index: number;
  value: number;
};

export type AttendanceBarPoint = {
  label: string;
  tone: 'presented' | 'absent';
  value: number;
};

export type OccupancySlice = {
  label: string;
  tone: 'occupied' | 'available';
  value: number;
};

export type MonthlyRevenuePoint = {
  month: number;
  monthLabel: string;
  tone: 'current' | 'history';
  amount: number;
};

export type TopServicePoint = {
  serviceId: string;
  serviceName: string;
  imageUrl: string | null;
  revenue: number;
  fraction: number;
};

export type ServiceAnalyticsViewModel = {
  periodLabel: string;
  currency: DashboardCurrency;
  newEnrollmentsCount: number;
  enrollmentSparkline: EnrollmentSparklinePoint[];
  attendancePresented: number;
  attendanceTotalScheduled: number;
  attendanceRatePercent: number;
  attendanceBars: AttendanceBarPoint[];
  occupancyEnrolledStudents: number;
  occupancyMaxCapacity: number;
  occupancyRatePercent: number;
  occupancySlices: OccupancySlice[];
  revenueCurrentMonth: number;
  revenuePreviousMonth: number;
  revenueVariationPercent: number | null;
  revenueIsGrowing: boolean;
  revenueByMonth: MonthlyRevenuePoint[];
  averageTicket: number;
  activeStudents: number;
  topServicesByRevenue: TopServicePoint[];
};
