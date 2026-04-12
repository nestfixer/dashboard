"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

const PRESET_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6", "#f97316", "#14b8a6",
]

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
      <h2 className="text-xl font-semibold text-gray-900">Profile &amp; Settings</h2>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile</h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Color</label>
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
                className="w-7 h-7 rounded cursor-pointer border border-gray-300"
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
            <p className={`text-xs ${profileMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {profileMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {profileSaving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              minLength={6}
            />
          </div>

          {passwordMsg && (
            <p className={`text-xs ${passwordMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {passwordMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={passwordSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {passwordSaving ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  )
}
