import { z } from "zod";

export const createPatientSchema = z.object({
    name: z.string().min(1, "Patient name is required").max(200),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.string().min(1, "Gender is required"),
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().email("Please enter a valid email").or(z.literal("")),
    insurance_details: z.string().optional(),
    status: z.enum(["active", "critical", "discharged"]),
    assigned_doctor: z.string().optional(),
    condition: z.string().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial();
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const patientSearchSchema = z.object({
    search: z.string().optional(),
    dob: z.string().optional(),
    patientId: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});

export type PatientSearchInput = z.infer<typeof patientSearchSchema>;

export const intakeSchema = z.object({
    symptoms: z.string().min(1, "Symptoms are required"),
    vitals: z.object({
        weight: z.string().optional(),
        hr: z.string().optional(),
        bp: z.string().optional(),
        temp: z.string().optional(),
        resp: z.string().optional(),
        spo2: z.string().optional(),
    }).optional(),
    status: z.enum(["in_progress", "completed", "critical"]),
});

export type IntakeInput = z.infer<typeof intakeSchema>;
