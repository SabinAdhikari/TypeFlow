import { useState, useEffect } from "react";
import { Shield, Users, FileText, Trophy, Plus, Trash2, AlertCircle, CheckCircle2, Ban, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";
import type { Profile, Passage } from "@/lib/types";

export function AdminPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<"overview" | "users" | "passages">("overview");
  const [users, setUsers] = useState<Profile[]>([]);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, totalTests: 0, totalPassages: 0, avgWpm: 0 });
  const [loading, setLoading] = useState(true);
  const [newPassage, setNewPassage] = useState({ content: "", difficulty: "medium", category: "sentences" });
  const [actionMsg, setActionMsg] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  useEffect(() => {
    if (!profile?.is_admin) {
      setLoading(false);
      return;
    }
    loadData();
  }, [profile]);

  const loadData = async () => {
    const [usersRes, passagesRes, testsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("passages").select("*").order("created_at", { ascending: false }),
      supabase.from("test_results").select("wpm"),
    ]);

    setUsers(usersRes.data as Profile[] || []);
    setPassages(passagesRes.data as Passage[] || []);
    const tests = testsRes.data || [];
    const avgWpm = tests.length > 0 ? Math.round(tests.reduce((s, t) => s + Number(t.wpm), 0) / tests.length) : 0;

    setPlatformStats({
      totalUsers: usersRes.data?.length || 0,
      totalTests: tests.length,
      totalPassages: passagesRes.data?.length || 0,
      avgWpm,
    });
    setLoading(false);
  };

  if (!profile?.is_admin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
        <h2 className="text-xl font-semibold mb-2">Admin access required</h2>
        <p className="text-slate-500 dark:text-slate-400">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  const toggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !currentlySuspended })
      .eq("id", userId);
    if (error) {
      setActionMsg({ type: "error", msg: error.message });
    } else {
      setActionMsg({ type: "success", msg: `User ${currentlySuspended ? "unsuspended" : "suspended"} successfully` });
      loadData();
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const addPassage = async () => {
    if (newPassage.content.trim().length < 10) {
      setActionMsg({ type: "error", msg: "Passage content must be at least 10 characters" });
      return;
    }
    const { error } = await supabase.from("passages").insert({
      content: newPassage.content.trim(),
      difficulty: newPassage.difficulty,
      category: newPassage.category,
    });
    if (error) {
      setActionMsg({ type: "error", msg: error.message });
    } else {
      setActionMsg({ type: "success", msg: "Passage added successfully" });
      setNewPassage({ content: "", difficulty: "medium", category: "sentences" });
      loadData();
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const deletePassage = async (id: string) => {
    const { error } = await supabase.from("passages").delete().eq("id", id);
    if (error) {
      setActionMsg({ type: "error", msg: error.message });
    } else {
      setActionMsg({ type: "success", msg: "Passage deleted" });
      loadData();
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const statCards = [
    { label: "Total Users", value: platformStats.totalUsers, icon: Users, color: "text-brand-500" },
    { label: "Total Tests", value: platformStats.totalTests, icon: Trophy, color: "text-amber-500" },
    { label: "Passages", value: platformStats.totalPassages, icon: FileText, color: "text-emerald-500" },
    { label: "Avg WPM", value: platformStats.avgWpm, icon: Trophy, color: "text-slate-600 dark:text-slate-400" },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage the platform</p>
        </div>
      </div>

      {actionMsg && (
        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg mb-4 ${
          actionMsg.type === "error" ? "text-rose-500 bg-rose-500/10" : "text-emerald-500 bg-emerald-500/10"
        }`}>
          {actionMsg.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {actionMsg.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: "overview" as const, label: "Overview", icon: Trophy },
          { key: "users" as const, label: "Users", icon: Users },
          { key: "passages" as const, label: "Passages", icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === key ? "bg-brand-500 text-white" : "glass-card hover:scale-105"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="stat-card">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar username={u.username} avatarUrl={u.avatar_url} size="md" />
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {u.username}
                    {u.is_admin && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">Admin</span>}
                    {u.is_suspended && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">Suspended</span>}
                  </div>
                  <div className="text-xs text-slate-400">Joined {new Date(u.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              {u.id !== profile.id && (
                <button
                  onClick={() => toggleSuspend(u.id, u.is_suspended)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    u.is_suspended
                      ? "text-emerald-500 hover:bg-emerald-500/10"
                      : "text-rose-500 hover:bg-rose-500/10"
                  }`}
                >
                  {u.is_suspended ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  {u.is_suspended ? "Unsuspend" : "Suspend"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Passages */}
      {tab === "passages" && (
        <div className="space-y-4">
          {/* Add new passage */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New Passage
            </h3>
            <textarea
              value={newPassage.content}
              onChange={(e) => setNewPassage({ ...newPassage, content: e.target.value })}
              className="input-field resize-none mb-3"
              placeholder="Enter typing passage text..."
              rows={3}
            />
            <div className="flex flex-wrap gap-3 mb-3">
              <select
                value={newPassage.difficulty}
                onChange={(e) => setNewPassage({ ...newPassage, difficulty: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
              <select
                value={newPassage.category}
                onChange={(e) => setNewPassage({ ...newPassage, category: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 outline-none"
              >
                <option value="words">Words</option>
                <option value="sentences">Sentences</option>
                <option value="quotes">Quotes</option>
                <option value="programming">Programming</option>
              </select>
              <button onClick={addPassage} className="btn-primary text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Passage
              </button>
            </div>
          </div>

          {/* Existing passages */}
          <div className="space-y-2">
            {passages.map((p) => (
              <div key={p.id} className="glass-card p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate">{p.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 capitalize">{p.difficulty}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 capitalize">{p.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => deletePassage(p.id)}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
