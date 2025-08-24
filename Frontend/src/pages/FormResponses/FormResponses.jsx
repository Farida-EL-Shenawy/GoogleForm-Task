import React, { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import axiosInstance from '@/api/axios'

const fetchForm = async (id) => (await axiosInstance.get(`/forms/${id}`)).data
const fetchResponses = async (id) => (await axiosInstance.get(`/forms/${id}/responses`)).data

const formatAnswer = (a) => Array.isArray(a) ? a.join(', ') : (a ?? '')

export default function FormResponses() {
  const { id } = useParams()

  const { data: form, isLoading: loadingForm } = useQuery(['form', id], () => fetchForm(id))
  const { data: responses, isLoading: loadingResp } = useQuery(['responses', id], () => fetchResponses(id))

  const loading = loadingForm || loadingResp
  const rows = responses || []

  const questionColumns = useMemo(() => {
    const set = new Set()
    rows.forEach(r => (r.responses || []).forEach(a => set.add(a.question)))
    return Array.from(set)
  }, [rows])

  const onDownloadCSV = () => {
    const headers = ['Response ID', 'Submitted At', 'Responder', 'User ID', ...questionColumns]
    const lines = rows.map(r => {
      const map = new Map((r.responses || []).map(a => [a.question, formatAnswer(a.answer)]))
      const responder = r.guestName ? r.guestName : `User #${r.userId}`
      return [
        r.id,
        new Date(r.createdAt).toISOString(),
        responder,
        r.userId ?? '',
        ...questionColumns.map(q => (map.get(q) ?? ''))
      ]
    })
    const csv = [headers, ...lines]
      .map(arr => arr.map(v => {
        const s = String(v ?? '')
        // escape quotes & commas
        const needsQuotes = /[",\n]/.test(s)
        const escaped = s.replace(/"/g, '""')
        return needsQuotes ? `"${escaped}"` : escaped
      }).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `form-${id}-responses.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-6">Loading…</div>

  if (!form) {
    return <div className="p-6 text-rose-600">Form not found.</div>
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{form.title}</h1>
          {form.description && <p className="text-gray-600 mt-1">{form.description}</p>}
          <p className="text-sm text-gray-500 mt-1">
            {rows.length} {rows.length === 1 ? 'response' : 'responses'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/forms"
            className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200"
          >
            ← Back
          </Link>
          <button
            onClick={onDownloadCSV}
            disabled={rows.length === 0}
            className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            Export CSV
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 border rounded-xl p-6 text-gray-600">No responses yet.</div>
      ) : (
        <div className="mt-6 overflow-auto">
          <table className="min-w-full border rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm">
                <th className="px-3 py-2 border-b">#</th>
                <th className="px-3 py-2 border-b">Submitted</th>
                <th className="px-3 py-2 border-b">Responder</th>
                {questionColumns.map((q) => (
                  <th key={q} className="px-3 py-2 border-b">{q}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.map((r) => {
                const byQuestion = new Map((r.responses || []).map(a => [a.question, a.answer]))
                const responder = r.guestName ? r.guestName : `User #${r.userId}`
                return (
                  <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                    <td className="px-3 py-2 border-b">{r.id}</td>
                    <td className="px-3 py-2 border-b">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 border-b">{responder}</td>
                    {questionColumns.map((q) => (
                      <td key={q} className="px-3 py-2 border-b align-top">
                        {formatAnswer(byQuestion.get(q))}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
