'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BlueprintItem {
  id: string;
  label: string;
  description?: string;
}

export interface BlueprintSection {
  id: string;
  title: string;
  description?: string;
  items: BlueprintItem[];
}

export interface Subtask {
  id: string;
  blueprint_section_id: string;
  blueprint_section_title: string;
  blueprint_item_id: string;
  blueprint_item_label: string;
  subtask_title: string;
  subtask_description?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  due_date?: string;
  status: 'not_started' | 'in_progress' | 'done';
  sort_order: number;
}

interface AddSubtaskForm {
  sectionId: string;
  itemId: string;
  title: string;
  description: string;
  assignedName: string;
  assignedEmail: string;
  dueDate: string;
}

const STATUS_CONFIG = {
  not_started: {
    label: 'Not Started',
    color: 'text-slate-400',
    bg: 'bg-slate-700/40',
    border: 'border-slate-600',
    dot: 'bg-slate-500',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
    dot: 'bg-blue-400 animate-pulse',
  },
  done: {
    label: 'Done',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/40',
    dot: 'bg-green-400',
  },
};

const EMPTY_FORM: AddSubtaskForm = {
  sectionId: '',
  itemId: '',
  title: '',
  description: '',
  assignedName: '',
  assignedEmail: '',
  dueDate: '',
};

// ── Props ────────────────────────────────────────────────────────────────────

interface ExecutionPlanProps {
  eventId: string;
  vendorId: string;
  bidId?: string;
  blueprint: { sections: BlueprintSection[] } | null;
  accessToken: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ExecutionPlan({
  eventId,
  vendorId,
  bidId,
  blueprint,
  accessToken,
}: ExecutionPlanProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // subtaskId being saved
  const [error, setError] = useState<string | null>(null);

  // which blueprint sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  // which blueprint items have the "add subtask" form open
  const [addingFor, setAddingFor] = useState<{ sectionId: string; itemId: string } | null>(null);
  const [form, setForm] = useState<AddSubtaskForm>(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  const loadSubtasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/execution-plans?event_id=${eventId}&vendor_id=${vendorId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setSubtasks(data.subtasks || []);
      // Auto-expand all sections that have subtasks
      const populated = new Set<string>((data.subtasks || []).map((s: Subtask) => s.blueprint_section_id));
      if (populated.size > 0) setExpandedSections(populated);
      else if (blueprint?.sections?.length) {
        // expand all by default on first use
        setExpandedSections(new Set(blueprint.sections.map(s => s.id)));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, vendorId, blueprint]);

  useEffect(() => { loadSubtasks(); }, [loadSubtasks]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const subtasksFor = (sectionId: string, itemId: string) =>
    subtasks.filter(s => s.blueprint_section_id === sectionId && s.blueprint_item_id === itemId)
      .sort((a, b) => a.sort_order - b.sort_order);

  const sectionProgress = (sectionId: string) => {
    const all = subtasks.filter(s => s.blueprint_section_id === sectionId);
    if (!all.length) return null;
    const done = all.filter(s => s.status === 'done').length;
    return { done, total: all.length, pct: Math.round((done / all.length) * 100) };
  };

  const toggleSection = (id: string) =>
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Status cycle ──────────────────────────────────────────────────────────

  const cycleStatus = async (subtask: Subtask) => {
    const cycle: Subtask['status'][] = ['not_started', 'in_progress', 'done'];
    const next = cycle[(cycle.indexOf(subtask.status) + 1) % cycle.length];
    setSaving(subtask.id);
    try {
      const res = await fetch(`/api/execution-plans/${subtask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Update failed');
      setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, status: next } : s));
    } catch {
      setError('Failed to update status');
    } finally {
      setSaving(null);
    }
  };

  // ── Inline field update ───────────────────────────────────────────────────

  const updateField = async (subtask: Subtask, field: keyof Subtask, value: string) => {
    setSaving(subtask.id);
    try {
      const res = await fetch(`/api/execution-plans/${subtask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error('Update failed');
      setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, [field]: value } : s));
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const deleteSubtask = async (id: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/execution-plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setSubtasks(prev => prev.filter(s => s.id !== id));
    } catch {
      setError('Failed to delete');
    } finally {
      setSaving(null);
    }
  };

  // ── Add subtask ───────────────────────────────────────────────────────────

  const openAddForm = (sectionId: string, sectionTitle: string, itemId: string) => {
    setAddingFor({ sectionId, itemId });
    setForm({ ...EMPTY_FORM, sectionId, itemId });
    // ensure the section is expanded
    setExpandedSections(prev => new Set([...prev, sectionId]));
  };

  const submitSubtask = async (section: BlueprintSection, item: BlueprintItem) => {
    if (!form.title.trim()) return;
    setFormSaving(true);
    try {
      const payload = {
        event_id: eventId,
        vendor_id: vendorId,
        bid_id: bidId || null,
        blueprint_section_id: section.id,
        blueprint_section_title: section.title,
        blueprint_item_id: item.id,
        blueprint_item_label: item.label,
        subtask_title: form.title.trim(),
        subtask_description: form.description.trim() || null,
        assigned_to_name: form.assignedName.trim() || null,
        assigned_to_email: form.assignedEmail.trim() || null,
        due_date: form.dueDate || null,
        sort_order: subtasksFor(section.id, item.id).length,
      };
      const res = await fetch('/api/execution-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setSubtasks(prev => [...prev, data.subtask]);
      setAddingFor(null);
      setForm(EMPTY_FORM);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFormSaving(false);
    }
  };

  // ── Overall stats ─────────────────────────────────────────────────────────

  const totalSubtasks = subtasks.length;
  const doneSubtasks = subtasks.filter(s => s.status === 'done').length;
  const inProgressSubtasks = subtasks.filter(s => s.status === 'in_progress').length;
  const overallPct = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <ArrowPathIcon className="w-8 h-8 text-orange-400 animate-spin mr-3" />
        <p className="text-slate-400">Loading execution plan...</p>
      </div>
    );
  }

  const sections = blueprint?.sections || [];

  return (
    <div className="space-y-6">

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-sm font-semibold">Execution Plan setup required</p>
            <button onClick={() => setError(null)} className="ml-auto text-amber-400 hover:text-amber-300 text-xs">Dismiss</button>
          </div>
          {(error.includes('execution_plans') || error.includes('schema cache') || error.includes('not found')) ? (
            <div className="pl-8 space-y-2">
              <p className="text-slate-400 text-xs">The execution plans database table hasn&apos;t been created yet. Run this SQL in your <a href="https://supabase.com/dashboard/project/ikfawcbcapmfpzwbqccr/sql/new" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Supabase SQL Editor</a>:</p>
              <pre className="bg-slate-900 rounded-lg p-3 text-xs text-green-300 overflow-x-auto whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS execution_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  blueprint_section_id TEXT NOT NULL,
  blueprint_section_title TEXT NOT NULL DEFAULT '',
  blueprint_item_id TEXT NOT NULL,
  blueprint_item_label TEXT NOT NULL DEFAULT '',
  subtask_title TEXT NOT NULL,
  subtask_description TEXT,
  assigned_to_name TEXT,
  assigned_to_email TEXT,
  assigned_subcontractor_id UUID,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','done')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exec_plans_event_vendor
  ON execution_plans(event_id, vendor_id);
ALTER TABLE execution_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY exec_plans_vendor_select ON execution_plans FOR SELECT USING (
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
CREATE POLICY exec_plans_vendor_insert ON execution_plans FOR INSERT WITH CHECK (
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
CREATE POLICY exec_plans_vendor_update ON execution_plans FOR UPDATE USING (
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
CREATE POLICY exec_plans_vendor_delete ON execution_plans FOR DELETE USING (
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));`}
              </pre>
            </div>
          ) : (
            <p className="text-red-300 text-xs pl-8">{error}</p>
          )}
        </div>
      )}

      {/* ── Overall progress bar ── */}
      {totalSubtasks > 0 && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-white font-semibold">Overall Progress</h3>
              <p className="text-slate-400 text-sm mt-0.5">
                {doneSubtasks} of {totalSubtasks} subtasks complete
                {inProgressSubtasks > 0 && ` · ${inProgressSubtasks} in progress`}
              </p>
            </div>
            <span className={`text-3xl font-bold ${overallPct === 100 ? 'text-green-400' : 'text-orange-400'}`}>
              {overallPct}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${overallPct === 100 ? 'bg-green-400' : 'bg-gradient-to-r from-orange-500 to-orange-400'}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── No blueprint message ── */}
      {sections.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No blueprint available for this event yet.</p>
        </div>
      )}

      {/* ── Blueprint sections ── */}
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const prog = sectionProgress(section.id);

        return (
          <div key={section.id} className="rounded-2xl border border-slate-700/50 overflow-hidden">

            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${prog?.pct === 100 ? 'bg-green-400' : prog ? 'bg-orange-400' : 'bg-slate-600'}`} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">{section.title}</h3>
                  {section.description && (
                    <p className="text-xs text-slate-500 truncate">{section.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                {prog && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-1.5 hidden sm:block">
                      <div
                        className={`h-1.5 rounded-full ${prog.pct === 100 ? 'bg-green-400' : 'bg-orange-400'}`}
                        style={{ width: `${prog.pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{prog.done}/{prog.total}</span>
                  </div>
                )}
                {isExpanded
                  ? <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                  : <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                }
              </div>
            </button>

            {/* Section body */}
            {isExpanded && (
              <div className="bg-slate-900/40 divide-y divide-slate-800/60">
                {section.items.map((item, itemIdx) => {
                  const itemSubtasks = subtasksFor(section.id, item.id);
                  const isAddingHere = addingFor?.sectionId === section.id && addingFor?.itemId === item.id;
                  const itemDone = itemSubtasks.filter(s => s.status === 'done').length;

                  return (
                    <div key={item.id} className="px-4 sm:px-6 py-4">

                      {/* Blueprint item row — the "parent node" */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Connector line visual */}
                        <div className="flex flex-col items-center flex-shrink-0 mt-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500/70 border border-orange-400" />
                          {(itemSubtasks.length > 0 || isAddingHere) && (
                            <div className="w-0.5 bg-orange-500/20 flex-1 mt-1" style={{ minHeight: 16 }} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-200 leading-snug">{item.label}</p>
                              {item.description && item.description !== item.label && (
                                <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {itemSubtasks.length > 0 && (
                                <span className="text-xs text-slate-500">
                                  {itemDone}/{itemSubtasks.length} done
                                </span>
                              )}
                              <button
                                onClick={() => isAddingHere ? setAddingFor(null) : openAddForm(section.id, section.title, item.id)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  isAddingHere
                                    ? 'bg-slate-700 text-slate-300'
                                    : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30'
                                }`}
                              >
                                <PlusIcon className="w-3 h-3" />
                                {isAddingHere ? 'Cancel' : 'Add Subtask'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subtasks tree */}
                      {itemSubtasks.length > 0 && (
                        <div className="ml-5 pl-4 border-l-2 border-slate-700/50 space-y-2 mb-3">
                          {itemSubtasks.map((subtask) => {
                            const sc = STATUS_CONFIG[subtask.status];
                            const isSavingThis = saving === subtask.id;

                            return (
                              <div
                                key={subtask.id}
                                className={`rounded-xl border p-3 transition-all ${sc.bg} ${sc.border} ${isSavingThis ? 'opacity-60' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Status toggle button */}
                                  <button
                                    onClick={() => cycleStatus(subtask)}
                                    disabled={isSavingThis}
                                    title={`Status: ${sc.label} — click to advance`}
                                    className="flex-shrink-0 mt-0.5"
                                  >
                                    {subtask.status === 'done'
                                      ? <CheckCircleSolid className="w-5 h-5 text-green-400" />
                                      : <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${subtask.status === 'in_progress' ? 'border-blue-400' : 'border-slate-500'}`}>
                                          <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                                        </div>
                                    }
                                  </button>

                                  <div className="flex-1 min-w-0 space-y-2">
                                    {/* Title (editable inline) */}
                                    <input
                                      defaultValue={subtask.subtask_title}
                                      onBlur={(e) => {
                                        if (e.target.value !== subtask.subtask_title)
                                          updateField(subtask, 'subtask_title', e.target.value);
                                      }}
                                      className={`w-full bg-transparent text-sm font-medium text-white border-b border-transparent hover:border-slate-600 focus:border-orange-500 focus:outline-none pb-0.5 transition-colors ${subtask.status === 'done' ? 'line-through text-slate-500' : ''}`}
                                    />

                                    {/* Meta row */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                      {/* Status badge */}
                                      <span className={`px-2 py-0.5 rounded-full font-medium ${sc.color} bg-slate-800/50`}>
                                        {sc.label}
                                      </span>

                                      {/* Assignee */}
                                      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                                        <UserCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                        <input
                                          defaultValue={subtask.assigned_to_name || ''}
                                          placeholder="Assign to..."
                                          onBlur={(e) => {
                                            if (e.target.value !== (subtask.assigned_to_name || ''))
                                              updateField(subtask, 'assigned_to_name', e.target.value);
                                          }}
                                          className="bg-transparent text-slate-400 placeholder-slate-600 border-b border-transparent hover:border-slate-600 focus:border-orange-500 focus:outline-none w-28 transition-colors"
                                        />
                                      </div>

                                      {/* Due date */}
                                      <div className="flex items-center gap-1.5 text-slate-400">
                                        <CalendarDaysIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                        <input
                                          type="date"
                                          defaultValue={subtask.due_date || ''}
                                          onBlur={(e) => {
                                            if (e.target.value !== (subtask.due_date || ''))
                                              updateField(subtask, 'due_date', e.target.value);
                                          }}
                                          className="bg-transparent text-slate-400 border-b border-transparent hover:border-slate-600 focus:border-orange-500 focus:outline-none transition-colors"
                                        />
                                      </div>
                                    </div>

                                    {/* Description (if present) */}
                                    {subtask.subtask_description && (
                                      <p className="text-xs text-slate-500 leading-relaxed">{subtask.subtask_description}</p>
                                    )}
                                  </div>

                                  {/* Delete */}
                                  <button
                                    onClick={() => deleteSubtask(subtask.id)}
                                    disabled={isSavingThis}
                                    className="flex-shrink-0 p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add subtask form */}
                      {isAddingHere && (
                        <div className="ml-5 pl-4 border-l-2 border-orange-500/30">
                          <div className="bg-slate-800/80 border border-orange-500/20 rounded-xl p-4 space-y-3">
                            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">New Subtask</p>

                            <input
                              type="text"
                              value={form.title}
                              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                              placeholder="Subtask title *"
                              autoFocus
                              className="w-full bg-slate-700 text-white text-sm px-3 py-2 rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none placeholder-slate-500"
                            />

                            <textarea
                              value={form.description}
                              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                              placeholder="Description (optional)"
                              rows={2}
                              className="w-full bg-slate-700 text-white text-sm px-3 py-2 rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none placeholder-slate-500 resize-none"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="relative">
                                <UserCircleIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                  type="text"
                                  value={form.assignedName}
                                  onChange={e => setForm(f => ({ ...f, assignedName: e.target.value }))}
                                  placeholder="Assign to (name)"
                                  className="w-full bg-slate-700 text-white text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none placeholder-slate-500"
                                />
                              </div>
                              <div className="relative">
                                <CalendarDaysIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                  type="date"
                                  value={form.dueDate}
                                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                                  className="w-full bg-slate-700 text-white text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => { setAddingFor(null); setForm(EMPTY_FORM); }}
                                className="px-4 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => submitSubtask(section, item)}
                                disabled={!form.title.trim() || formSaving}
                                className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                {formSaving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                                Add Subtask
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Empty state ── */}
      {sections.length > 0 && totalSubtasks === 0 && (
        <div className="text-center py-10 text-slate-500">
          <PlusIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-400">No subtasks yet</p>
          <p className="text-sm mt-1">Click <span className="text-orange-400">+ Add Subtask</span> on any blueprint item above to start breaking down the work.</p>
        </div>
      )}

    </div>
  );
}
