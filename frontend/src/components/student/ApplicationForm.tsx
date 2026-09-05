"use client";





import Image from "next/image";


import Link from "next/link";


import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";


import { API_BASE_URL } from "@/lib/api";


import { DocumentUpload } from "./DocumentUpload";





type StepStatus = "complete" | "current" | "todo";





const STEPS = [


  { id: 0, label: "Personal" },


  { id: 1, label: "Contact" },


  { id: 2, label: "Academic" },


  { id: 3, label: "Family" },


  { id: 4, label: "Documents" },


  { id: 5, label: "Review" },


  { id: 6, label: "Payment" },


] as const;





type AcademicType = "" | "school" | "college";



type FamilyStatus = "PARENTS" | "SINGLE_PARENT" | "NO_PARENTS";





// Convert DD/MM/YYYY to YYYY-MM-DD for API


function toApiDate(ddMmYyyy: string): string {


  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddMmYyyy.trim());


  if (!m) return "";


  const day = Number(m[1]);


  const month = Number(m[2]);


  const year = Number(m[3]);


  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) return "";


  const d = new Date(year, month - 1, day);


  if (d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== year) return "";


  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


}





// Convert YYYY-MM-DD (API) to DD/MM/YYYY for display


function toDisplayDate(yyyyMmDd: string): string {


  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(yyyyMmDd || "");


  if (!m) return "";


  return `${m[3]}/${m[2]}/${m[1]}`;


}





// Validate DD/MM/YYYY format and return error message or null


function validateDob(ddMmYyyy: string): string | null {


  if (!ddMmYyyy.trim()) return "Please enter your date of birth.";


  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(ddMmYyyy.trim())) return "Enter date in DD/MM/YYYY format.";


  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddMmYyyy.trim());


  if (!m) return "Enter date in DD/MM/YYYY format.";


  const day = Number(m[1]);


  const month = Number(m[2]);


  const year = Number(m[3]);


  const today = new Date();


  const currentYear = today.getFullYear();


  if (year < 1900 || year > currentYear) return "Enter a valid year between 1900 and " + currentYear + ".";


  const d = new Date(year, month - 1, day);


  if (d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== year) return "Invalid date (e.g., 31/02/2000).";


  if (d > today) return "Date of birth cannot be in the future.";


  return null;


}





type FormData = {


  certificateName: string;


  bankRecordName: string;


  dateOfBirth: string;


  gender: string;


  phone: string;


  doorNumber: string;


  street: string;


  city: string;


  district: string;


  state: string;


  pinCode: string;


  guardianName: string;


  relationship: string;


  occupation: string;


  contactNumber: string;


  familyStatus: FamilyStatus;


  parent2Name: string;


  parent2Relationship: string;


  isSingleParent: boolean;


  academicType: AcademicType;


  schoolName: string;


  className: string;


  section: string;


  collegeName: string;


  course: string;


  semester: string;


  ugPg: string;


  academicYear: string;


  familyIncome: string;


  incomeSource: string;


};





const EMPTY_FORM: FormData = {


  certificateName: "",


  bankRecordName: "",


  dateOfBirth: "",


  gender: "",


  phone: "",


  doorNumber: "",


  street: "",


  city: "",


  district: "",


  state: "",


  pinCode: "",


  guardianName: "",


  relationship: "",


  occupation: "",


  contactNumber: "",


  familyStatus: "PARENTS",


  parent2Name: "",


  parent2Relationship: "",


  isSingleParent: false,


  academicType: "",


  schoolName: "",


  className: "",


  section: "",


  collegeName: "",


  course: "",


  semester: "",


  ugPg: "",


  academicYear: "",


  familyIncome: "",


  incomeSource: "",


};





type Errors = Partial<Record<keyof FormData, string>>;





type LoadedApplication = {


  id: string;


  status: string;


  applicationId: string;


  personalDetails?: {


    fullName?: string | null;


    bankRecordName?: string | null;


    dateOfBirth?: string | Date | null;


    gender?: string | null;


    phone?: string | null;


    idProofNumber?: string | null;


  } | null;


  address?: {


    street?: string | null;


    doorNumber?: string | null;


    city?: string | null;


    district?: string | null;


    state?: string | null;


    pinCode?: string | null;


  } | null;


  parentGuardian?: {


    guardianName?: string | null;


    relationship?: string | null;


    occupation?: string | null;


    contactNumber?: string | null;


    isSingleParent?: boolean | null;


    income?: number | null;


    parent2Name?: string | null;


    parent2Relationship?: string | null;


  } | null;


  academicDetails?: {


    schoolCollege?: string | null;


    academicType?: string | null;


    course?: string | null;


    educationLevel?: string | null;


    academicYear?: string | null;


    yearOfStudy?: string | null;


    className?: string | null;


    section?: string | null;


    semester?: string | null;


    ugPg?: string | null;


    marksPercentageCGPA?: string | null;


  } | null;


  financialDetails?: {


    familyIncome?: number | null;


    incomeSource?: string | null;


  } | null;


};





const PIN_RX = /^[0-9]{6}$/;


const PHONE_RX = /^[6-9][0-9]{9}$/;





function classifyStep(stepIndex: number, currentStep: number): StepStatus {


  if (stepIndex < currentStep) return "complete";


  if (stepIndex === currentStep) return "current";


  return "todo";


}





export function ApplicationForm() {


  const [form, setForm] = useState<FormData>(EMPTY_FORM);


  const [errors, setErrors] = useState<Errors>({});


  const [currentStep, setCurrentStep] = useState(0);





  // API wiring state


  const [applicationId, setApplicationId] = useState<string | null>(null);


  const [appEditingId, setAppEditingId] = useState<string | null>(null);


  const [saving, setSaving] = useState(false);


  const [submitting, setSubmitting] = useState(false);


  const [formNotice, setFormNotice] = useState<{ type: "error" | "info" | "success"; text: string } | null>(null);


  const [showDeclaration, setShowDeclaration] = useState(false);


  const [declarationError, setDeclarationError] = useState<string | null>(null);





  // Success state


  const [submittedRef, setSubmittedRef] = useState<string | null>(null);


  const [initialLoading, setInitialLoading] = useState(true);





  // Uploaded document count (from DocumentUpload)


  const [docCount, setDocCount] = useState(0);





  // Payment state


  const [fee, setFee] = useState<{


    amount: number;


    enabled: boolean;


    currency: string;


    paymentMethod?: "manual_upi" | "razorpay";


    upi?: { qrUrl: string; vpa: string; instructions: string; qrConfigured?: boolean };


  } | null>(null);


  const [paymentStatus, setPaymentStatus] = useState<"NO_PAYMENT" | "NOT_SUBMITTED" | "PENDING" | "PENDING_VERIFICATION" | "VERIFIED" | "SUCCESS" | "REJECTED" | "FAILED">("NO_PAYMENT");


  const [paymentNotice, setPaymentNotice] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);


  const [paymentRef, setPaymentRef] = useState<{ paymentId?: string | null; amount?: number | null; txnId?: string | null; verifiedNote?: string | null; verifiedAt?: string | null } | null>(null);


  const [upiTxnId, setUpiTxnId] = useState("");


  const [txnError, setTxnError] = useState<string | null>(null);


  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);


  const [submittedPayment, setSubmittedPayment] = useState<{ status: string; txnId?: string; amount?: number | null } | null>(null);


  const [paymentScreenshot, setPaymentScreenshot] = useState<{ name: string; mime: string; uploadedAt?: string | null } | null>(null);


  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);


  const [screenshotUploading, setScreenshotUploading] = useState(false);


  const [screenshotError, setScreenshotError] = useState<string | null>(null);





  // Try to resume an existing draft


  useEffect(() => {


    fetch(`${API_BASE_URL}/api/applications/me`, { credentials: "include" })


      .then((r) => r.json())


      .then((data: { application?: LoadedApplication | null }) => {


        const app = data.application;


        if (!app) return;


        if (app.status === "DRAFT") {


          setApplicationId(app.applicationId);


          setAppEditingId(app.id);


          const pd = app.personalDetails || {};


          const ad = app.address || {};


          const pg = app.parentGuardian || {};


          const ac = app.academicDetails || {};


          const fin = app.financialDetails || {};


          setForm((f) => ({


            ...f,


            certificateName: pd.fullName || "",


            bankRecordName: pd.bankRecordName || "",


            dateOfBirth: pd.dateOfBirth ? toDisplayDate(String(pd.dateOfBirth)) : "",


            gender: pd.gender || "",


            phone: pd.phone || "",


            doorNumber: ad.doorNumber || "",


            street: ad.street || "",


            city: ad.city || "",


            district: ad.district || "",


            state: ad.state || "",


            pinCode: ad.pinCode || "",


            guardianName: pg.guardianName || "",


            relationship: pg.relationship || "",


            occupation: pg.occupation || "",


            contactNumber: pg.contactNumber || "",


            familyStatus: pg.isSingleParent ? "SINGLE_PARENT" : (pg as any).parent2Name ? "NO_PARENTS" : "PARENTS",


            isSingleParent: pg.isSingleParent || false,


            parent2Name: (pg as any).parent2Name || "",


            parent2Relationship: (pg as any).parent2Relationship || "",


            collegeName: ac.schoolCollege || "",


            schoolName: ac.schoolCollege || "",


            className: ac.className || "",


            section: ac.section || "",


            course: ac.course || "",


            semester: ac.semester || "",


            ugPg: ac.ugPg || "",


            academicYear: ac.academicYear || "",


            familyIncome: fin.familyIncome != null ? String(fin.familyIncome) : "",


            incomeSource: fin.incomeSource || "",


          }));


        }


      })


      .catch(() => {


        /* not authenticated or no application */


      })


      .finally(() => setInitialLoading(false));


  }, []);





  // Load current application fee config and existing payment status.


  useEffect(() => {


    if (!applicationId || !appEditingId) return;


    let alive = true;


    fetch(`${API_BASE_URL}/api/application-fee`, { cache: "no-store" })


      .then((r) => (r.ok ? r.json() : null))


      .then((d) => {


        if (alive && d) setFee(d);


      })


      .catch(() => {});


    fetch(`${API_BASE_URL}/api/payments/application/${encodeURIComponent(applicationId)}`, {


      credentials: "include",


    })


      .then((r) => (r.ok ? r.json() : null))


      .then((d) => {


        if (alive && d && d.status !== "NO_PAYMENT") {


          setPaymentStatus(d.status);


          setPaymentRef({


            paymentId: d.paymentId,


            amount: d.amount != null ? Number(d.amount) : null,


            txnId: d.razorpayPaymentId,


            verifiedNote: d.verificationNote,


            verifiedAt: d.verifiedAt,


          });


          if (d.razorpayPaymentId) setUpiTxnId(String(d.razorpayPaymentId));


          setPaymentScreenshot(d.screenshot || null);


          if (d.status === "VERIFIED" || d.status === "SUCCESS") setShowPaymentConfirm(true);


        }


      })


      .catch(() => {});


    return () => {


      alive = false;


    };


  }, [applicationId, appEditingId]);





  const set = useCallback(


    (key: keyof FormData, value: string | boolean) => {


      setForm((f) => ({ ...f, [key]: value }));


      if (errors[key]) {


        setErrors((e) => ({ ...e, [key]: undefined }));


      }


    },


    [errors]


  );








  const chooseFamilyStatus = useCallback((status: FamilyStatus) => {


    setForm((f) => ({


      ...f,


      familyStatus: status,


      isSingleParent: status === "SINGLE_PARENT",


      familyIncome: status === "NO_PARENTS" ? "" : f.familyIncome,


      incomeSource: status === "NO_PARENTS" ? "" : f.incomeSource,


    }));


    setErrors({});


  }, []);





  const validateStep = useCallback((step: number, data: FormData): Errors => {


    const e: Errors = {};


    if (step === 0) {


      if (!data.certificateName.trim()) e.certificateName = "Please enter your name (as per the certificate).";


      const dobErr = validateDob(data.dateOfBirth);


      if (dobErr) e.dateOfBirth = dobErr;


      if (!data.gender) e.gender = "Please select your gender.";


      if (!data.phone.trim()) e.phone = "Please enter your phone number.";


      else if (!PHONE_RX.test(data.phone.trim())) e.phone = "Please enter a valid 10-digit mobile number.";


    }


    if (step === 1) {


      if (!data.street.trim()) e.street = "Please enter your street address.";


      if (!data.city.trim()) e.city = "Please enter your city.";


      if (!data.district.trim()) e.district = "Please enter your district.";


      if (!data.state) e.state = "Please select your state.";


      if (!data.pinCode.trim()) e.pinCode = "Please enter your PIN code.";


      else if (!PIN_RX.test(data.pinCode.trim())) e.pinCode = "Please enter a valid 6-digit PIN code.";


    }


    if (step === 2) {


      if (data.academicType === "school") {


        if (!data.schoolName.trim()) e.schoolName = "Please enter your school name.";


        if (!data.academicYear.trim()) e.academicYear = "Please enter your academic year.";


      } else if (data.academicType === "college") {


        if (!data.collegeName.trim()) e.collegeName = "Please enter your college name.";


        if (!data.course.trim()) e.course = "Please enter your course.";


        if (!data.academicYear.trim()) e.academicYear = "Please enter your academic year.";


      } else {


        e.academicType = "Please select whether you are a School or College student.";


      }


    }


    if (step === 3) {


      if (data.familyStatus === "NO_PARENTS") {


        if (!data.guardianName.trim()) e.guardianName = "Please enter parent 1 name.";


        if (!data.relationship) e.relationship = "Please select parent 1 relationship.";


        if (!data.parent2Name.trim()) e.parent2Name = "Please enter parent 2 name.";


        if (!data.parent2Relationship) e.parent2Relationship = "Please select parent 2 relationship.";


      } else {


        if (!data.guardianName.trim()) e.guardianName = "Please enter your parent/guardian name.";


        if (!data.relationship) e.relationship = "Please select the relationship.";


        if (!data.familyIncome.trim()) e.familyIncome = "Please enter the family annual income.";


        else if (Number(data.familyIncome) < 0) e.familyIncome = "Family annual income cannot be negative.";


        if (!data.incomeSource) e.incomeSource = "Please select the income source.";


      }


    }


    return e;


  }, []);





  const goBack = useCallback(() => {


    setFormNotice(null);


    setErrors({});


    setCurrentStep((s) => Math.max(s - 1, 0));


    window.scrollTo({ top: 0, behavior: "smooth" });


  }, []);





  const buildAcademicPayload = useCallback((data: FormData) => {


    const isSchool = data.academicType === "school";


    const schoolCollege = isSchool ? data.schoolName : data.collegeName;


    return {


      academicType: data.academicType,


      schoolCollege,


      course: isSchool ? "" : data.course,


      educationLevel: isSchool ? "HIGH_SCHOOL" : "UNDERGRADUATE",


      academicYear: data.academicYear,


      className: isSchool ? data.className : "",


      section: isSchool ? data.section : "",


      semester: isSchool ? "" : data.semester,


      ugPg: isSchool ? "" : data.ugPg,


      yearOfStudy: isSchool ? data.className : data.semester,


      marksPercentageCGPA: "",


    };


  }, []);





  // Save draft (create or update) then move next


  const saveAndContinue = useCallback(async () => {


    const e = validateStep(currentStep, form);


    if (Object.keys(e).length > 0) {


      setErrors(e);


      setFormNotice({ type: "error", text: "Please correct the highlighted fields before continuing." });


      return;


    }


    setErrors({});


    setFormNotice(null);


    setSaving(true);


    try {


      const payload = {


        personalDetails: {


          fullName: form.certificateName,


          bankRecordName: form.bankRecordName,


          dateOfBirth: toApiDate(form.dateOfBirth),


          gender: form.gender,


          phone: form.phone,


        },


        address: {


          doorNumber: form.doorNumber,


          street: form.street,


          city: form.city,


          district: form.district,


          state: form.state,


          pinCode: form.pinCode,


        },


        parentGuardian: {


          guardianName: form.guardianName,


          relationship: form.relationship,


          occupation: form.occupation,


          contactNumber: form.contactNumber,


          isSingleParent: form.familyStatus === "SINGLE_PARENT",


          parent2Name: form.familyStatus === "NO_PARENTS" ? form.parent2Name : "",


          parent2Relationship: form.familyStatus === "NO_PARENTS" ? form.parent2Relationship : "",


        },


        academicDetails: buildAcademicPayload(form),


        financialDetails: form.familyStatus === "NO_PARENTS" ? null : {


          familyIncome: form.familyIncome ? Number(form.familyIncome) : undefined,


          incomeSource: form.incomeSource,


        },


      };





      let nextApplicationId = applicationId;


      let nextAppId = appEditingId;





      if (appEditingId && applicationId) {


        // PATCH existing draft


        const res = await fetch(`${API_BASE_URL}/api/applications/${appEditingId}`, {


          method: "PATCH",


          headers: { "Content-Type": "application/json" },


          credentials: "include",


          body: JSON.stringify(payload),


        });


        if (!res.ok) {


          const data = await res.json().catch(() => ({}));


          throw new Error(data.error || "Could not save your application.");


        }


      } else {


        // Create new draft


        const res = await fetch(`${API_BASE_URL}/api/applications/`, {


          method: "POST",


          headers: { "Content-Type": "application/json" },


          credentials: "include",


          body: JSON.stringify(payload),


        });


        const data = await res.json().catch(() => ({}));


        if (!res.ok) {


          if (res.status === 401) {


            throw new Error("Please log in to save your application.");


          }


          if (res.status === 409 && data.applicationId) {


            // Already have an application; switch to edit mode


            nextApplicationId = data.applicationId;


            setFormNotice({ type: "info", text: "You already have an application. We have resumed it for you — please review and submit." });


            // fetch the app id


            const meRes = await fetch(`${API_BASE_URL}/api/applications/me`, { credentials: "include" });


            const meData = await meRes.json();


            nextAppId = meData.application?.id || null;


          } else {


            throw new Error(data.error || "Could not save your application.");


          }


        } else {


          nextApplicationId = data.application?.applicationId || null;


          nextAppId = data.application?.id || null;


        }


      }





      setApplicationId(nextApplicationId);


      setAppEditingId(nextAppId);


      setCurrentStep((s) => Math.min(s + 1, 5));


      window.scrollTo({ top: 0, behavior: "smooth" });


    } catch (err) {


      setFormNotice({ type: "error", text: err instanceof Error ? err.message : "Could not save your application." });


    } finally {


      setSaving(false);


    }


  }, [currentStep, form, validateStep, applicationId, appEditingId, buildAcademicPayload]);





  const goToStep = useCallback((step: number) => {


    setFormNotice(null);


    setErrors({});


    setCurrentStep(step);


    window.scrollTo({ top: 0, behavior: "smooth" });


  }, []);




// Payment flow. The fee, UPI QR code and scan-and-pay instructions are shown
  // directly on the payment step from the admin-configured application fee. The
  // applicant enters their UPI transaction reference (UTR) and confirms before


  // submitting; the backend then stores the reference with status
  // PENDING_VERIFICATION for admin review.


  // When Razorpay is added (paymentMethod === "razorpay"), the same step switches
  // to the checkout flow while the fee stays admin-controlled.


  const paymentVerified = paymentStatus === "VERIFIED" || paymentStatus === "SUCCESS";


  const effectivePaymentStatus = submittedPayment?.status || paymentStatus;


  // Automatically send applicants to the dashboard shortly after submitting with
  // a payment that is awaiting verification.
  useEffect(() => {
    if (submittedRef && effectivePaymentStatus === "PENDING_VERIFICATION") {
      const timer = window.setTimeout(() => {
        window.location.href = "/student/dashboard";
      }, 3000);
      return () => window.clearTimeout(timer);
    }
  }, [submittedRef, effectivePaymentStatus]);


  const paymentLabel = (status: string): string => {


    switch (status) {


      case "PENDING_VERIFICATION":
        return "Awaiting Verification";


      case "VERIFIED":


      case "SUCCESS":
        return "Payment Verified";


      case "REJECTED":
        return "Payment Verification Rejected";


      case "FAILED":
        return "Payment Failed";


      default:
        return "Payment Not Yet Submitted";


    }


  };





  const handleScreenshotSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setScreenshotFile(file);
    setScreenshotError(null);
    if (!file) return;
    const allowed =
      file.type === "application/pdf" ||
      file.type === "image/jpeg" ||
      file.type === "image/png";
    if (!allowed) {
      setScreenshotError("Unsupported file type. Allowed: JPEG, PNG, PDF");
      setScreenshotFile(null);
    }
  };


  const handleScreenshotUpload = async () => {
    if (!screenshotFile) {
      setScreenshotError("Please choose a payment screenshot first.");
      return;
    }
    if (!applicationId) {
      setScreenshotError("Application reference is missing. Please refresh and try again.");
      return;
    }
    setScreenshotUploading(true);
    setScreenshotError(null);
    setPaymentNotice(null);
    try {
      const fd = new FormData();
      fd.append("file", screenshotFile);
      const res = await fetch(
        `${API_BASE_URL}/api/payments/application/${encodeURIComponent(applicationId)}/screenshot`,
        { method: "POST", body: fd, credentials: "include" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not upload the payment screenshot. Please try again.");
      }
      setPaymentScreenshot({
        name: data.payment?.screenshotName || screenshotFile.name,
        mime: data.payment?.screenshotMime || screenshotFile.type,
        uploadedAt: data.payment?.uploadedAt || undefined,
      });
      setScreenshotFile(null);
      setPaymentStatus((s) => (s === "NO_PAYMENT" ? "NOT_SUBMITTED" : s));
      setShowPaymentConfirm(false);
      setPaymentNotice({ type: "success", text: "Payment screenshot uploaded successfully." });
    } catch (err) {
      setPaymentNotice({ type: "error", text: err instanceof Error ? err.message : "Could not upload the payment screenshot." });
      setScreenshotError(err instanceof Error ? err.message : "Could not upload the payment screenshot.");
    } finally {
      setScreenshotUploading(false);
    }
  };


  const submitApplication = useCallback(async () => {


    if (!showDeclaration) {


      setDeclarationError("Please agree to the declaration before submitting your application.");


      return;


    }


    setDeclarationError(null);


    if (!appEditingId) {


      setFormNotice({ type: "error", text: "Please save your application before submitting." });


      return;


    }


    const txn = upiTxnId.trim();


    const isPreVerified = paymentStatus === "VERIFIED" || paymentStatus === "SUCCESS";

if (fee?.enabled && Number(fee.amount || 0) > 0 && fee.paymentMethod !== "razorpay" && !isPreVerified) {



      if (!paymentScreenshot) {



        setPaymentNotice({ type: "error", text: "Please upload your payment screenshot." });



        setScreenshotError("Please upload your payment screenshot.");

        document.getElementById("upi-screenshot-input-block")?.scrollIntoView({ behavior: "smooth", block: "center" });



        return;

      }



      if (!txn) {


        setPaymentNotice({ type: "error", text: "Please enter the UPI transaction reference (UTR) shown in your payment app before submitting your application." });


        setTxnError("Transaction ID / UTR is required. Enter the ID shown in your UPI payment receipt.");

        document.getElementById("upi-txn-input")?.scrollIntoView({ behavior: "smooth", block: "center" });


        return;


      }


      if (txn.length < 6 || txn.length > 64) {


        setPaymentNotice({ type: "error", text: "The UPI transaction reference (UTR) you entered does not look valid. Please check and try again." });


        setTxnError("This transaction ID does not look valid. Please check and try again.");

        document.getElementById("upi-txn-input")?.scrollIntoView({ behavior: "smooth", block: "center" });


        return;


      }


      if (!showPaymentConfirm) {


        setPaymentNotice({ type: "error", text: "Please confirm that you have made the payment before submitting your application." });


        document.getElementById("upi-txn-input")?.scrollIntoView({ behavior: "smooth", block: "center" });


        return;


      }


    }


    setPaymentNotice(null);


    setTxnError(null);


    setSubmitting(true);


    setFormNotice(null);


    try {


      const res = await fetch(`${API_BASE_URL}/api/applications/${appEditingId}/submit`, {


        method: "POST",


        headers: { "Content-Type": "application/json" },


        credentials: "include",


        body: JSON.stringify({ transactionId: txn || undefined, paymentConfirmed: !!showPaymentConfirm }),


      });
const data = await res.json().catch(() => ({}));



      if (!res.ok) {



        const code = (data as any).code as string | undefined;

        if (code === "UPI_QR_NOT_CONFIGURED") {

          setPaymentNotice({ type: "error", text: (data as any).error || "The payment QR code has not been configured yet. Please contact the trust office." });

        } else if (code === "PAYMENT_SCREENSHOT_REQUIRED") {

          setPaymentNotice({ type: "error", text: (data as any).error || "Please upload your payment screenshot." });

          setScreenshotError("Please upload your payment screenshot.");

          document.getElementById("upi-screenshot-input-block")?.scrollIntoView({ behavior: "smooth", block: "center" });

        } else if (code === "UTR_REQUIRED") {

          setPaymentNotice({ type: "error", text: (data as any).error || "Please enter your transaction ID / UTR first." });

          setTxnError("Transaction ID / UTR is required. Enter the ID shown in your UPI payment receipt.");

          document.getElementById("upi-txn-input")?.scrollIntoView({ behavior: "smooth", block: "center" });

        } else if (code === "UTR_INVALID") {

          setPaymentNotice({ type: "error", text: (data as any).error || "The UPI transaction reference (UTR) you entered is invalid. Please check and try again." });

          setTxnError((data as any).error || "Invalid transaction ID.");

          document.getElementById("upi-txn-input")?.scrollIntoView({ behavior: "smooth", block: "center" });

        } else if (code === "PAYMENT_CONFIRMATION_REQUIRED") {

          setPaymentNotice({ type: "error", text: (data as any).error || "Please confirm that you have completed the payment." });

        } else {

          setPaymentNotice({ type: "error", text: (data as any).error || "Could not submit your application. Please try again." });

        }

        setSubmitting(false);

        return;



      }

      setSubmittedRef(data.applicationId || applicationId || null);


      if (isPreVerified) {


        setSubmittedPayment({ status: paymentStatus, txnId: txn || paymentRef?.txnId || undefined, amount: fee?.amount });


      } else if (fee?.enabled && Number(fee.amount || 0) > 0) {


        setSubmittedPayment({ status: "PENDING_VERIFICATION", txnId: txn || undefined, amount: fee?.amount });


      }


    } catch (err) {


      setFormNotice({ type: "error", text: err instanceof Error ? err.message : "Could not submit your application." });


      setSubmitting(false);


    }


  }, [showDeclaration, appEditingId, applicationId, upiTxnId, showPaymentConfirm, paymentStatus, fee, paymentRef, paymentScreenshot]);





  if (initialLoading) {


    return (


      <div className="py-20 text-center">


        <p className="text-muted-foreground">Loading your application…</p>


      </div>


    );


  }





  if (submittedRef) {


    return (


      <div className="card-trust mx-auto max-w-2xl p-8 sm:p-12 text-center">


        <Image


          src="/assets/neelakannu-trust-logo.png"


          alt="Neelakannu Educational Trust logo"


          width={72}


          height={72}


          className="mx-auto h-18 w-18 sm:h-20 sm:w-20"


          priority


        />


        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">


          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-9 w-9 text-success" aria-hidden="true">


            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />


          </svg>


        </div>


        <h2 className="h2-section">Application Submitted Successfully</h2>


        <p className="mx-auto mt-4 max-w-md text-muted-foreground">


          Thank you for applying for educational support from Neelakannu Educational Trust.


        </p>


        {submittedRef && (


          <div className="mt-8 rounded-xl border border-gold/40 bg-gold-soft p-6">


            <p className="text-sm font-medium text-navy-800 dark:text-gold">Application / Reference Number</p>


            <p className="mt-1 text-2xl font-bold tracking-wide text-navy dark:text-white">{submittedRef}</p>


            <p className="mt-2 text-xs text-muted-foreground">Please keep this reference number for future communication.</p>


          </div>


        )}


        {(effectivePaymentStatus === "SUCCESS" ||


          effectivePaymentStatus === "VERIFIED" ||


          effectivePaymentStatus === "PENDING_VERIFICATION") && (


          <div className="mx-auto mt-6 max-w-md space-y-3 rounded-xl border border-border bg-white dark:bg-[#131a2e] p-5 text-left">


            <div className="flex items-center justify-between gap-4">


              <span className="text-sm text-muted-foreground">Payment status</span>


              {effectivePaymentStatus === "PENDING_VERIFICATION" ? (


                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-dark dark:text-gold">


                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">


                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5" />


                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 0 9 9" />


                  </svg>


                  Payment Verification Pending


                </span>


              ) : (


                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">


                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">


                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />


                  </svg>


                  Payment Verified


                </span>


              )}


            </div>


            {(submittedPayment?.txnId || paymentRef?.txnId) && (


              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">


                <span className="text-sm text-muted-foreground">Transaction ID / UTR</span>


                <span className="font-mono text-sm font-medium text-navy dark:text-white">{submittedPayment?.txnId || paymentRef?.txnId}</span>


              </div>


            )}


            {(submittedPayment?.amount != null || paymentRef?.amount != null) && (


              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">


                <span className="text-sm text-muted-foreground">Amount</span>


                <span className="text-sm font-semibold text-navy dark:text-white">₹{Number(submittedPayment?.amount ?? paymentRef?.amount).toLocaleString("en-IN")}</span>


              </div>


            )}


            {effectivePaymentStatus === "PENDING_VERIFICATION" && (


              <p className="border-t border-border pt-3 text-sm text-muted-foreground">


                Your transaction ID has been submitted and is awaiting verification by the Trust.


              </p>


            )}


          </div>


        )}


        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">


          <Link href="/student/dashboard" className="btn-outline">View My Applications</Link>


          <Link href="/" className="btn-gold">Back to Home</Link>

</div>



        {effectivePaymentStatus === "PENDING_VERIFICATION" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="pending-verification-title">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-[#0e1424]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7 animate-spin text-amber-600 dark:text-amber-300" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
              <h3 id="pending-verification-title" className="mt-5 text-xl font-bold text-navy dark:text-white">
                Payment verification pending, please wait.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The Trust will verify your payment before your scholarship application is reviewed. We are taking you to your dashboard.
              </p>
              <Link href="/student/dashboard" className="btn-gold mt-6 w-full sm:w-auto">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}


      </div>



    );



  }



  const isSchool = form.academicType === "school";


  const isCollege = form.academicType === "college";





  return (


    <div className="space-y-6">


      {/* Progress indicator */}


      <nav className="card-trust px-5 py-4 sm:px-6" aria-label="Application progress">


        <ol className="flex items-center gap-1 sm:gap-2">


          {STEPS.map((step, i) => {


            const status = classifyStep(i, currentStep);


            const clickable = status === "complete";


            const content = (


              <span className="flex min-w-0 flex-1 flex-col items-center gap-1">


                <span


                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition


                    ${


                      status === "complete"


                        ? "bg-success text-success-foreground"


                        : status === "current"


                          ? "bg-gold text-navy shadow-sm"


                          : "border border-border bg-muted text-muted-foreground"


                    }`}


                  aria-current={status === "current" ? "step" : undefined}


                >


                  {status === "complete" ? (


                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4" aria-hidden="true">


                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />


                    </svg>


                  ) : (


                    i + 1


                  )}


                </span>


                <span


                  className={`hidden text-[11px] font-medium sm:block ${


                    status === "current" ? "text-navy dark:text-white" : status === "complete" ? "text-success" : "text-muted-foreground"


                  }`}


                >


                  {step.label}


                </span>


              </span>


            );


            return (


              <li key={step.id} className="flex min-w-0 flex-1 items-center">


                {clickable ? (


                  <button type="button" onClick={() => goToStep(i)} className="flex w-full flex-col items-center gap-1" title={`Go to ${step.label}`}>


                    {content}


                  </button>


                ) : (


                  <span className="flex w-full flex-col items-center gap-1">{content}</span>


                )}


                {i < STEPS.length - 1 && (


                  <span


                    className={`mx-1 h-px flex-1 rounded sm:mx-2 ${i < currentStep ? "bg-success" : "bg-border"}`}


                    aria-hidden="true"


                  />


                )}


              </li>


            );


          })}


        </ol>


      </nav>





      {formNotice && (


        <div


          role="alert"


          className={`rounded-lg border px-4 py-3 text-sm ${


            formNotice.type === "error"


              ? "border-destructive/30 bg-destructive/5 text-destructive"


              : formNotice.type === "success"


                ? "border-success/30 bg-success/5 text-success"


                : "border-gold/40 bg-gold-soft text-navy-800"


          }`}


        >


          {formNotice.text}


        </div>


      )}





      <div className="card-trust overflow-hidden">


        <div className="border-b border-border bg-gradient-to-br from-navy-50 to-white dark:from-[#131a2e] dark:to-[#0b1020] px-6 py-5 sm:px-8">


          <p className="eyebrow mb-2">Step {currentStep + 1} of {STEPS.length}</p>


          <h2 className="font-serif text-2xl font-bold text-navy dark:text-white">


            {currentStep === 0 && "Personal Information"}


            {currentStep === 1 && "Contact Information"}


            {currentStep === 2 && "Academic Details"}


            {currentStep === 3 && "Family & Financial Information"}


            {currentStep === 4 && "Document Uploads"}


            {currentStep === 5 && "Review Your Application"}


            {currentStep === 6 && "Pay Application Fee"}


          </h2>


          <p className="mt-1 text-sm text-muted-foreground">


            {currentStep === 4


              ? "Upload clear and readable copies of the required documents."


              : currentStep === 5


                ? "Please verify all information below before submitting."


                : currentStep === 6


                  ? "Payment is required to complete and submit your application."


                  : `Fields marked with * are required.`}


          </p>


        </div>





        <div className="px-5 py-6 sm:px-8 sm:py-8">


          {currentStep === 0 && (


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


              <div>


                <label htmlFor="certificateName" className="field-label">Name (as per the Certificate) *</label>


                <input


                  id="certificateName"


                  type="text"


                  className="field-input"


                  placeholder="Enter your name as per the certificate"


                  value={form.certificateName}


                  onChange={(e) => set("certificateName", e.target.value)}


                  autoComplete="name"


                />


                {errors.certificateName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.certificateName}</p>}


              </div>


              <div>


                <label htmlFor="bankRecordName" className="field-label">Name (as per the Bank Record)</label>


                <input


                  id="bankRecordName"


                  type="text"


                  className="field-input"


                  placeholder="Enter your name as per the bank record"


                  value={form.bankRecordName}


                  onChange={(e) => set("bankRecordName", e.target.value)}


                />


              </div>


              <div>


                <label htmlFor="dateOfBirth" className="field-label">Date of Birth *</label>


                <input


                  id="dateOfBirth"


                  type="text"


                  placeholder="DD/MM/YYYY"


                  className="field-input"


                  value={form.dateOfBirth}


                  onChange={(e) => set("dateOfBirth", e.target.value)}


                  maxLength={10}


                  inputMode="numeric"


                />


                {errors.dateOfBirth && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.dateOfBirth}</p>}


              </div>


              <div>


                <label htmlFor="gender" className="field-label">Gender *</label>


                <select id="gender" className="field-input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>


                  <option value="">Select gender</option>


                  <option>Male</option>


                  <option>Female</option>


                  <option>Other</option>


                </select>


                {errors.gender && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.gender}</p>}


              </div>


              <div>


                <label htmlFor="phone" className="field-label">Phone *</label>


                <input


                  id="phone"


                  type="tel"


                  className="field-input"


                  placeholder="Enter your phone number"


                  value={form.phone}


                  onChange={(e) => set("phone", e.target.value)}


                  inputMode="numeric"


                  maxLength={10}


                  autoComplete="tel"


                />


                {errors.phone && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.phone}</p>}


              </div>


            </div>


          )}





          {currentStep === 1 && (


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


              <div>


                <label htmlFor="doorNumber" className="field-label">Door Number</label>


                <input


                  id="doorNumber"


                  type="text"


                  className="field-input"


                  placeholder="Enter door number"


                  value={form.doorNumber}


                  onChange={(e) => set("doorNumber", e.target.value)}


                />


              </div>


              <div>


                <label htmlFor="street" className="field-label">Street Address *</label>


                <input


                  id="street"


                  type="text"


                  className="field-input"


                  placeholder="Enter your street address"


                  value={form.street}


                  onChange={(e) => set("street", e.target.value)}


                  autoComplete="street-address"


                />


                {errors.street && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.street}</p>}


              </div>


              <div>


                <label htmlFor="city" className="field-label">City *</label>


                <input


                  id="city"


                  type="text"


                  className="field-input"


                  placeholder="Enter your city"


                  value={form.city}


                  onChange={(e) => set("city", e.target.value)}


                  autoComplete="address-level2"


                />


                {errors.city && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.city}</p>}


              </div>


              <div>


                <label htmlFor="district" className="field-label">District *</label>


                <input


                  id="district"


                  type="text"


                  className="field-input"


                  placeholder="Enter your district"


                  value={form.district}


                  onChange={(e) => set("district", e.target.value)}


                />


                {errors.district && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.district}</p>}


              </div>


              <div>


                <label htmlFor="state" className="field-label">State *</label>


                <select id="state" className="field-input" value={form.state} onChange={(e) => set("state", e.target.value)}>


                  <option value="">Select state</option>


                  <option>Tamil Nadu</option>


                </select>


                {errors.state && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.state}</p>}


              </div>


              <div>


                <label htmlFor="pinCode" className="field-label">PIN Code *</label>


                <input


                  id="pinCode"


                  type="text"


                  className="field-input"


                  placeholder="Enter PIN code (6 digits)"


                  value={form.pinCode}


                  onChange={(e) => set("pinCode", e.target.value.replace(/[^0-9]/g, ""))}


                  inputMode="numeric"


                  maxLength={6}


                  pattern="[0-9]{6}"


                  autoComplete="postal-code"


                />


                {errors.pinCode && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.pinCode}</p>}


              </div>


            </div>


          )}





          {currentStep === 2 && (


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


              <div className="md:col-span-2">


                <span className="field-label">Academic Type *</span>


                <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Academic Type">


                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${isSchool ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                    <input


                      type="radio"


                      name="academicType"


                      className="h-4 w-4 accent-navy"


                      checked={isSchool}


                      onChange={() => set("academicType", "school")}


                    />


                    School


                  </label>


                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${isCollege ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                    <input


                      type="radio"


                      name="academicType"


                      className="h-4 w-4 accent-navy"


                      checked={isCollege}


                      onChange={() => set("academicType", "college")}


                    />


                    College


                  </label>


                </div>


                {errors.academicType && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.academicType}</p>}


              </div>





              {isSchool && (


                <>


                  <div className="md:col-span-2">


                    <label htmlFor="schoolName" className="field-label">School Name *</label>


                    <input


                      id="schoolName"


                      type="text"


                      className="field-input"


                      placeholder="Enter your school name"


                      value={form.schoolName}


                      onChange={(e) => set("schoolName", e.target.value)}


                    />


                    {errors.schoolName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.schoolName}</p>}


                  </div>


                  <div>


                    <label htmlFor="className" className="field-label">Class</label>


                    <input


                      id="className"


                      type="text"


                      className="field-input"


                      placeholder="e.g. Class X"


                      value={form.className}


                      onChange={(e) => set("className", e.target.value)}


                    />


                  </div>


                  <div>


                    <label htmlFor="section" className="field-label">Section</label>


                    <input


                      id="section"


                      type="text"


                      className="field-input"


                      placeholder="e.g. A"


                      value={form.section}


                      onChange={(e) => set("section", e.target.value)}


                    />


                  </div>


                  <div className="md:col-span-2">


                    <label htmlFor="academicYear" className="field-label">Academic Year *</label>


                    <input


                      id="academicYear"


                      type="text"


                      className="field-input"


                      placeholder="e.g. 2026-2027"


                      value={form.academicYear}


                      onChange={(e) => set("academicYear", e.target.value)}


                    />


                    {errors.academicYear && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.academicYear}</p>}


                  </div>


                </>


              )}





              {isCollege && (


                <>


                  <div className="md:col-span-2">


                    <label htmlFor="collegeName" className="field-label">College Name *</label>


                    <input


                      id="collegeName"


                      type="text"


                      className="field-input"


                      placeholder="Enter your college name"


                      value={form.collegeName}


                      onChange={(e) => set("collegeName", e.target.value)}


                    />


                    {errors.collegeName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.collegeName}</p>}


                  </div>


                  <div>


                    <label htmlFor="course" className="field-label">Course *</label>


                    <input


                      id="course"


                      type="text"


                      className="field-input"


                      placeholder="Enter your course"


                      value={form.course}


                      onChange={(e) => set("course", e.target.value)}


                    />


                    {errors.course && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.course}</p>}


                  </div>


                  <div>


                    <label htmlFor="semester" className="field-label">Semester</label>


                    <input


                      id="semester"


                      type="text"


                      className="field-input"


                      placeholder="e.g. Semester 3"


                      value={form.semester}


                      onChange={(e) => set("semester", e.target.value)}


                    />


                  </div>


                  <div>


                    <label htmlFor="ugPg" className="field-label">UG / PG</label>


                    <select id="ugPg" className="field-input" value={form.ugPg} onChange={(e) => set("ugPg", e.target.value)}>


                      <option value="">Select UG / PG</option>


                      <option>UG</option>


                      <option>PG</option>


                    </select>


                  </div>


                  <div>


                    <label htmlFor="collegeAcadYear" className="field-label">Academic Year *</label>


                    <input


                      id="collegeAcadYear"


                      type="text"


                      className="field-input"


                      placeholder="e.g. 2026-2027"


                      value={form.academicYear}


                      onChange={(e) => set("academicYear", e.target.value)}


                    />


                    {errors.academicYear && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.academicYear}</p>}


                  </div>


                </>


              )}


            </div>


          )}





          {currentStep === 3 && (


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


              <div className="md:col-span-2">


                <span className="field-label">Family Status</span>


                <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Family Status">


                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${form.familyStatus === "PARENTS" ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                    <input


                      type="radio"


                      name="familyStatus"


                      className="h-4 w-4 accent-navy"


                      checked={form.familyStatus === "PARENTS"}


                      onChange={() => chooseFamilyStatus("PARENTS")}


                    />


                    Parents


                  </label>


                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${form.familyStatus === "SINGLE_PARENT" ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                    <input


                      type="radio"


                      name="familyStatus"


                      className="h-4 w-4 accent-navy"


                      checked={form.familyStatus === "SINGLE_PARENT"}


                      onChange={() => chooseFamilyStatus("SINGLE_PARENT")}


                    />


                    Single Parent


                  </label>








                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${form.familyStatus === "NO_PARENTS" ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                    <input


                      type="radio"


                      name="familyStatus"


                      className="h-4 w-4 accent-navy"


                      checked={form.familyStatus === "NO_PARENTS"}


                      onChange={() => chooseFamilyStatus("NO_PARENTS")}


                    />


                    No Parents


                  </label>


                </div>


              </div>



              <div>


                <label htmlFor="guardianName" className="field-label">{form.familyStatus === "NO_PARENTS" ? "Parent 1 Name *" : "Parent/Guardian Name *"}</label>


                <input


                  id="guardianName"


                  type="text"


                  className="field-input"


                  placeholder="Enter parent/guardian name"


                  value={form.guardianName}


                  onChange={(e) => set("guardianName", e.target.value)}


                />


                {errors.guardianName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.guardianName}</p>}


              </div>


              <div>


                <label htmlFor="relationship" className="field-label">{form.familyStatus === "NO_PARENTS" ? "Parent 1 Relationship *" : "Relationship *"}</label>


                <select id="relationship" className="field-input" value={form.relationship} onChange={(e) => set("relationship", e.target.value)}>


                  <option value="">Select relationship</option>


                  <option>Father</option>


                  <option>Mother</option>


                  <option>Guardian</option>


                </select>


                {errors.relationship && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.relationship}</p>}


              </div>





              {form.familyStatus === "NO_PARENTS" && (


                <>


                  <div className="md:col-span-2 border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide text-navy-700 dark:text-slate-300">


                    Parent 2


                  </div>








                  <div>


                    <label htmlFor="parent2Name" className="field-label">Parent 2 Name *</label>


                    <input


                      id="parent2Name"


                      type="text"


                      className="field-input"


                      placeholder="Enter parent 2 name"


                      value={form.parent2Name}


                      onChange={(e) => set("parent2Name", e.target.value)}


                    />


                    {errors.parent2Name && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.parent2Name}</p>}


                  </div>








                  <div>


                    <label htmlFor="parent2Relationship" className="field-label">Parent 2 Relationship *</label>


                    <select id="parent2Relationship" className="field-input" value={form.parent2Relationship} onChange={(e) => set("parent2Relationship", e.target.value)}>


                      <option value="">Select relationship</option>


                      <option>Father</option>


                      <option>Mother</option>


                      <option>Guardian</option>


                    </select>


                    {errors.parent2Relationship && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.parent2Relationship}</p>}


                  </div>


                </>


              )}








              {form.familyStatus !== "NO_PARENTS" && (


                <>


                  <div className="md:col-span-2 border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide text-navy-700 dark:text-slate-300">


                    Financial Details


                  </div>


              <div>


                <label htmlFor="familyIncome" className="field-label">Family Annual Income (₹) *</label>


                <input


                  id="familyIncome"


                  type="number"


                  className="field-input"


                  placeholder="Enter family annual income"


                  value={form.familyIncome}


                  onChange={(e) => set("familyIncome", e.target.value)}


                  min={0}


                  inputMode="numeric"


                />


                {errors.familyIncome && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.familyIncome}</p>}


              </div>


              <div>


                <label htmlFor="incomeSource" className="field-label">Income Source *</label>


                <select id="incomeSource" className="field-input" value={form.incomeSource} onChange={(e) => set("incomeSource", e.target.value)}>


                  <option value="">Select income source</option>


                  <option>Agriculture</option>


                  <option>Private Job</option>


                  <option>Government Job</option>


                  <option>Business</option>


                  <option>Other</option>


                </select>


                {errors.incomeSource && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.incomeSource}</p>}


              </div>


              </>


            )}


            </div>


          )}





          <div className={currentStep === 4 ? "" : "hidden"}>


            <DocumentUpload applicationId={applicationId} onCountChange={setDocCount} isSingleParent={form.isSingleParent} noParents={form.familyStatus === "NO_PARENTS"} />


          </div>





          {currentStep === 6 && (



            <div className="space-y-6">



              {applicationId && (



                <div className="rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-navy-800">



                  <strong>Application ID:</strong> {applicationId}



                </div>



              )}





              <div className="rounded-xl border border-border bg-white dark:bg-[#131a2e] p-6">



                <div className="flex items-center gap-3">



                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold">



                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">



                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />



                    </svg>



                  </span>



                  <div>



                    <h3 className="text-base font-semibold text-navy dark:text-white">Application Fee</h3>



                    <p className="text-sm text-muted-foreground">



                      {fee && fee.enabled

                        ? `Please pay the application fee of ₹${Number(fee.amount).toLocaleString("en-IN")} to complete your application.`

                        : "Checking application fee..."}



                    </p>



                  </div>



                </div>





                {fee && fee.enabled && fee.amount > 0 && (



                  <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-border bg-surface-muted p-5">



                    <div>



                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Payable</p>



                      <p className="font-serif text-3xl font-bold text-navy dark:text-white">



                        ₹{Number(fee.amount).toLocaleString("en-IN")}



                      </p>



                    </div>



{paymentStatus === "PENDING_VERIFICATION" || paymentStatus === "PENDING" ? (



                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">



                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />




                      </svg>




                      Awaiting Verification




                    </span>



                  ) : paymentStatus === "REJECTED" ? (



                    <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">



                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">



                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />



                      </svg>



                      Payment Verification Rejected



                    </span>



                  ) : paymentVerified ? (



                    <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-sm font-semibold text-success">



                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">



                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />



                      </svg>



                      Payment Verified



                    </span>



                  ) : (



                    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">



                      Payment Not Yet Submitted



                    </span>



                  )}



                  </div>



                )}

{/* UPI QR + UTR entry */}



                {fee && fee.enabled && fee.amount > 0 && fee.paymentMethod !== "razorpay" && !paymentVerified && (



                  <div className="mt-6 rounded-xl border border-gold/30 bg-white p-6 dark:border-gold/20 dark:bg-[#131a2e]">



                    {paymentStatus === "REJECTED" && (



                      <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">



                        <p className="text-sm font-semibold text-destructive">Payment verification was rejected</p>



                        <p className="mt-1 text-sm text-muted-foreground">



                          {paymentRef?.verifiedNote ? `Reason: ${paymentRef.verifiedNote} ` : ""}Please enter the correct transaction reference below and submit your application again.



                        </p>



                      </div>



                    )}



                    <div className="text-center mb-4">



                      <p className="text-sm font-semibold text-navy dark:text-white">Scan the QR code to pay</p>



                      <p className="mt-1 text-sm text-muted-foreground">



                        Application fee: <strong className="text-navy dark:text-gold">₹{Number(fee.amount).toLocaleString("en-IN")}</strong>



                      </p>



                    </div>



                    <div className="flex flex-col items-center gap-4">



                      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">



                        {fee.upi?.qrConfigured && fee.upi.qrUrl ? (



                          <img



                            src={`${API_BASE_URL}${fee.upi.qrUrl}`}



                            alt="UPI payment QR code"



                            className="h-64 w-64 max-w-full object-contain"



                            referrerPolicy="no-referrer"



                          />



                        ) : (



                          <div className="flex h-64 w-64 max-w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted text-center">



                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-muted-foreground" aria-hidden="true">



                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />



                            </svg>



                            <p className="px-4 text-sm text-muted-foreground">QR code not available yet. Please contact the trust office for payment instructions.</p>



                          </div>



                        )}



                      </div>



                      <div className="text-center space-y-2 w-full max-w-md">



                        {fee.upi?.vpa && (



                          <p className="text-sm font-mono text-navy dark:text-gold bg-gold-soft px-3 py-2 rounded-lg">



                            UPI ID: {fee.upi.vpa}



                          </p>



                        )}



                        <p className="text-sm text-muted-foreground">



                          After completing the payment, enter the transaction reference below and submit your application.



                        </p>



                      </div>



                    </div>



                    <div className="mt-6 pt-6 border-t border-border">



                      <div className="space-y-3 text-sm text-navy-800 dark:text-muted-foreground">



                        {fee.upi?.instructions ? (



                          <p className="whitespace-pre-line text-muted-foreground">{fee.upi.instructions}</p>



                        ) : (



                          <ol className="list-decimal space-y-1.5 pl-5">



                            <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>



                            <li>Choose "Scan & Pay" and scan the QR code above</li>



                            <li>Enter the application fee amount and complete the payment</li>



                            <li>Copy the UPI transaction reference (UTR) and enter it below</li>



                          </ol>



                        )}



                        <label className="block">



                          <span className="field-label">
                            Transaction ID / UTR <span className="text-destructive">*</span>
                          </span>



                          <input



                            id="upi-txn-input"



                            type="text"



                            className="field-input"



                            placeholder="Enter your UPI Transaction ID / UTR"



                            value={upiTxnId}



                            onChange={(e) => {
                              setUpiTxnId(e.target.value);
                              setTxnError(null);
                            }}



                          />



                          {txnError && (
                            <p className="mt-1 text-sm font-medium text-destructive" id="upi-txn-error">{txnError}</p>
                          )}



                          <p className="mt-1 text-xs text-muted-foreground">
                            Enter the Transaction ID / UTR shown in your UPI payment receipt.
                          </p>



                        </label>



                        <label className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-3 cursor-pointer">



                          <input



                            type="checkbox"



                            checked={showPaymentConfirm}



                            onChange={(e) => setShowPaymentConfirm(e.target.checked)}



                            className="mt-1 h-4 w-4 accent-[#d4af37]"



                          />



                          <span className="text-sm text-navy-800 dark:text-muted-foreground">



                            I confirm that I have completed the payment.



                          </span>



                        </label>



                        <div id="upi-screenshot-input-block" className="mt-5 rounded-xl border border-border bg-surface-muted p-4">



                          <span className="field-label">
                            Payment Screenshot <span className="text-destructive">*</span>
                          </span>



                          <p className="mt-1 text-sm text-muted-foreground">
                            Upload a screenshot of your successful UPI payment.
                          </p>



                          {paymentScreenshot || screenshotFile ? (
                            <div className="mt-3 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 shrink-0 text-success" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                  </svg>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-success">
                                      {screenshotFile ? screenshotFile.name : paymentScreenshot?.name || "Payment screenshot"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {screenshotUploading
                                        ? "Uploading…"
                                        : paymentScreenshot
                                          ? "Screenshot uploaded. You can replace it if needed."
                                          : "Click Upload to attach your screenshot."}
                                    </p>
                                  </div>
                                </div>
                                {!screenshotUploading && (
                                  <div className="flex items-center gap-2">
                                    {paymentScreenshot && !screenshotFile && applicationId ? (
                                      <a
                                        href={`${API_BASE_URL}/api/payments/application/${encodeURIComponent(applicationId)}/screenshot`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        referrerPolicy="no-referrer"
                                        className="btn-outline px-3 py-1.5 text-xs"
                                      >
                                        View
                                      </a>
                                    ) : null}
                                    <label className="btn-outline cursor-pointer px-3 py-1.5 text-xs">
                                      {screenshotFile ? "Change" : "Replace"}
                                      <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="hidden" onChange={handleScreenshotSelect} />
                                    </label>
                                  </div>
                                )}
                              </div>
                              {screenshotFile && !screenshotUploading && (
                                <button type="button" onClick={handleScreenshotUpload} className="btn-gold w-full sm:w-auto">
                                  {paymentScreenshot ? "Replace screenshot" : "Upload screenshot"}
                                </button>
                              )}
                            </div>
                          ) : (
                            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/40 px-4 py-8 text-center transition hover:border-gold/60 hover:bg-gold-soft/40">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-muted-foreground" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                              <span className="text-sm font-medium text-navy dark:text-white">
                                Click to upload your payment screenshot
                              </span>
                              <span className="text-xs text-muted-foreground">JPEG, PNG or PDF — show the successful payment receipt</span>
                              <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="hidden" onChange={handleScreenshotSelect} />
                            </label>
                          )}



                          {paymentScreenshot?.uploadedAt && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Uploaded on {new Date(paymentScreenshot.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}



                          {screenshotError && (
                            <p className="mt-2 text-sm font-medium text-destructive" role="alert">{screenshotError}</p>
                          )}



                        </div>



                        <p className="text-xs text-muted-foreground">



                          After you submit, our team will verify your transaction. Your application will be marked as paid once it is confirmed.



                        </p>



                      </div>



                    </div>



                  </div>



                )}



                {fee && fee.enabled && fee.amount > 0 && fee.paymentMethod === "razorpay" && !paymentVerified && (



                  <div className="mt-6 rounded-xl border border-gold/30 bg-white p-6 dark:border-gold/20 dark:bg-[#131a2e]">



                    <p className="text-sm text-muted-foreground">Online payment gateway is being configured. Please check back shortly.</p>



                  </div>



                )}



                {paymentVerified && (



                  <div className="mt-5 grid gap-3 rounded-xl border border-border bg-white dark:bg-[#131a2e] p-5 sm:grid-cols-2">



                    <div>



                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment Status</p>



                      <p className="mt-1 text-sm font-semibold text-success">Payment Verified</p>



                    </div>



                    <div>



                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount Paid</p>



                      <p className="mt-1 text-sm font-semibold text-navy dark:text-white">₹{Number(paymentRef?.amount ?? fee?.amount ?? 0).toLocaleString("en-IN")}</p>



                    </div>



                    {paymentRef?.txnId && (



                      <div>



                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Transaction ID / UTR</p>



                        <p className="mt-1 font-mono text-sm text-navy dark:text-white">{paymentRef.txnId}</p>



                      </div>



                    )}



                    {paymentRef?.verifiedAt && (



                      <div>



                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Verified On</p>



                        <p className="mt-1 text-sm text-navy dark:text-white">



                          {new Date(paymentRef.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}



                        </p>



                      </div>



                    )}



                  </div>



                )}



                {!fee?.enabled && (



                  <p className="mt-4 text-sm text-muted-foreground">



                    Application fee collection is currently disabled. You may proceed to submit.



                  </p>



                )}





                {paymentNotice && (



                  <div



                    role="alert"



                    className={`mt-4 rounded-lg border px-4 py-3 text-sm ${



                      paymentNotice.type === "error"



                        ? "border-destructive/30 bg-destructive/5 text-destructive"



                        : paymentNotice.type === "success"



                          ? "border-success/30 bg-success/5 text-success"



                          : "border-gold/40 bg-gold-soft text-navy-800"



                    }`}



                  >



                    {paymentNotice.text}



                  </div>



                )}




</div>



            </div>



          )}





          {currentStep === 5 && (


            <div className="space-y-6">


              {applicationId && (


                <div className="rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-navy-800">


                  <strong>Application ID:</strong> {applicationId}


                </div>


              )}


              <div className="space-y-5">


                <ReviewBlock title="Personal Information">


                  <ReviewRow label="Name (as per Certificate)" value={form.certificateName} />


                  <ReviewRow label="Name (as per Bank Record)" value={form.bankRecordName} />


                  <ReviewRow label="Date of Birth" value={form.dateOfBirth} />


                  <ReviewRow label="Gender" value={form.gender} />


                  <ReviewRow label="Phone" value={form.phone} />


                </ReviewBlock>


                <ReviewBlock title="Contact Information">


                  <ReviewRow label="Door Number" value={form.doorNumber} />


                  <ReviewRow label="Street Address" value={form.street} />


                  <ReviewRow label="City" value={form.city} />


                  <ReviewRow label="District" value={form.district} />


                  <ReviewRow label="State" value={form.state} />


                  <ReviewRow label="PIN Code" value={form.pinCode} />


                </ReviewBlock>


                <ReviewBlock title="Academic Details">


                  <ReviewRow label="Academic Type" value={isSchool ? "School" : isCollege ? "College" : ""} />


                  {isSchool ? (


                    <>


                      <ReviewRow label="School Name" value={form.schoolName} />


                      <ReviewRow label="Class" value={form.className} />


                      <ReviewRow label="Section" value={form.section} />


                    </>


                  ) : isCollege ? (


                    <>


                      <ReviewRow label="College Name" value={form.collegeName} />


                      <ReviewRow label="Course" value={form.course} />


                      <ReviewRow label="Semester" value={form.semester} />


                      <ReviewRow label="UG / PG" value={form.ugPg} />


                    </>


                  ) : (


                    <ReviewRow label="Education" value="Not provided" />


                  )}


                  <ReviewRow label="Academic Year" value={form.academicYear} />


                </ReviewBlock>


                {form.familyStatus === "NO_PARENTS" ? (


                  <ReviewBlock title="Family & Parent Information">


                    <ReviewRow label="Family Status" value="No Parents" />


                    <ReviewRow label="Parent 1 Name" value={form.guardianName} />


                    <ReviewRow label="Parent 1 Relationship" value={form.relationship} />


                    <ReviewRow label="Parent 2 Name" value={form.parent2Name} />


                    <ReviewRow label="Parent 2 Relationship" value={form.parent2Relationship} />


                  </ReviewBlock>


                ) : (


                  <ReviewBlock title="Family & Financial Information">


                    <ReviewRow label="Family Status" value={form.familyStatus === "SINGLE_PARENT" ? "Single Parent" : "Parents"} />


                    <ReviewRow label="Parent/Guardian" value={form.guardianName} />


                    <ReviewRow label="Relationship" value={form.relationship} />


                    <ReviewRow label="Family Annual Income" value={form.familyIncome ? `₹${Number(form.familyIncome).toLocaleString("en-IN")}` : ""} />


                    <ReviewRow label="Income Source" value={form.incomeSource} />


                  </ReviewBlock>


                )}


                <ReviewBlock title="Documents">


                  <ReviewRow label="Uploaded documents" value={docCount > 0 ? `${docCount} document(s) selected` : "No documents selected"} />


                </ReviewBlock>


              </div>





              <div className="rounded-xl border border-border bg-surface-muted p-5">


                <p className="text-sm text-muted-foreground leading-relaxed">


                  I hereby declare that the information provided in this scholarship application is true, complete and accurate to the best of my knowledge. I understand that any false or misleading information may result in the rejection of my application or cancellation of the scholarship at any stage.


                </p>


                <label className="mt-4 flex items-start gap-3">


                  <input


                    type="checkbox"


                    className="mt-1 h-5 w-5 rounded border-border text-navy dark:text-white focus:ring-2 focus:ring-navy/30"


                    checked={showDeclaration}


                    onChange={(e) => {


                      setShowDeclaration(e.target.checked);


                      if (e.target.checked) setDeclarationError(null);


                    }}


                  />


                  <span className="text-sm font-medium text-foreground">


                    I agree to the above declaration


                  </span>


                </label>


                {declarationError && <p className="mt-2 text-sm text-destructive" role="alert">{declarationError}</p>}


              </div>


            </div>


          )}


        </div>





        {/* Footer nav */}


        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border bg-navy-50/50 dark:bg-white/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">


          <button


            type="button"


            onClick={goBack}


            disabled={currentStep === 0}


            className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"


          >


            ← Previous


          </button>





          {currentStep < 5 && (


            <button


              type="button"


              onClick={currentStep === 4 ? () => setCurrentStep(5) : saveAndContinue}


              disabled={saving}


              className="btn-gold disabled:cursor-not-allowed disabled:opacity-60"


            >


              {saving ? "Saving…" : currentStep === 4 ? "Continue to Review →" : "Save & Continue →"}


            </button>


          )}





          {currentStep === 5 && !showDeclaration && (


            <button


              type="button"


              onClick={() => {


                setDeclarationError("Please agree to the declaration before submitting your application.");


                window.scrollTo({ top: 0, behavior: "smooth" });


              }}


              className="btn-gold"


            >


              Continue to Payment →


            </button>


          )}





          {currentStep === 5 && showDeclaration && (


            <button


              type="button"


              onClick={() => setCurrentStep(6)}


              className="btn-gold"


            >


              Continue to Payment →


            </button>


          )}





          {currentStep === 6 && (


            <button


              type="button"


              onClick={submitApplication}


              disabled={submitting || (fee?.paymentMethod === "razorpay" && fee?.enabled !== false && paymentStatus !== "SUCCESS")}


              className="btn-gold disabled:cursor-not-allowed disabled:opacity-60"


            >


              {submitting ? "Submitting…" : "Submit Application"}


            </button>


          )}


        </div>


      </div>


    </div>


  );


}





function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {


  return (


    <section className="rounded-xl border border-border bg-white dark:bg-[#131a2e] p-5">


      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-700 dark:text-slate-300">{title}</h3>


      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">{children}</dl>


    </section>


  );


}





function ReviewRow({ label, value }: { label: string; value: string }) {


  return (


    <div>


      <dt className="text-xs text-muted-foreground">{label}</dt>


      <dd className="text-sm font-medium text-foreground">{value || "—"}</dd>


    </div>


  );


}


