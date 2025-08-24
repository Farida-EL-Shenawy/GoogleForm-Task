import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "@/api/axios";
import { addToast } from "@heroui/toast";
import { jwtDecode } from "jwt-decode"; // npm i jwt-decode

// Normalize API → UI
const normalizeForm = (api) => ({
  id: api.id,
  title: api.title || "",
  description: api.description || "",
  questions: (api.questions || []).map((q) => ({
    id: q.id,
    text: q.questionText || "",
    type: q.questionType || "text", // text | multiple | checkbox | dropdown
    options: q.options || [],
  })),
});

const initialAnswerFor = (q) => (q.type === "checkbox" ? [] : "");

export default function SubmitForm() {
  const { id, code } = useParams(); // supports /forms/:id/respond and /s/:code

  const token = localStorage.getItem("token");
  const userId = useMemo(() => {
    if (!token) return null;
    try {
      const dec = jwtDecode(token);
      return dec?.userId ?? dec?.id ?? dec?.sub ?? null;
    } catch {
      return null;
    }
  }, [token]);

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [step, setStep] = useState(1); // 1 = name (guest), 2 = questions
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userId) setStep(2);
  }, [userId]);

  // Load form by code OR id
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = code
          ? await axiosInstance.get(`/share/${code}`)
          : await axiosInstance.get(`/forms/${id}`);

        const ui = normalizeForm(data);
        if (!alive) return;

        setForm(ui);
        setAnswers(ui.questions.map(initialAnswerFor));
      } catch (e) {
        console.error(e);
        addToast({
          title: "Failed to load form",
          description: e?.response?.data?.message || e?.message || "",
          color: "danger",
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, code]);

  const setAnswerText = (idx, val) =>
    setAnswers((prev) => prev.map((a, i) => (i === idx ? val : a)));
  const setAnswerRadio = (idx, val) => setAnswerText(idx, val);
  const toggleAnswerCheckbox = (idx, opt, checked) =>
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== idx) return a;
        const set = new Set(Array.isArray(a) ? a : []);
        if (checked) set.add(opt);
        else set.delete(opt);
        return Array.from(set);
      })
    );
  const setAnswerDropdown = (idx, val) => setAnswerText(idx, val);

  const start = (e) => {
    e.preventDefault();
    if (userId) return setStep(2);
    if (!guestName.trim()) {
      setError("Please enter your name to continue.");
      return;
    }
    setError("");
    setStep(2);
  };

  const validate = () => {
    if (!form) return false;
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      const a = answers[i];
      if (q.type === "checkbox") {
        if (!Array.isArray(a) || a.length === 0) return false;
      } else {
        if (typeof a !== "string" || a.trim() === "") return false;
      }
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) {
      setError("Please answer all questions.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        responses: answers,
        userId: userId ?? null,
        ...(userId ? {} : { guestName: guestName.trim() }),
      };

      if (code) {
        await axiosInstance.post(`/share/${code}/response`, payload);
      } else {
        await axiosInstance.post(`/forms/${id}/response`, payload);
      }

      setSubmitted(true);
      addToast({ title: "Submitted", color: "success" });
    } catch (e2) {
      console.error(e2);
      setError(
        e2?.response?.data?.message || e2?.response?.data?.error || "Submit failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!form) return <div className="p-6 text-rose-600">Form not found.</div>;

  if (submitted) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-10">
        <div className="rounded-2xl border p-6 text-center">
          <h2 className="text-2xl font-bold">Thanks for your response!</h2>
          <p className="text-gray-600 mt-2">Your answers were submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">{form.title}</h1>
      {form.description && <p className="text-gray-600 mt-1">{form.description}</p>}

      {/* Step 1: guest name */}
      {step === 1 && (
        <form onSubmit={start} className="mt-6 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Your name</label>
            <input
              className={`w-full border rounded-lg p-2 ${error ? "border-rose-500" : "border-gray-300"}`}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Type your name"
              autoFocus
            />
            {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
          </div>
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white" type="submit">
            Start
          </button>
        </form>
      )}

      {/* Step 2: questions */}
      {step === 2 && (
        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {form.questions.map((q, idx) => (
            <div key={q.id ?? idx} className="border rounded-xl p-3">
              <div className="flex items-start justify-between gap-4">
                <label className="font-medium">{`Q${idx + 1}. ${q.text}`}</label>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{q.type}</span>
              </div>

              <div className="mt-3">
                {q.type === "text" && (
                  <input
                    className="w-full border rounded p-2"
                    placeholder="Your answer"
                    value={answers[idx] ?? ""}
                    onChange={(e) => setAnswerText(idx, e.target.value)}
                  />
                )}

                {q.type === "multiple" && (
                  <div className="space-y-1">
                    {(q.options || []).map((opt, j) => (
                      <label key={j} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[idx] === opt}
                          onChange={() => setAnswerRadio(idx, opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "checkbox" && (
                  <div className="space-y-1">
                    {(q.options || []).map((opt, j) => {
                      const chosen = Array.isArray(answers[idx]) && answers[idx].includes(opt);
                      return (
                        <label key={j} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!chosen}
                            onChange={(e) => toggleAnswerCheckbox(idx, opt, e.target.checked)}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.type === "dropdown" && (
                  <select
                    className="border rounded p-2"
                    value={answers[idx] || ""}
                    onChange={(e) => setAnswerDropdown(idx, e.target.value)}
                  >
                    <option value="">Select…</option>
                    {(q.options || []).map((opt, j) => (
                      <option key={j} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
