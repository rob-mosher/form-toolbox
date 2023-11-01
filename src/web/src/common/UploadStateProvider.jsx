/* eslint-disable import/prefer-default-export */
import {
  createContext, useMemo, useRef, useState
} from 'react'

export const UploadStateContext = createContext()

export function UploadStateProvider({ children }) {
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadToast, setUploadToast] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value = {
    isUploading,
    uploadFile,
    uploadToast,
    setIsUploading,
    setUploadFile,
    setUploadToast,
  }

  return (
    <UploadStateContext.Provider value={value}>
      {children}
    </UploadStateContext.Provider>
  )
}
