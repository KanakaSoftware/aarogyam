import { TriageRule } from '@/types';

export interface TriageInput {
    symptoms: string[];
    vitals: {
        temperature?: number;
        heart_rate?: number;
        bp_sys?: number;
        bp_dia?: number;
    };
    pain_scale?: number;
}

export interface TriageResult {
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    department?: string | null;
    reason: string[];
}

export class TriageEngine {
    private static PRIORITY_WEIGHTS = {
        'LOW': 0,
        'MEDIUM': 1,
        'HIGH': 2,
        'CRITICAL': 3
    };

    /**
     * Evaluate a patient assessment against clinical rules and safety thresholds.
     */
    static evaluate(input: TriageInput, rules: TriageRule[]): TriageResult {
        const reasons: string[] = [];
        let currentPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        let assignedDept: string | null = null;

        // 1. Safety Threshold Check (Vitals Auto-Alerts)
        const safetyResult = this.checkSafetyThresholds(input.vitals);
        if (safetyResult.priority === 'CRITICAL') {
            currentPriority = 'CRITICAL';
            reasons.push(...safetyResult.reasons);
        }

        // 2. Rule Evaluation
        for (const rule of rules) {
            if (!rule.is_active) continue;

            if (this.evaluateRule(input, rule.conditions)) {
                reasons.push(`Rule matched: ${rule.name}`);
                
                // If more severe than current priority, update
                if (this.PRIORITY_WEIGHTS[rule.priority] > this.PRIORITY_WEIGHTS[currentPriority]) {
                    currentPriority = rule.priority;
                    assignedDept = rule.department || assignedDept;
                }
            }
        }

        return {
            priority: currentPriority,
            department: assignedDept,
            reason: reasons.length > 0 ? reasons : ['Routine assessment - no critical indicators found.']
        };
    }

    /**
     * Internal: Evaluate lethal thresholds for vital signs
     */
    private static checkSafetyThresholds(vitals: TriageInput['vitals']): { priority: string; reasons: string[] } {
        const reasons: string[] = [];
        let priority = 'LOW';

        if (vitals.heart_rate) {
            if (vitals.heart_rate > 150 || vitals.heart_rate < 40) {
                priority = 'CRITICAL';
                reasons.push(`Lethal heart rate detected: ${vitals.heart_rate} bpm`);
            }
        }

        if (vitals.bp_sys) {
            if (vitals.bp_sys > 180) {
                priority = 'CRITICAL';
                reasons.push(`Severe hypertension detected: ${vitals.bp_sys} mmHg Systolic`);
            }
        }

        if (vitals.temperature) {
             if (vitals.temperature > 40) {
                priority = 'CRITICAL';
                reasons.push(`Critical hyperthermia detected: ${vitals.temperature}°C`);
             }
        }

        return { priority, reasons };
    }

    /**
     * Internal: Evaluate JSONB conditions
     */
    private static evaluateRule(input: TriageInput, conditions: any): boolean {
        // Evaluate Symptoms
        if (conditions.symptoms && Array.isArray(conditions.symptoms)) {
            const hasMatchedSymptom = conditions.symptoms.some((s: string) => 
                input.symptoms.some(is => is.toLowerCase() === s.toLowerCase())
            );
            if (!hasMatchedSymptom) return false;
        }

        // Evaluate Vitals (gt/lt logic)
        if (conditions.heart_rate) {
            if (!this.evalCondition(input.vitals.heart_rate, conditions.heart_rate)) return false;
        }

        if (conditions.bp_sys) {
            if (!this.evalCondition(input.vitals.bp_sys, conditions.bp_sys)) return false;
        }

        if (conditions.temperature) {
            if (!this.evalCondition(input.vitals.temperature, conditions.temperature)) return false;
        }

        return true;
    }

    private static evalCondition(value: number | undefined, condition: any): boolean {
        if (value === undefined) return false;
        if (typeof condition === 'object') {
            if (condition.gt !== undefined && value <= condition.gt) return false;
            if (condition.lt !== undefined && value >= condition.lt) return false;
            if (condition.eq !== undefined && value !== condition.eq) return false;
        } else if (typeof condition === 'number') {
            if (value !== condition) return false;
        }
        return true;
    }
}
