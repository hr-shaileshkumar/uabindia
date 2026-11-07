import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  FileText,
  Upload,
  Download,
  Shield,
  GraduationCap,
  Landmark,
  User,
  Plus,
  Filter,
  FileCheck2,
  FolderOpen,
  Briefcase,
  AlertCircle,
  X
} from 'lucide-react'
import { getEmployeeDocuments, uploadEmployeeDocument, getDocumentDownloadUrl } from '../../../api/documents'
import Swal from 'sweetalert2'

const STANDARD_CATEGORIES = [
  { id: 'ALL', label: 'All Documents', icon: FolderOpen, color: 'text-slate-600' },
  { id: 'profile-photo', label: 'Profile & Photos', icon: User, color: 'text-purple-600' },
  { id: 'bank-proof', label: 'Bank & Accounts', icon: Landmark, color: 'text-emerald-600' },
  { id: 'education', label: 'Education & Degrees', icon: GraduationCap, color: 'text-indigo-600' },
  { id: 'kyc', label: 'Identity & KYC (Aadhaar/PAN)', icon: Shield, color: 'text-rose-600' },
  { id: 'experience', label: 'Experience & Career', icon: Briefcase, color: 'text-amber-600' },
]

export default function EmployeeDocuments() {
  const { id: employeeId } = useParams()

  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Upload Form State
  const [uploadCategory, setUploadCategory] = useState('bank-proof')
  const [customCategory, setCustomCategory] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const loadDocs = async () => {
    try {
      setLoading(true)
      const data = await getEmployeeDocuments(employeeId)
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load employee documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (employeeId) {
      loadDocs()
    }
  }, [employeeId])

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    if (selectedCategory === 'ALL') return documents
    return documents.filter(
      (d) => (d.category || '').toLowerCase() === selectedCategory.toLowerCase()
    )
  }, [documents, selectedCategory])

  // Available unique categories from stored documents
  const allCategoryPills = useMemo(() => {
    const existing = new Set(documents.map((d) => (d.category || '').toLowerCase()))
    const standardIds = STANDARD_CATEGORIES.map((c) => c.id.toLowerCase())

    const customTabs = []
    existing.forEach((cat) => {
      if (cat && !standardIds.includes(cat)) {
        customTabs.push({
          id: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '),
          icon: FileCheck2,
          color: 'text-cyan-600'
        })
      }
    })

    return [...STANDARD_CATEGORIES, ...customTabs]
  }, [documents])

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      Swal.fire('Error', 'Please select a file to upload.', 'error')
      return
    }

    const finalCategory =
      uploadCategory === 'custom'
        ? customCategory.trim().toLowerCase().replace(/\s+/g, '-')
        : uploadCategory

    if (!finalCategory) {
      Swal.fire('Error', 'Please specify a document category.', 'error')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('employeeId', employeeId)
      formData.append('module', 'hrms')
      formData.append('category', finalCategory)
      formData.append('description', description)

      await uploadEmployeeDocument(formData)

      Swal.fire('Success', 'Document uploaded and categorized successfully!', 'success')
      setIsUploadOpen(false)
      setSelectedFile(null)
      setDescription('')
      setCustomCategory('')
      setUploadCategory('bank-proof')
      loadDocs()
    } catch (err) {
      console.error('Upload failed:', err)
      Swal.fire('Upload Failed', err?.response?.data?.message || 'Unable to upload document.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const getCategoryBadge = (cat) => {
    const c = (cat || '').toLowerCase()
    if (c === 'bank-proof' || c === 'bank') {
      return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Bank Document</span>
    }
    if (c === 'education') {
      return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Education & Degree</span>
    }
    if (c === 'kyc') {
      return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Identity / KYC</span>
    }
    if (c === 'profile-photo' || c === 'avatar') {
      return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Profile Photo</span>
    }
    if (c === 'experience') {
      return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Career & Experience</span>
    }
    return <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">{cat}</span>
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB'
    const kb = bytes / 1024
    if (kb > 1024) return `${(kb / 1024).toFixed(2)} MB`
    return `${kb.toFixed(1)} KB`
  }

  return (
    <div className="space-y-5 p-4 max-w-7xl mx-auto">
      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="text-purple-600" size={24} />
            <span>Employee Document Vault</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Categorized & encrypted document repository for Employee ID: <span className="font-mono font-bold text-slate-700">{employeeId}</span>
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-sm rounded-xl shadow-md transition-all shrink-0"
        >
          <Upload size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {allCategoryPills.map((tab) => {
          const Icon = tab.icon
          const isActive = selectedCategory.toLowerCase() === tab.id.toLowerCase()
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : tab.color} />
              <span>{tab.label}</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.id === 'ALL'
                  ? documents.length
                  : documents.filter((d) => (d.category || '').toLowerCase() === tab.id.toLowerCase()).length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Document Grid / Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading documents...</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <FolderOpen size={44} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-800">No documents found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            No files have been uploaded under the selected category yet.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <Plus size={14} />
            <span>Upload first document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-purple-600 transition-colors">
                        {doc.fileName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {formatFileSize(doc.fileSizeBytes)} • {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>{getCategoryBadge(doc.category)}</div>

                {doc.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg line-clamp-2">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <a
                  href={getDocumentDownloadUrl(doc.id)}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload size={18} className="text-purple-600" />
                <span>Upload Employee Document</span>
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="bank-proof">Bank Account (Passbook / Cancelled Cheque)</option>
                  <option value="education">Education (Degree / Marksheet / Certificates)</option>
                  <option value="kyc">Identity & KYC (Aadhaar / PAN / Voter ID)</option>
                  <option value="profile-photo">Profile Photo / Avatar</option>
                  <option value="experience">Career & Experience Letter</option>
                  <option value="custom">+ Add New / Custom Document Type</option>
                </select>
              </div>

              {/* Dynamic Custom Category Input */}
              {uploadCategory === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Passport, Driving License, Medical Certificate"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This will create a new isolated document category automatically.
                  </p>
                </div>
              )}

              {/* File Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select File <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer border border-slate-300 rounded-xl p-1.5"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Supported formats: PDF, PNG, JPG, DOCX (Max 10MB)
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank Passbook front page copy"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {uploading ? (
                    <span>Uploading...</span>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload & Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
