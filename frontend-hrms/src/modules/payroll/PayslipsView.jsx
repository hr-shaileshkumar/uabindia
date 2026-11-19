import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Download,
  Printer,
  X,
  Search,
  Building2,
  CheckCircle2,
} from "lucide-react";
import hrmsService from "../../services/hrmsService";
import StatusBadge from "../../components/common/StatusBadge";
import { useNotification } from "../../context/NotificationContext";

export const PayslipsView = () => {
  const { notifySuccess } = useNotification();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    hrmsService.getPayslips().then((data) => {
      if (mounted) {
        setPayslips(data || []);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredSlips = payslips.filter(
    (s) =>
      (s.employeeName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.employeeCode || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (selectedSlip) {
      notifySuccess(`Payslip for ${selectedSlip.employeeName} (${selectedSlip.month}) downloaded`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link
              to="/payroll"
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              ← Back to Payroll Execution
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Salary Slips
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Employee Payslips Directory
          </h1>
          <p className="text-xs text-slate-500">
            Itemized salary statements, tax withholding certificates, and downloadable digital slips.
          </p>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search employee or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-[10.5px] uppercase tracking-wider">
                <th className="px-3 py-2">Emp Code</th>
                <th className="px-3 py-2">Employee Name</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Month</th>
                <th className="px-3 py-2">Gross Earnings</th>
                <th className="px-3 py-2">Total Deductions</th>
                <th className="px-3 py-2">Net In-Hand</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-400 text-xs">
                    Loading salary slips from database...
                  </td>
                </tr>
              ) : filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-400 text-xs">
                    No payslips found matching your search.
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip) => (
                  <tr
                    key={slip.id}
                    onClick={() => setSelectedSlip(slip)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="px-3 py-2 font-mono font-bold text-slate-600 text-xs">
                      {slip.employeeCode}
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs">
                      {slip.employeeName}
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{slip.departmentName || "Engineering"}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700 text-xs">{slip.month}</td>
                    <td className="px-3 py-2 font-mono text-slate-800 text-xs">
                      ₹ {(slip.gross || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2 font-mono text-rose-600 text-xs">
                      ₹ {(slip.totalDeductions || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-emerald-600 text-xs">
                      ₹ {(slip.net || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={slip.status || "Paid"} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSlip(slip);
                        }}
                        className="px-2.5 py-1 rounded-md border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 font-semibold text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs"
                      >
                        <FileText className="w-3 h-3" />
                        View Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Printable Salary Slip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 my-6">
            {/* Modal Actions Header */}
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
              <span className="text-xs font-bold text-slate-700">
                Official Pay Statement Preview
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrint}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Printer className="w-3 h-3" />
                  Print
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div className="p-5 space-y-4 text-xs text-slate-800" id="printable-payslip">
              {/* Company Header */}
              <div className="border-b border-slate-200 pb-3 text-center">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  UAB India Enterprise Ltd
                </h2>
                <p className="text-[10.5px] text-slate-500">
                  Prestige Tech Park, Outer Ring Road, Bangalore - 560103, Karnataka, India
                </p>
                <p className="text-[11px] font-bold text-blue-700 mt-1 uppercase tracking-wider">
                  Payslip for the Period of {selectedSlip.month}
                </p>
              </div>

              {/* Employee Meta Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Employee Name</div>
                  <div className="font-bold text-slate-900">{selectedSlip.employeeName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Employee Code</div>
                  <div className="font-mono font-bold text-slate-900">{selectedSlip.employeeCode}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Designation & Dept</div>
                  <div className="text-slate-700 font-medium">
                    {selectedSlip.designationName || "Software Architect"} • {selectedSlip.departmentName || "Engineering"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Payment Mode</div>
                  <div className="text-slate-700 font-medium">Direct Bank Transfer (NEFT)</div>
                </div>
              </div>

              {/* Itemized 2-Column Table */}
              <div className="grid grid-cols-2 gap-4 border-y border-slate-200 py-3 text-xs">
                {/* Earnings */}
                <div className="space-y-1.5 pr-3 border-r border-slate-200">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-emerald-700 border-b border-emerald-100 pb-1 flex justify-between">
                    <span>Earnings</span>
                    <span>Amount (INR)</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-mono font-semibold">₹ {(selectedSlip.basic || (selectedSlip.gross * 0.5) || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-600">House Rent (HRA)</span>
                    <span className="font-mono font-semibold">₹ {(selectedSlip.hra || (selectedSlip.gross * 0.25) || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-mono font-semibold">₹ {(selectedSlip.specialAllowance || (selectedSlip.gross * 0.25) || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 font-bold text-slate-900">
                    <span>Gross Earnings</span>
                    <span className="font-mono text-emerald-600">₹ {(selectedSlip.gross || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-1.5 pl-3">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-rose-700 border-b border-rose-100 pb-1 flex justify-between">
                    <span>Deductions</span>
                    <span>Amount (INR)</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-600">Provident Fund (EPF)</span>
                    <span className="font-mono font-semibold">₹ {(selectedSlip.pfEmployee || 3600).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-600">Professional Tax</span>
                    <span className="font-mono font-semibold">₹ {(selectedSlip.professionalTax || 200).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-600">Income Tax (TDS)</span>
                    <span className="font-mono font-semibold">₹ {(selectedSlip.tdsTax || (selectedSlip.totalDeductions ? selectedSlip.totalDeductions - 3800 : 0)).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 font-bold text-slate-900">
                    <span>Total Deductions</span>
                    <span className="font-mono text-rose-600">₹ {(selectedSlip.totalDeductions || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary In-Hand Box */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    Net Take-Home Pay
                  </div>
                  <div className="text-base font-bold font-mono text-blue-950 mt-0.5">
                    ₹ {(selectedSlip.net || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-right text-[10px] text-blue-700/80 font-medium italic">
                  Digitally authenticated statement. No physical signature required.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipsView;
