import { useState } from 'react'
import type { SnackbarState } from '../types'

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    isVisible: false,
    message: ''
  })

  const showSnackbar = (message: string, duration: number = 3000) => {
    setSnackbar({ isVisible: true, message })
    setTimeout(() => {
      setSnackbar({ isVisible: false, message: '' })
    }, duration)
  }

  const hideSnackbar = () => {
    setSnackbar({ isVisible: false, message: '' })
  }

  return {
    snackbar,
    showSnackbar,
    hideSnackbar
  }
} 