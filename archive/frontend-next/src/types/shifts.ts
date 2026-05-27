// Shift Management Types

export interface ShiftMaster {
  id: string;
  shiftName: string;
  shiftCode: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  breakDuration: number; // in minutes
  totalWorkingHours: number;
  description?: string;
  status: 'Active' | 'Inactive';
  createdDate: Date;
}

export interface EmployeeShift {
  id: string;
  employeeId: string;
  shiftId: string;
  effectiveDate: Date;
  endDate?: Date;
  status: 'Active' | 'Inactive';
}

export interface ShiftRoster {
  id: string;
  shiftId: string;
  rosterDate: Date;
  rosterPeriod: 'Weekly' | 'Monthly' | 'Quarterly';
  status: 'Draft' | 'Published' | 'Locked';
  publishedDate?: Date;
  publishedBy?: string;
}

export interface RosterEntry {
  id: string;
  rosterId: string;
  employeeId: string;
  shiftAssignedDate: Date;
  shiftId: string;
  isWeekend: boolean;
  isHoliday: boolean;
  remarks?: string;
}

export interface ShiftSwap {
  id: string;
  requestedBy: string;
  requestedWith: string;
  requestedDate: Date;
  originalShiftDate: Date;
  swappedShiftDate: Date;
  originalShiftId: string;
  swappedShiftId: string;
  reason: string;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Withdrawn';
  approvedBy?: string;
  approvalDate?: Date;
}

export interface ShiftHandover {
  id: string;
  employeeId: string;
  handoverDate: Date;
  previousShiftId: string;
  newShiftId: string;
  handoverNotes?: string;
  completedDate?: Date;
  status: 'Pending' | 'Completed';
}

export interface ShiftException {
  id: string;
  employeeId: string;
  exceptionDate: Date;
  exceptionType: 'AbsentWithPermission' | 'OnLeave' | 'CompensatoryOff' | 'Holiday' | 'WeeklyOff';
  reason?: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface CreateShiftRequest {
  shiftName: string;
  shiftCode: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  totalWorkingHours: number;
  description?: string;
}

export interface CreateShiftSwapRequest {
  requestedWith: string;
  originalShiftDate: Date;
  swappedShiftDate: Date;
  reason: string;
}

export interface ApproveShiftSwapRequest {
  swapId: string;
  approvalStatus: 'Approved' | 'Rejected';
  approvalNotes?: string;
}
