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

// Owner-or-provider read — mirrors getTextUploadById for any route that looks up
// a file record by ID and needs to authorize both the owning patient and their provider
export async function getFileUploadById(fileUploadId, requesterId) {
    const { data: record, error } = await supabase
        .from("File_Upload")
        .select("File_Upload_ID, S3_Key, File_Name, Patient_UID")
        .eq("File_Upload_ID", fileUploadId)
        .single();

    if (error) throw new Error(error.message);
    if (!record) return null;

    if (record.Patient_UID === requesterId) return record;

    const { data: selection, error: selError } = await supabase
        .from("Provider_Selection")
        .select("Provider_Selection_ID")
        .eq("Patient_UID", record.Patient_UID)
        .eq("Provider_UID", requesterId)
        .maybeSingle();

    if (selError) throw new Error(selError.message);
    if (selection) return record;

    return null;
}

// Owner-only read — used exclusively by the DELETE route, which needs the S3_Key
// to remove the object from S3, and must restrict deletion to the patient only
export async function getFileUploadByIdOwnerOnly(fileUploadId, patientUid) {
    const { data, error } = await supabase
        .from("File_Upload")
        .select("File_Upload_ID, S3_Key, File_Name, Patient_UID")
        .eq("File_Upload_ID", fileUploadId)
        .eq("Patient_UID", patientUid)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function deleteFileUpload(fileUploadId, patientUid) {
    const { error } = await supabase
        .from("File_Upload")
        .delete()
        .eq("File_Upload_ID", fileUploadId)
        .eq("Patient_UID", patientUid);
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

export async function getTextUploadById(textUploadId, requesterId) {
    const { data: record, error } = await supabase
        .from("Text_Upload")
        .select("Text_Content, Upload_Time, Patient_UID")
        .eq("Text_Upload_ID", textUploadId)
        .single();

    if (error) throw new Error(error.message);
    if (!record) return null;

    if (record.Patient_UID === requesterId) return record;

    const { data: selection, error: selError } = await supabase
        .from("Provider_Selection")
        .select("Provider_Selection_ID")
        .eq("Patient_UID", record.Patient_UID)
        .eq("Provider_UID", requesterId)
        .maybeSingle();

    if (selError) throw new Error(selError.message);
    if (selection) return record;

    return null;
}

export async function insertTextUpload(text, patientUid) {
    const { error } = await supabase.rpc("Insert_Text_Upload", {
        p_text_content: text,
        p_patient_uid: patientUid,
    });
    if (error) throw new Error(error.message);
}

export async function deleteTextUpload(textUploadId, patientUid) {
    const { error } = await supabase
        .from("Text_Upload")
        .delete()
        .eq("Text_Upload_ID", textUploadId)
        .eq("Patient_UID", patientUid);
    if (error) throw new Error(error.message);
}