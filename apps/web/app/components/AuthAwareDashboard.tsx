"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { LumaUserDashboard } from "./LumaUserDashboard"

export function AuthAwareDashboard() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    async function loadAndSync() {
      if (status === "authenticated") {
        try {
          // Fetch from cloud
          const res = await fetch("/api/profile")
          const cloudProfile = await res.json()

          // Check if there is local profile
          const localStr = localStorage.getItem("lumalang.session.v1")
          let localProfile = null
          if (localStr) {
            try {
              localProfile = JSON.parse(localStr)
            } catch (e) {}
          }

          if (localProfile && !cloudProfile.userId) {
            // Found local profile but no cloud profile -> SYNC to cloud
            // console.log("Syncing local profile to cloud...")
            await fetch("/api/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(localProfile)
            })
            // Clear local storage after successful sync
            localStorage.removeItem("lumalang.session.v1")
            setProfile(localProfile)
          } else if (cloudProfile.userId) {
            // Has cloud profile -> load it
            setProfile(cloudProfile.data)
            // also sync it to local storage for LumaUserDashboard to pick up
            localStorage.setItem("lumalang.session.v1", JSON.stringify(cloudProfile.data))
          }
        } catch (e) {
          console.error("Error syncing profile", e)
        }
      }
      setLoading(false)
    }

    loadAndSync()
  }, [status])

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return <LumaUserDashboard />
}
