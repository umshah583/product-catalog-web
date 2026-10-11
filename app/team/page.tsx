"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { UserCog, Search, Loader2, ShieldCheck, ShieldOff, UserPlus, Pencil } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { api, type PortalUser } from "@/lib/api"

export default function TeamPage() {
  const [users, setUsers] = useState<PortalUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState<"ADMIN" | "USER">("USER")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit form
  const [editing, setEditing] = useState<PortalUser | null>(null)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editRole, setEditRole] = useState<"ADMIN" | "USER">("USER")
  const [editPassword, setEditPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setUsers(await api.getUsers())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  const createUser = async () => {
    if (!email.trim() || password.length < 6) {
      setCreateError("Email required, password min 6 characters")
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const user = await api.createUser({
        email: email.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        role,
      })
      setUsers((prev) => [user, ...prev])
      setEmail("")
      setPassword("")
      setFirstName("")
      setLastName("")
      setRole("USER")
      setShowCreate(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (u: PortalUser) => {
    setEditing(u)
    setEditFirstName(u.firstName ?? "")
    setEditLastName(u.lastName ?? "")
    setEditRole(u.role)
    setEditPassword("")
    setEditError(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    if (editPassword && editPassword.length < 6) {
      setEditError("Password must be at least 6 characters")
      return
    }
    setSaving(true)
    setEditError(null)
    try {
      await api.updateUser(editing.id, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        role: editRole,
        ...(editPassword ? { password: editPassword } : {}),
      })
      setUsers((prev) =>
        prev.map((x) =>
          x.id === editing.id
            ? { ...x, firstName: editFirstName.trim() || null, lastName: editLastName.trim() || null, role: editRole }
            : x
        )
      )
      setEditing(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u: PortalUser) => {
    setUpdatingId(u.id)
    try {
      await api.setUserActive(u.id, !u.isActive)
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      (u.firstName ?? "").toLowerCase().includes(q) ||
      (u.lastName ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#8b5cf6]/15">
                <UserCog className="h-6 w-6 text-[#8b5cf6]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#f3f4f6]">Team</h1>
                <p className="text-sm text-[#9ca3af]">
                  Admin accounts and salesman app logins
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users…"
                  className="bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg pl-9 pr-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6] w-56"
                />
              </div>
            </div>
          </div>

          {showCreate && (
            <div className="rounded-xl bg-[#1a1b26] border border-[rgba(255,255,255,0.08)] p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#f3f4f6]">New User</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  className="bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  type="password"
                  className="bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
                  className="bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                >
                  <option value="USER">Salesman (app access)</option>
                  <option value="ADMIN">Admin (full portal)</option>
                </select>
              </div>
              {createError && (
                <p className="text-sm text-[#ef4444]">{createError}</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg px-4 py-2 text-sm text-[#9ca3af] hover:text-[#f3f4f6]"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] disabled:opacity-50"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create User
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 px-4 py-3 text-sm text-[#ef4444]">
              {error}
            </div>
          )}

          <div className="rounded-xl bg-[#1a1b26] border border-[rgba(255,255,255,0.08)] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[#8b5cf6]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#9ca3af]">
                <UserCog className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">No users yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[rgba(255,255,255,0.05)] last:border-0 hover:bg-[#21222d]/50"
                    >
                      <td className="px-4 py-3 text-[#f3f4f6] font-medium">
                        {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            u.role === "ADMIN"
                              ? "bg-[#8b5cf6]/15 text-[#8b5cf6]"
                              : "bg-[#3b82f6]/15 text-[#3b82f6]"
                          }`}
                        >
                          {u.role === "ADMIN" ? <ShieldCheck className="h-3 w-3" /> : null}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            u.isActive
                              ? "bg-[#10b981]/15 text-[#10b981]"
                              : "bg-[#6b7280]/15 text-[#6b7280]"
                          }`}
                        >
                          {u.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {updatingId === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#8b5cf6]" />
                          ) : (
                            <>
                            <button
                              onClick={() => openEdit(u)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3b82f6]/15 px-3 py-1.5 text-xs font-medium text-[#3b82f6] hover:bg-[#3b82f6]/25 transition-colors"
                            >
                              <Pencil className="h-3 w-3" />Edit
                            </button>
                            <button
                              onClick={() => toggleActive(u)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                u.isActive
                                  ? "bg-[#ef4444]/15 text-[#ef4444] hover:bg-[#ef4444]/25"
                                  : "bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25"
                              }`}
                            >
                              {u.isActive ? (
                                <><ShieldOff className="h-3 w-3" />Disable</>
                              ) : (
                                <><ShieldCheck className="h-3 w-3" />Enable</>
                              )}
                            </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl bg-[#1a1b26] border border-[rgba(255,255,255,0.08)] p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#f3f4f6]">
                Edit {editing.email}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="First name"
                  className="bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
                <input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Last name"
                  className="bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as "ADMIN" | "USER")}
                className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
              >
                <option value="USER">Salesman (app access)</option>
                <option value="ADMIN">Admin (full portal)</option>
              </select>
              <input
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="New password (leave blank to keep current)"
                type="password"
                className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
              />
              {editError && (
                <p className="text-sm text-[#ef4444]">{editError}</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-lg px-4 py-2 text-sm text-[#9ca3af] hover:text-[#f3f4f6]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
