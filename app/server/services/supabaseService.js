import supabase from "../db.js";
import * as cognito from "./cognitoService.js";

// ============================================
// Provider Selection
// ============================================

export async function getProviderSelection(userId) {
    const { data, error } = await supabase.rpc("Get_Provider_Selection", {
        user_id: userId,
    });
    if (error) throw new Error(error.message);
    return data;
}

export async function deleteProviderSelection(patientUid) {
    const { error } = await supabase.rpc("Delete_Provider_Selection", {
        patient_uid: patientUid,
    });
    if (error) throw new Error(error.message);
}

export async function insertProviderSelection(patientUid, providerUid) {
    const { data, error } = await supabase.rpc("Insert_Provider_Selection", {
        patient_uid: patientUid,
        provider_uid: providerUid,
    });
    if (error) throw new Error(error.message);
    return data;
}

export async function getProviderPatients(providerUid) {
    const { data, error } = await supabase.rpc("Get_Provider_Patients", {
        provider_uid: providerUid,
    });
    if (error) throw new Error(error.message);

    return Promise.all(
        (data || []).map(async (row) => {
            try {
                return await cognito.getUserById(row.Patient_UID);
            } catch (err) {
                console.error(`Failed to fetch Cognito data for ${row.Patient_UID}:`, err.message);
                return { patient_uid: row.Patient_UID };
            }
        })
    );
}

// ============================================
// File Uploads
// ============================================

export async function getFileUploads(patientUid) {
    const { data, error } = await supabase.rpc("Get_File_Uploads", {
        p_patient_uid: patientUid,
    });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function insertFileUpload(fileName, s3Key, patientUid) {
    const { error } = await supabase.rpc("Insert_File_Upload", {
        p_file_name: fileName,
        p_s3_key: s3Key,
        p_patient_uid: patientUid,
    });
    if (error) throw new Error(error.message);
}

// ============================================
// Text Uploads
// ============================================

export async function getTextUploads(patientUid) {
    const { data, error } = await supabase.rpc("Get_Text_Uploads", {
        p_patient_uid: patientUid,
    });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function insertTextUpload(text, patientUid) {
    const { error } = await supabase.rpc("Insert_Text_Upload", {
        p_text_content: text,
        p_patient_uid: patientUid,
    });
    if (error) throw new Error(error.message);
}