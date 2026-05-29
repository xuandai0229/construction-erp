"use client";

import React, { useState, useEffect } from "react";
import PermissionMatrixView from "../components/approvals/PermissionMatrixView";
import { ApprovalInboxTable } from "../components/approvals/ApprovalInboxTable";
import { ApprovalDetailDrawer } from "../components/approvals/ApprovalDetailDrawer";
import { RejectReasonModal } from "../components/approvals/RejectReasonModal";

interface PendingDoc {
  id: string;
  module: string;
  docNo: string;
  projectId: string;
  projectName: string;
  amount: number;
  createdById: string;
  creatorName: string;
  createdAt: Date | string;
  status: string;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "processed" | "created" | "overdue" | "matrix">("pending");
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [processedDocs, setProcessedDocs] = useState<PendingDoc[]>([]);
  const [createdDocs, setCreatedDocs] = useState<PendingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creatorQuery, setCreatorQuery] = useState("");

  // Drawer / Modal states
  const [selectedDoc, setSelectedDoc] = useState<PendingDoc | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [rejectingDoc, setRejectingDoc] = useState<PendingDoc | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Active user session simulation (or fetch from auth state)
  const currentUserId = "user-cfo-id"; // CFO user for authorization testing

  const fetchInboxData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/approvals/inbox").then((res) => {
        if (!res.ok) throw new Error("Không thể tải dữ liệu hộp thư.");
        return res.json();
      }),
      fetch("/api/approvals/my-created").then((res) => {
        if (!res.ok) throw new Error("Không thể tải danh sách tôi đề xuất.");
        return res.json();
      }),
      fetch("/api/approvals/history").then((res) => {
        if (!res.ok) throw new Error("Không thể tải lịch sử.");
        return res.json();
      })
    ])
      .then(([inboxRes, myCreatedRes, historyRes]) => {
        setPendingDocs(inboxRes.data?.pending || []);
        setProcessedDocs(
          (historyRes.data || []).map((h: any) => ({
            id: h.entityId,
            module: h.entity === "Invoice" ? "INVOICE" : h.entity === "CostRecord" ? "COST" : h.entity === "AdvanceRequest" ? "ADVANCE" : "SETTLEMENT",
            docNo: h.entityId.split("-")[0].toUpperCase(),
            projectName: "Phân bổ dòng tiền",
            amount: 0,
            createdById: "",
            creatorName: "Hệ thống",
            createdAt: h.timestamp,
            status: h.action === "APPROVE" ? "APPROVED" : "REJECTED"
          }))
        );
        setCreatedDocs(myCreatedRes.data || []);
      })
      .catch((err) => {
        setError(err.message || "Đã xảy ra lỗi khi đồng bộ dữ liệu hộp thư.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInboxData();
  }, []);

  const handleApprove = async (doc: PendingDoc) => {
    try {
      const res = await fetch(`/api/approvals/${doc.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: doc.module })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Phê duyệt thất bại.");

      setIsDrawerOpen(false);
      setSelectedDoc(null);
      fetchInboxData();
    } catch (err: any) {
      alert(`⚠️ Lỗi phê duyệt: ${err.message}`);
    }
  };

  const handleRejectClick = (doc: PendingDoc) => {
    setRejectingDoc(doc);
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!rejectingDoc) return;
    try {
      const res = await fetch(`/api/approvals/${rejectingDoc.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: rejectingDoc.module, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Từ chối thất bại.");

      setIsRejectModalOpen(false);
      setRejectingDoc(null);
      setIsDrawerOpen(false);
      setSelectedDoc(null);
      fetchInboxData();
    } catch (err: any) {
      alert(`⚠️ Lỗi từ chối: ${err.message}`);
    }
  };

  const getFilteredDocs = (docs: PendingDoc[]) => {
    return docs.filter((doc) => {
      const matchesSearch =
        doc.docNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = selectedModule === "" || doc.module === selectedModule;
      const matchesProject = selectedProject === "" || doc.projectId === selectedProject;
      const matchesStatus = selectedStatus === "" || doc.status === selectedStatus;
      const matchesMinAmt = minAmount === "" || doc.amount >= Number(minAmount);
      const matchesMaxAmt = maxAmount === "" || doc.amount <= Number(maxAmount);
      const matchesCreator = creatorQuery === "" || doc.creatorName.toLowerCase().includes(creatorQuery.toLowerCase());

      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(doc.createdAt) >= new Date(startDate);
      }
      if (endDate) {
        matchesDate = matchesDate && new Date(doc.createdAt) <= new Date(endDate);
      }

      return (
        matchesSearch &&
        matchesModule &&
        matchesProject &&
        matchesStatus &&
        matchesMinAmt &&
        matchesMaxAmt &&
        matchesCreator &&
        matchesDate
      );
    });
  };

  const getActiveTabDocs = () => {
    switch (activeTab) {
      case "pending":
        return getFilteredDocs(pendingDocs);
      case "processed":
        return getFilteredDocs(processedDocs);
      case "created":
        return getFilteredDocs(createdDocs);
      case "overdue":
        // Overdue simulated as pending documents older than 3 days
        return getFilteredDocs(
          pendingDocs.filter((d) => {
            const age = Date.now() - new Date(d.createdAt).getTime();
            return age > 3 * 24 * 60 * 60 * 1000;
          })
        );
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Bàn Phê Duyệt Kế Toán (Approval Inbox)</h1>
          <p className="text-zinc-500 text-sm mt-1">Xử lý phê duyệt hóa đơn, tạm ứng, quyết toán và chi phí tập trung.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-zinc-200 flex gap-6">
        {[
          { key: "pending", label: "Chờ tôi duyệt" },
          { key: "processed", label: "Tôi đã xử lý" },
          { key: "created", label: "Tôi đã tạo" },
          { key: "overdue", label: "Quá hạn duyệt" },
          { key: "matrix", label: "Permission Matrix" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === tab.key
                ? "text-blue-600 border-blue-600"
                : "text-zinc-500 hover:text-zinc-800 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "matrix" ? (
        <PermissionMatrixView />
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-zinc-100 shadow-xs">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Từ khóa tìm kiếm</label>
              <input
                type="text"
                placeholder="Số chứng từ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Phân hệ</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Tất cả</option>
                <option value="INVOICE">Hóa đơn</option>
                <option value="COST">Chi phí</option>
                <option value="ADVANCE">Tạm ứng</option>
                <option value="SETTLEMENT">Quyết toán</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Người đề xuất</label>
              <input
                type="text"
                placeholder="Họ tên người tạo..."
                value={creatorQuery}
                onChange={(e) => setCreatorQuery(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Khoảng giá trị tối thiểu (VND)</label>
              <input
                type="number"
                placeholder="Ví dụ: 10000000"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-zinc-500 text-sm font-semibold">Đang tải hộp thư...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-medium">
              ⚠ Lỗi: {error}
            </div>
          ) : (
            <ApprovalInboxTable
              documents={getActiveTabDocs()}
              currentUserId={currentUserId}
              onSelect={(doc) => {
                setSelectedDoc(doc);
                setIsDrawerOpen(true);
              }}
              onApprove={handleApprove}
              onRejectClick={handleRejectClick}
            />
          )}
        </div>
      )}

      {/* Drawer & Modal integration */}
      <ApprovalDetailDrawer
        isOpen={isDrawerOpen}
        document={selectedDoc}
        currentUserId={currentUserId}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDoc(null);
        }}
        onApprove={handleApprove}
        onRejectClick={handleRejectClick}
      />

      <RejectReasonModal
        isOpen={isRejectModalOpen}
        docNo={rejectingDoc?.docNo || ""}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectingDoc(null);
        }}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
}
