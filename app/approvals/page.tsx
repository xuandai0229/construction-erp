"use client";

import React, { useState, useEffect } from "react";
import EnterpriseAppShell from "@/app/components/layout/EnterpriseAppShell";
import EnterpriseHeader from "@/app/components/layout/EnterpriseHeader";
import EnterprisePageContainer from "@/app/components/layout/EnterprisePageContainer";
import PermissionMatrixView from "../components/approvals/PermissionMatrixView";
import { ApprovalInboxTable } from "../components/approvals/ApprovalInboxTable";
import { ApprovalDetailDrawer } from "../components/approvals/ApprovalDetailDrawer";
import { RejectReasonModal } from "../components/approvals/RejectReasonModal";
import { 
  EnterpriseLoadingState, 
  EnterpriseErrorState,
  EnterpriseTabs
} from "@/app/components/ui-enterprise";

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
    <EnterpriseAppShell activeItem="approvals">
      <EnterpriseHeader
        title="BÀN PHÊ DUYỆT PHÒNG KẾ TOÁN"
        subtitle="Xử lý phê duyệt hóa đơn, tạm ứng, quyết toán và chi phí tập trung theo luồng nghiệp vụ liên kết"
      />
      <EnterprisePageContainer>
        {/* Standardized Tabs */}
        <EnterpriseTabs
          tabs={[
            { id: "pending", label: "Chờ tôi duyệt" },
            { id: "processed", label: "Tôi đã xử lý" },
            { id: "created", label: "Tôi đã tạo" },
            { id: "overdue", label: "Quá hạn duyệt" },
            { id: "matrix", label: "Luồng phân quyền" }
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as any)}
        />

        {activeTab === "matrix" ? (
          <PermissionMatrixView />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-[var(--card)] rounded-xl border border-[var(--border)] text-xs text-[var(--text-primary)]">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Từ khóa tìm kiếm
                </label>
                <input
                  type="text"
                  placeholder="Số chứng từ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[38px] px-3 border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Phân hệ
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full h-[38px] px-3 border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] outline-none"
                >
                  <option value="">Tất cả</option>
                  <option value="INVOICE">Hóa đơn</option>
                  <option value="COST">Chi phí</option>
                  <option value="ADVANCE">Tạm ứng</option>
                  <option value="SETTLEMENT">Quyết toán</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Người đề xuất
                </label>
                <input
                  type="text"
                  placeholder="Họ tên người tạo..."
                  value={creatorQuery}
                  onChange={(e) => setCreatorQuery(e.target.value)}
                  className="w-full h-[38px] px-3 border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Khoảng giá trị tối thiểu (VND)
                </label>
                <input
                  type="number"
                  placeholder="Ví dụ: 10000000"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full h-[38px] px-3 border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] font-mono outline-none"
                />
              </div>
            </div>

            {loading ? (
              <EnterpriseLoadingState message="Đang tải hộp thư phê duyệt..." />
            ) : error ? (
              <EnterpriseErrorState 
                title="Lỗi tải dữ liệu" 
                description={error} 
                onRetry={fetchInboxData} 
              />
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
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}
