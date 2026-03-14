import { RoleName } from '@/types';

// Define the hierarchy or group access
const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
    admin: ['*'], // Access everything
    receptionist: ['dashboard', 'patients', 'appointments'],
    nurse: ['dashboard', 'patients', 'appointments', 'triage', 'treatment-plans', 'lab'],
    doctor: ['dashboard', 'patients', 'appointments', 'triage', 'treatment-plans', 'lab', 'reports'],
    specialist: ['dashboard', 'patients', 'appointments', 'treatment-plans', 'lab', 'reports'],
    lab_technician: ['dashboard', 'lab'],
    billing_officer: ['dashboard', 'patients', 'reports'],
    compliance_officer: ['dashboard', 'reports', 'compliance'],
    patient: ['dashboard', 'appointments', 'treatment-plans', 'lab'] // Their own subset of data
};

/**
 * Validates if a role has access to a specific resource/route pattern.
 */
export function hasAccess(role: RoleName, resource: string): boolean {
    if (!role) return false;

    const permissions = ROLE_PERMISSIONS[role] || [];

    if (permissions.includes('*')) {
        return true;
    }

    // Exact match or simplified match
    return permissions.includes(resource);
}
