import React, { useEffect, useMemo, useState } from 'react'
import axiosInstance from '@/api/axios'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { addToast } from '@heroui/toast'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

const fromApi = apiForm => ({
  id: apiForm.id ?? apiForm._id,
  title: apiForm.title ?? '',
  description: apiForm.description ?? '',
  questions: (apiForm.questions || []).map(q => ({
    id: q.id ?? q._id,
    text: q.questionText ?? '',
    type: q.questionType ?? 'text',
    options: q.options ?? []
  }))
})

const toApi = uiForm => ({
  title: uiForm.title,
  description: uiForm.description,
  questions: (uiForm.questions || []).map(q => {
    if (q.type === 'text') {
      return { text: q.text, type: 'text' }
    }
    return {
      text: q.text,
      type: q.type,
      options: (q.options || []).filter(o => o && o.trim() !== '')
    }
  })
})

const FormsAPI = {
  list: async () => {
    const { data } = await axiosInstance.get(`/forms`)
    return data
  },
  getById: async id => {
    const { data } = await axiosInstance.get(`/forms/${id}`)
    return data
  },
  create: async payload => {
    const { data } = await axiosInstance.post(`/forms`, payload)
    return data
  },
  update: async ({ id, payload }) => {
    const { data } = await axiosInstance.patch(`/forms/${id}`, payload)
    return data
  },
  remove: async id => {
    const { data } = await axiosInstance.delete(`/forms/${id}`)
    return data
  },
  share: async (id, options = {}) => {
    const { data } = await axiosInstance.post(`/forms/${id}/share`, options)
    return data
  }
}

const TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'multiple', label: 'Multiple choice (single)' },
  { value: 'checkbox', label: 'Checkboxes (multi)' },
  { value: 'dropdown', label: 'Dropdown' }
]

const emptyQuestion = () => ({ text: '', type: 'text', options: [''] })
const emptyForm = () => ({
  title: '',
  description: '',
  questions: [emptyQuestion()]
})

function FormModal ({ open, mode, initialData, onClose, onSubmit }) {
  const readOnly = mode === 'view'
  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    if (!open) return
    if (!initialData) {
      setForm(emptyForm())
      return
    }
    const ui = initialData.questions
      ? fromApi(initialData)
      : {
          id: initialData.id,
          title: initialData.title,
          description: initialData.description,
          questions: [emptyQuestion()]
        }
    setForm(ui)
  }, [open, initialData])

  const updateField = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updateQuestion = (idx, patch) =>
    setForm(p => ({
      ...p,
      questions: p.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    }))
  const addQuestion = () =>
    setForm(p => ({ ...p, questions: [...p.questions, emptyQuestion()] }))
  const removeQuestion = idx =>
    setForm(p => ({ ...p, questions: p.questions.filter((_, i) => i !== idx) }))

  const setOption = (qIdx, optIdx, val) =>
    setForm(p => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i !== qIdx
          ? q
          : {
              ...q,
              options: (q.options || []).map((o, j) => (j === optIdx ? val : o))
            }
      )
    }))
  const addOption = qIdx =>
    setForm(p => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i !== qIdx ? q : { ...q, options: [...(q.options || []), ''] }
      )
    }))
  const removeOption = (qIdx, optIdx) =>
    setForm(p => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i !== qIdx
          ? q
          : { ...q, options: (q.options || []).filter((_, j) => j !== optIdx) }
      )
    }))

  const handleSubmit = e => {
    e.preventDefault()
    if (readOnly) return
    onSubmit?.(toApi(form), form.id)
  }

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50'>
      <div className='absolute inset-0 bg-black/50' onClick={onClose} />
      <div className='absolute inset-0 flex items-center justify-center p-4'>
        <div className='w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden'>
          <div className='flex items-center justify-between p-4 border-b'>
            <h3 className='text-lg font-semibold'>
              {mode === 'create' && 'Create Form'}
              {mode === 'edit' && 'Update Form'}
              {mode === 'view' && 'Form Details'}
            </h3>
            <button
              className='px-3 py-1 rounded-lg bg-gray-100'
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className='p-4 overflow-y-auto max-h-[72vh] space-y-4'
          >
            <div>
              <label className='block text-sm font-medium mb-1'>Title</label>
              <input
                className='w-full border rounded-lg p-2'
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                required
                disabled={readOnly}
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Description
              </label>
              <textarea
                className='w-full border rounded-lg p-2'
                rows={3}
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                disabled={readOnly}
              />
            </div>

            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h4 className='font-semibold'>Questions</h4>
                {!readOnly && (
                  <button
                    type='button'
                    onClick={addQuestion}
                    className='px-3 py-1 rounded bg-blue-600 text-white'
                  >
                    + Add Question
                  </button>
                )}
              </div>

              {form.questions.map((q, idx) => (
                <div key={idx} className='border rounded-xl p-3 space-y-2'>
                  <div className='flex gap-3'>
                    <div className='flex-1'>
                      <label className='block text-sm font-medium mb-1'>
                        Question Text
                      </label>
                      <input
                        className='w-full border rounded p-2'
                        value={q.text}
                        onChange={e =>
                          updateQuestion(idx, { text: e.target.value })
                        }
                        disabled={readOnly}
                        required
                      />
                    </div>
                    <div className='w-56'>
                      <label className='block text-sm font-medium mb-1'>
                        Type
                      </label>
                      <select
                        className='w-full border rounded p-2'
                        value={q.type}
                        onChange={e =>
                          updateQuestion(idx, {
                            type: e.target.value,
                            options: [
                              'multiple',
                              'checkbox',
                              'dropdown'
                            ].includes(e.target.value)
                              ? q.options?.length
                                ? q.options
                                : ['']
                              : []
                          })
                        }
                        disabled={readOnly}
                      >
                        {TYPES.map(t => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {['multiple', 'checkbox', 'dropdown'].includes(q.type) && (
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>Options</span>
                        {!readOnly && (
                          <button
                            type='button'
                            onClick={() => addOption(idx)}
                            className='px-2 py-1 text-xs rounded bg-gray-100'
                          >
                            + Add option
                          </button>
                        )}
                      </div>

                      {(q.options || []).map((opt, j) => (
                        <div key={j} className='flex items-center gap-2'>
                          <input
                            className='flex-1 border rounded p-2'
                            value={opt}
                            onChange={e => setOption(idx, j, e.target.value)}
                            disabled={readOnly}
                            required
                          />
                          {!readOnly && (
                            <button
                              type='button'
                              onClick={() => removeOption(idx, j)}
                              className='px-2 py-1 text-xs rounded bg-rose-50 text-rose-700'
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!readOnly && form.questions.length > 1 && (
                    <div>
                      <button
                        type='button'
                        onClick={() => removeQuestion(idx)}
                        className='px-3 py-1 text-xs rounded bg-rose-600 text-white'
                      >
                        Delete Question
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!readOnly && (
              <div className='flex justify-end'>
                <button
                  type='submit'
                  className='px-4 py-2 rounded bg-blue-600 text-white'
                >
                  {mode === 'create' ? 'Create Form' : 'Update Form'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default function FormsList () {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selected, setSelected] = useState(null)
  const [sharingId, setSharingId] = useState(null)
  const nav = useNavigate()

  const { data: forms, isLoading } = useQuery(['forms'], FormsAPI.list)

  const createMutation = useMutation(FormsAPI.create, {
    onSuccess: () => {
      addToast({ title: 'Form created', color: 'success' })
      qc.invalidateQueries(['forms'])
      setModalOpen(false)
    },
    onError: e =>
      addToast({
        title: 'Create failed',
        description: e?.response?.data || '',
        color: 'danger'
      })
  })

  const updateMutation = useMutation(FormsAPI.update, {
    onSuccess: () => {
      addToast({ title: 'Form updated', color: 'success' })
      qc.invalidateQueries(['forms'])
      setModalOpen(false)
    },
    onError: e =>
      addToast({
        title: 'Update failed',
        description: e?.response?.data || '',
        color: 'danger'
      })
  })

  const deleteMutation = useMutation(FormsAPI.remove, {
    onSuccess: () => {
      addToast({ title: 'Form deleted', color: 'success' })
      qc.invalidateQueries(['forms'])
    },
    onError: e =>
      addToast({
        title: 'Delete failed',
        description: e?.response?.data || '',
        color: 'danger'
      })
  })

  const copyText = async text => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      addToast({
        title: 'Link copied',
        description: 'Paste it into another window or sent it to others',
        color: 'success'
      })
    } catch {
      addToast({ title: 'Copy failed', color: 'danger' })
    }
  }

  const shareMutation = useMutation(
    ({ id, options }) => FormsAPI.share(id, options),
    {
      onSuccess: data => {
        const url =
          data?.shareUrl ||
          (data?.code ? `${window.location.origin}/s/${data.code}` : '')
        if (url) copyText(url)
        setSharingId(null)
      },
      onError: e => {
        addToast({
          title: 'Could not create share link',
          description: e?.response?.data?.message || e?.message || '',
          color: 'danger'
        })
        setSharingId(null)
      }
    }
  )

  const onShare = id => {
    setSharingId(id)
    shareMutation.mutate({ id, options: {} })
  }

  const openCreate = () => {
    setSelected(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const openView = async row => {
    const id = row.id ?? row._id
    const full = await FormsAPI.getById(id)
    setSelected(full)
    setModalMode('view')
    setModalOpen(true)
  }

  const openEdit = async row => {
    const id = row.id ?? row._id
    const full = await FormsAPI.getById(id)
    setSelected(full)
    setModalMode('edit')
    setModalOpen(true)
  }

  const onSubmitModal = (payload, id) => {
    if (modalMode === 'create') createMutation.mutate(payload)
    else updateMutation.mutate({ id: selected?.id ?? id, payload })
  }

  const onDelete = row => {
    const id = row.id ?? row._id
    if (!id) return
    deleteMutation.mutate(id)
  }

  const logOut = () => {
    localStorage.removeItem('token')
    nav('/login')
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-bold'>Forms</h2>
        <div className='flex items-center gap-3'>
          <button
            className='px-4 py-2 rounded bg-blue-600 text-white'
            onClick={openCreate}
          >
            + New Form
          </button>
          <button
            className='px-4 py-2 rounded bg-red-600 text-white'
            onClick={logOut}
          >
            Logout
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className='p-6'>Loading…</div>
      ) : (forms || []).length === 0 ? (
        <div className='p-6 border rounded-xl text-gray-600'>
          No forms yet. Create your first one.
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
          {forms.map(f => (
            <div key={f.id} className='border rounded-2xl p-4 hover:shadow-sm'>
              <h3 className='font-semibold text-lg'>{f.title}</h3>
              <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
                {f.description}
              </p>

              <div className='flex gap-2 mt-4'>
                <button
                  className='px-3 py-1.5 text-sm rounded bg-gray-100'
                  onClick={() => openView(f)}
                >
                  View
                </button>
                <button
                  className='px-3 py-1.5 text-sm rounded bg-amber-500 text-white'
                  onClick={() => openEdit(f)}
                >
                  Edit
                </button>
                <button
                  className='px-3 py-1.5 text-sm rounded bg-rose-600 text-white'
                  onClick={() => onDelete(f)}
                >
                  Delete
                </button>
                <button
                  className='px-3 py-1.5 text-sm rounded bg-blue-600 text-white disabled:opacity-60'
                  onClick={() => onShare(f.id)}
                  disabled={sharingId === f.id && shareMutation.isLoading}
                  title='Generate a guest link and copy it'
                >
                  {sharingId === f.id && shareMutation.isLoading
                    ? 'Sharing…'
                    : 'Share link'}
                </button>
                <Link
                  to={`/forms/${f.id}/responses`}
                  target='__blank'
                  className='px-3 py-1.5 text-sm rounded bg-green-600 text-white'
                >
                  Responses
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal
        open={modalOpen}
        mode={modalMode}
        initialData={selected}
        onClose={() => setModalOpen(false)}
        onSubmit={onSubmitModal}
      />
    </div>
  )
}
