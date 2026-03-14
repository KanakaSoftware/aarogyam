"use client";

import { useState } from "react";
import { 
    X, 
    Plus, 
    Trash2, 
    AlertCircle, 
    CheckCircle2, 
    Activity,
    Thermometer,
    Heart,
    Zap,
    Loader2
} from "lucide-react";
import clsx from "clsx";

interface RuleEditorModalProps {
    rule?: any;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export function RuleEditorModal({ rule, onClose, onSave }: RuleEditorModalProps) {
    const [formData, setFormData] = useState({
        name: rule?.name || "",
        priority: rule?.priority || "MEDIUM",
        department: rule?.department || "General Medicine",
        is_active: rule?.is_active ?? true,
        conditions: rule?.conditions || [{ type: 'symptom', value: '', operator: 'contains' }]
    });
    const [isSaving, setIsSaving] = useState(false);

    const addCondition = () => {
        setFormData({
            ...formData,
            conditions: [...formData.conditions, { type: 'symptom', value: '', operator: 'contains' }]
        });
    };

    const removeCondition = (index: number) => {
        const newConditions = [...formData.conditions];
        newConditions.splice(index, 1);
        setFormData({ ...formData, conditions: newConditions });
    };

    const updateCondition = (index: number, field: string, value: any) => {
        const newConditions = [...formData.conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setFormData({ ...formData, conditions: newConditions });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                {rule ? "Edit Protocol Rule" : "Create Clinical Protocol"}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                Define assessment logic and routing outcomes
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Protocol Name</label>
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                placeholder="e.g. Acute Chest Pain Response"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Resulting Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm outline-none focus:border-blue-500"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Department</label>
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm outline-none focus:border-blue-500"
                            >
                                <option value="General Medicine">General Medicine</option>
                                <option value="Emergency Care">Emergency Care</option>
                                <option value="Cardiology">Cardiology</option>
                                <option value="Pediatrics">Pediatrics</option>
                            </select>
                        </div>
                    </div>

                    {/* Conditions Logic */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Conditional Logic (AND)</label>
                            <button
                                onClick={addCondition}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:brightness-110 transition-all"
                            >
                                <Plus className="w-3 h-3" /> Add Condition
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.conditions.map((c: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-[24px] border border-slate-100 group">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-slate-400">
                                        {c.type === 'symptom' ? <Activity className="w-4 h-4" /> : <Thermometer className="w-4 h-4" />}
                                    </div>
                                    <select
                                        value={c.type}
                                        onChange={(e) => updateCondition(idx, 'type', e.target.value)}
                                        className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest focus:ring-0 outline-none"
                                    >
                                        <option value="symptom">Symptom</option>
                                        <option value="temperature">Temp</option>
                                        <option value="heart_rate">HR</option>
                                        <option value="pain_scale">Pain</option>
                                    </select>
                                    <div className="h-4 w-px bg-slate-200" />
                                    <input
                                        value={c.value}
                                        onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                                        className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0 outline-none"
                                        placeholder="Value..."
                                    />
                                    <button
                                        onClick={() => removeCondition(idx)}
                                        className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Active Status</span>
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
                        >
                            CANCEL
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            SAVE PROTOCOL
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
