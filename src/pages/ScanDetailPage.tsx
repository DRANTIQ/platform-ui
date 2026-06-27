import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useScanPolling } from "../hooks/useScanPolling";
import {
  getScanCompliance,
  getScanTimeline,
  listAssets,
  listFindings,
} from "../lib/api";
import {
  controlStatusTone,
  formatDate,
  isTerminalStatus,
  severityTone,
} from "../lib/format";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Asset, ControlResult, Finding, TimelineEvent } from "../types/platform";

type Tab = "overview" | "findings" | "assets" | "compliance" | "timeline";

export function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const { authHeaders } = useAuth();
  const { scan, error: pollError, loading: pollLoading } = useScanPolling(authHeaders, scanId);
  const [tab, setTab] = useState<Tab>("overview");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [controls, setControls] = useState<ControlResult[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [assetQuery, setAssetQuery] = useState("");
  const [findingFilter, setFindingFilter] = useState<"all" | "fail">("fail");
  const [loadError, setLoadError] = useState<string | null>(null);

  const terminal = scan ? isTerminalStatus(scan.status) : false;

  useEffect(() => {
    if (!scanId || !terminal) return;
    let cancelled = false;

    async function loadDetails() {
      try {
        const [f, a, comp, tl] = await Promise.all([
          listFindings(authHeaders, scanId!),
          listAssets(authHeaders, scanId!),
          getScanCompliance(authHeaders, scanId!),
          getScanTimeline(authHeaders, scanId!),
        ]);
        if (cancelled) return;
        setFindings(f);
        setAssets(a);
        setControls(comp.controls);
        setScore(comp.score);
        setTimeline(tl);
        setLoadError(null);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load scan data");
      }
    }

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, scanId, terminal]);

  useEffect(() => {
    if (!scanId || !terminal || tab !== "assets") return;
    if (!assetQuery.trim()) {
      listAssets(authHeaders, scanId).then(setAssets).catch(() => undefined);
      return;
    }
    const t = window.setTimeout(() => {
      listAssets(authHeaders, scanId, { q: assetQuery.trim() }).then(setAssets).catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(t);
  }, [authHeaders, scanId, terminal, tab, assetQuery]);

  if (pollLoading && !scan) {
    return <p className="text-slate-500">Loading scan…</p>;
  }

  if (pollError || !scan) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {pollError || "Scan not found"}
      </div>
    );
  }

  const visibleFindings =
    findingFilter === "fail" ? findings.filter((f) => f.result === "fail") : findings;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "findings", label: `Findings (${findings.filter((f) => f.result === "fail").length})` },
    { id: "assets", label: `Assets (${assets.length})` },
    { id: "compliance", label: "CIS controls" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/scans" className="text-sm text-indigo-600 hover:underline">
          ← Scans
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-semibold text-slate-900">{scan.id}</h1>
          <StatusBadge status={scan.status} />
          {!terminal && (
            <span className="text-xs text-blue-600 animate-pulse">Updating…</span>
          )}
        </div>
      </div>

      {loadError && terminal && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="CIS score" value={score != null ? `${score.toFixed(1)}%` : terminal ? "—" : "…"} />
          <Stat label="Failed findings" value={String(findings.filter((f) => f.result === "fail").length)} />
          <Stat label="Assets" value={String(assets.length)} />
          <Stat label="Account" value={scan.account_id ?? "—"} mono />
          <div className="sm:col-span-2">
            <Stat label="Started" value={formatDate(scan.started_at)} />
          </div>
          <div className="sm:col-span-2">
            <Stat label="Completed" value={formatDate(scan.completed_at)} />
          </div>
        </div>
      )}

      {tab === "findings" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <FilterBtn active={findingFilter === "fail"} onClick={() => setFindingFilter("fail")}>
              Failures only
            </FilterBtn>
            <FilterBtn active={findingFilter === "all"} onClick={() => setFindingFilter("all")}>
              All results
            </FilterBtn>
          </div>
          <DataTable
            empty="No findings"
            headers={["Policy", "Resource", "Severity", "Title"]}
            rows={visibleFindings.map((f) => [
              f.policy_id,
              <span key={f.id} className="font-mono text-xs">{f.resource_id.split("/").pop()}</span>,
              <span key={`${f.id}-s`} className={`rounded px-1.5 py-0.5 text-xs ${severityTone(f.severity)}`}>{f.severity}</span>,
              f.title,
            ])}
          />
        </div>
      )}

      {tab === "assets" && (
        <div className="space-y-4">
          <input
            type="search"
            placeholder="Search assets…"
            value={assetQuery}
            onChange={(e) => setAssetQuery(e.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <DataTable
            empty="No assets"
            headers={["Type", "Resource ID", "Region", "Account"]}
            rows={assets.map((a) => [
              a.resource_type,
              <span key={a.resource_id} className="font-mono text-xs">{a.resource_id}</span>,
              a.region ?? "—",
              a.account_id,
            ])}
          />
        </div>
      )}

      {tab === "compliance" && (
        <DataTable
          empty="No compliance results"
          headers={["Control", "Domain", "Status", "Title"]}
          rows={controls.map((c) => [
            c.control_id,
            c.domain ?? "—",
            <span key={c.control_id} className={`font-medium ${controlStatusTone(c.status)}`}>{c.status}</span>,
            c.title,
          ])}
        />
      )}

      {tab === "timeline" && (
        <ol className="space-y-3">
          {timeline.length === 0 && <li className="text-slate-400">No events yet</li>}
          {timeline.map((ev, i) => (
            <li key={i} className="flex gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
              <span className="shrink-0 text-xs text-slate-400">{formatDate(ev.at as string)}</span>
              <span className="font-mono text-slate-800">{String(ev.stage)}</span>
              {ev.status && <StatusBadge status={String(ev.status)} />}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold text-slate-900 ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm ${
        active ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: ReactNode[][];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-slate-400">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
