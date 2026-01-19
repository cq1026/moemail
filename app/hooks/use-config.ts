"use client"

import { create } from "zustand"
import { Role, ROLES } from "@/lib/permissions"
import { EMAIL_CONFIG } from "@/config"
import { useEffect, useRef } from "react"

interface Config {
  defaultRole: Exclude<Role, typeof ROLES.EMPEROR>
  emailDomains: string
  emailDomainsArray: string[]
  adminContact: string
  maxEmails: number
  registrationDisabled: boolean
}

interface ConfigStore {
  config: Config | null
  loading: boolean
  error: string | null
  fetched: boolean
  fetch: () => Promise<void>
}

const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  loading: false,
  error: null,
  fetched: false,
  fetch: async () => {
    if (get().fetched || get().loading) return
    try {
      set({ loading: true, error: null })
      const res = await fetch("/api/config")
      if (!res.ok) throw new Error("获取配置失败")
      const data = await res.json() as Config & { registrationDisabled?: boolean }
      set({
        config: {
          defaultRole: data.defaultRole || ROLES.CIVILIAN,
          emailDomains: data.emailDomains,
          emailDomainsArray: data.emailDomains.split(','),
          adminContact: data.adminContact || "",
          maxEmails: Number(data.maxEmails) || EMAIL_CONFIG.MAX_ACTIVE_EMAILS,
          registrationDisabled: data.registrationDisabled ?? false
        },
        loading: false,
        fetched: true
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "获取配置失败",
        loading: false,
        fetched: true
      })
    }
  }
}))

export function useConfig() {
  const store = useConfigStore()
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!fetchedRef.current && !store.fetched && !store.loading) {
      fetchedRef.current = true
      store.fetch()
    }
  }, [store.fetched, store.loading, store.fetch])

  return store
}
