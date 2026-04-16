"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

const PRESET_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6", "#f97316", "#14b8a6",
]

interface ApiKey {
  id: number
  name: string
  keyPrefix: string
  permissions: string[]
  lastUsedAt: string | null
  createdAt: string
}

function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(["read"])
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetch("/api/api-keys")
      .then((r) => r.json())
      .then(setKeys)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setMsg(null)
    setRevealedKey(null)
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, permissions: newKeyPermissions }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: "error", text: data.error ?? "Failed to create key" })
      } else {
        setRevealedKey(data.key)
        setNewKeyName("")
        setKeys((prev) => [
          { id: data.id, name: data.name, keyPrefix: data.keyPrefix, permissions: data.permissions, lastUsedAt: null, createdAt: data.createdAt },
          ...prev,
        ])
        setMsg({ type: "success", text: "API key created — copy it now, it won't be shown again." })
      }
    } catch {
      setMsg({ type: "error", text: "Something went wrong" })
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(id: number) {
    if (!confirm("Revoke this API key? Any integration using it will stop working.")) return
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" })
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id))
    }
  }

  function togglePermission(perm: string) {
    setNewKeyPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-sm font-semibold text-foreground mb-1">API Keys</h3>
      <p className="text-xs text-muted mb-4">Use API keys to authenticate external integrations with <code className="bg-muted/20 px-1 rounded">/api/v1/</code> endpoints.</p>

      {/* Create form */}
      <form onSubmit={createKey} className="space-y-3 mb-6 pb-6 border-b border-border">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Key name (e.g. Zapier integration)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
            required
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">Permissions:</span>
          {(["read", "write", "webhooks"] as const).map((perm) => (
            <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={newKeyPermissions.includes(perm)}
                onChange={() => togglePermission(perm)}
                className="rounded"
              />
              <span className="text-xs text-foreground capitalize">{perm}</span>
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {creating ? "Creating…" : "Create API Key"}
        </button>
      </form>

      {/* One-time key reveal */}
      {revealedKey && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="text-xs font-medium text-green-400 mb-1">Copy your new API key — it won&apos;t be shown again:</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-green-300 break-all flex-1">{revealedKey}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(revealedKey); setMsg({ type: "success", text: "Copied!" }) }}
              className="shrink-0 px-2 py-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={`text-xs mb-4 ${msg.type === "success" ? "text-green-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}

      {/* Key list */}
      {loading ? (
        <p className="text-xs text-muted">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-xs text-muted">No API keys yet.</p>
      ) : (
        <ul className="space-y-3">
          {keys.map((key) => (
            <li key={key.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{key.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-xs text-muted">{key.keyPrefix}…</code>
                  <span className="text-xs text-muted">·</span>
                  <span className="text-xs text-muted">{key.permissions.join(", ")}</span>
                  {key.lastUsedAt && (
                    <>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs text-muted">last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => revokeKey(key.id)}
                className="shrink-0 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()

  const [displayName, setDisplayName] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.displayName) setDisplayName(data.displayName)
        if (data.color) setColor(data.color)
      })
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, color }),
      })
      if (!res.ok) {
        const err = await res.json()
        setProfileMsg({ type: "error", text: err.error ?? "Failed to save" })
      } else {
        await updateSession({ name: displayName, color })
        setProfileMsg({ type: "success", text: "Profile updated" })
      }
    } catch {
      setProfileMsg({ type: "error", text: "Something went wrong" })
    } finally {
      setProfileSaving(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" })
      return
    }
    setPasswordSaving(true)
    setPasswordMsg(null)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const err = await res.json()
        setPasswordMsg({ type: "error", text: err.error ?? "Failed to update password" })
      } else {
        setPasswordMsg({ type: "success", text: "Password updated" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Something went wrong" })
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-8">
      <h2 className="text-xl font-semibold text-foreground">Profile &amp; Settings</h2>

      {/* Profile */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Profile</h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-2">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#1e293b" : "transparent",
                    transform: color === c ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-border"
                title="Custom color"
              />
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ml-2"
                style={{ backgroundColor: color }}
              >
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            </div>
          </div>

          {profileMsg && (
            <p className={`text-xs ${profileMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {profileMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {profileSaving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Change Password</h3>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
              required
              minLength={6}
            />
          </div>

          {passwordMsg && (
            <p className={`text-xs ${passwordMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {passwordMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={passwordSaving}
            className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {passwordSaving ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* API Keys */}
      <ApiKeysSection />
    </div>
  )
}
