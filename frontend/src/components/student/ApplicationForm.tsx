"use client";





import Image from "next/image";


import Link from "next/link";


import { useCallback, useEffect, useState } from "react";


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


  singleParentType: string;


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


  singleParentType: "",


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


    paymentMethod?: "upi" | "razorpay";


    upi?: { qrUrl: string; vpa: string; instructions: string };


  } | null>(null);


  const [paymentStatus, setPaymentStatus] = useState<"NO_PAYMENT" | "PENDING" | "SUCCESS" | "FAILED">("NO_PAYMENT");


  const [paying, setPaying] = useState(false);


  const [verifying, setVerifying] = useState(false);


  const [paymentNotice, setPaymentNotice] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);


  const [paymentRef, setPaymentRef] = useState<{ paymentId?: string | null; amount?: number | null; txnId?: string | null } | null>(null);


  const [upiQrOpen, setUpiQrOpen] = useState(false);


  const [upiTxnId, setUpiTxnId] = useState("");





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


            singleParentType: (pg as any).singleParentType || "",


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


          setPaymentRef({ paymentId: d.paymentId, amount: d.amount, txnId: d.razorpayPaymentId });


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


      singleParentType: status === "SINGLE_PARENT" ? f.singleParentType : "",


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


        if (data.familyStatus === "SINGLE_PARENT" && !data.singleParentType) e.singleParentType = "Please select Father or Mother.";


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


          singleParentType: form.familyStatus === "SINGLE_PARENT" ? form.singleParentType : "",


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





  // Temporary UPI QR payment flow. Opens the "Pay" panel showing the fee, the


  // admin-configured UPI QR code, and scan-and-pay instructions. The applicant


  // then enters their UPI transaction reference which is stored as PENDING and


  // must be verified by an admin before the application can be submitted.


  // When Razorpay is added (paymentMethod === "razorpay"), this path is replaced


  // by the checkout flow while the fee stays admin-controlled.


  const payApplication = useCallback(async () => {


    if (!applicationId) {


      setPaymentNotice({ type: "error", text: "Please save your application before paying." });


      return;


    }


    setPaying(true);


    setPaymentNotice(null);


    try {


      const orderRes = await fetch(`${API_BASE_URL}/api/payments/create-order`, {


        method: "POST",


        headers: { "Content-Type": "application/json" },


        credentials: "include",


        body: JSON.stringify({ applicationId }),


      });


      const order = await orderRes.json().catch(() => ({}));


      if (!orderRes.ok) {


        throw new Error(order.error || "Could not create payment order.");


      }


      if (order.status === "SUCCESS") {


        setPaymentStatus("SUCCESS");


        setPaymentRef({ paymentId: order.paymentId, amount: order.amount / 100 });


        setPaymentNotice({ type: "success", text: "Payment already completed." });


        return;


      }


      if (order.paymentMethod === "upi") {


        setFee((f) => f && { ...f, upi: order.upi || f.upi, paymentMethod: "upi" });


        setUpiQrOpen(true);


        setPaymentNotice(null);


        return;


      }


      // Future Razorpay path


      setPaymentNotice({ type: "info", text: "Online payment gateway is being configured. Please check back shortly." });


    } catch (err) {


      setPaymentNotice({ type: "error", text: err instanceof Error ? err.message : "Payment could not be started." });


    } finally {


      setPaying(false);


    }


  }, [applicationId]);





  const confirmUpiPayment = useCallback(async () => {


    const txn = upiTxnId.trim();


    if (!applicationId) {


      setPaymentNotice({ type: "error", text: "Please save your application before confirming payment." });


      return;


    }


    if (!txn) {


      setPaymentNotice({ type: "error", text: "Please enter the UPI transaction reference (UTR) shown in your payment app." });


      return;


    }


    setVerifying(true);


    setPaymentNotice(null);


    try {


      const res = await fetch(`${API_BASE_URL}/api/payments/confirm`, {


        method: "POST",


        headers: { "Content-Type": "application/json" },


        credentials: "include",


        body: JSON.stringify({ applicationId, upiTransactionId: txn }),


      });


      const data = await res.json().catch(() => ({}));


      if (!res.ok) {


        throw new Error(data.error || "Could not confirm your payment. Please try again.");


      }


      if (data.status === "SUCCESS") {


        setPaymentStatus("SUCCESS");


        setPaymentNotice({ type: "success", text: "Payment already verified. You can now submit your application." });


      } else {


        setPaymentStatus("PENDING");


        setPaymentRef({ paymentId: data.paymentId, txnId: data.txnId, amount: fee?.amount });


        setPaymentNotice({


          type: "info",


          text: "Payment details submitted. Our team will verify your transaction. Once verified, you can submit your application.",


        });


      }


      setUpiQrOpen(false);


    } catch (err) {


      setPaymentNotice({ type: "error", text: err instanceof Error ? err.message : "Could not confirm your payment." });


    } finally {


      setVerifying(false);


    }


  }, [applicationId, upiTxnId, fee]);





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


    setSubmitting(true);


    setFormNotice(null);


    try {


      const res = await fetch(`${API_BASE_URL}/api/applications/${appEditingId}/submit`, {


        method: "POST",


        credentials: "include",


      });


      const data = await res.json().catch(() => ({}));


      if (!res.ok) {


        throw new Error(data.error || "Could not submit your application. Please try again.");


      }


      setSubmittedRef(data.applicationId || applicationId || null);


    } catch (err) {


      setFormNotice({ type: "error", text: err instanceof Error ? err.message : "Could not submit your application." });


      setSubmitting(false);


    }


  }, [showDeclaration, appEditingId, applicationId]);





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


        {paymentStatus === "SUCCESS" && (


          <div className="mx-auto mt-6 max-w-md space-y-3 rounded-xl border border-border bg-white dark:bg-[#131a2e] p-5 text-left">


            <div className="flex items-center justify-between gap-4">


              <span className="text-sm text-muted-foreground">Payment status</span>


              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">


                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">


                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />


                </svg>


                Paid


              </span>


            </div>


            {paymentRef?.paymentId && (


              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">


                <span className="text-sm text-muted-foreground">Payment ID</span>


                <span className="font-mono text-sm font-medium text-navy dark:text-white">{paymentRef.paymentId}</span>


              </div>


            )}


            {paymentRef?.txnId && (


              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">


                <span className="text-sm text-muted-foreground">UPI Transaction Ref</span>


                <span className="font-mono text-sm font-medium text-navy dark:text-white">{paymentRef.txnId}</span>


              </div>


            )}


            {paymentRef?.amount != null && (


              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">


                <span className="text-sm text-muted-foreground">Amount Paid</span>


                <span className="text-sm font-semibold text-navy dark:text-white">₹{Number(paymentRef.amount).toLocaleString("en-IN")}</span>


              </div>


            )}


          </div>


        )}


        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">


          <Link href="/student/dashboard" className="btn-outline">View My Applications</Link>


          <Link href="/" className="btn-gold">Back to Home</Link>


        </div>


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





              {form.familyStatus === "SINGLE_PARENT" && (


                <div className="md:col-span-2">


                  <span className="field-label">Single Parent Type</span>


                  <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Single Parent Type">


                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${form.singleParentType === "Father" ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                      <input


                        type="radio"


                        name="singleParentType"


                        className="h-4 w-4 accent-navy"


                        checked={form.singleParentType === "Father"}


                        onChange={() => set("singleParentType", "Father")}


                      />


                      Father


                    </label>


                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${form.singleParentType === "Mother" ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                      <input


                        type="radio"


                        name="singleParentType"


                        className="h-4 w-4 accent-navy"


                        checked={form.singleParentType === "Mother"}


                        onChange={() => set("singleParentType", "Mother")}


                      />


                      Mother


                    </label>


                  </div>


                  {errors.singleParentType && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.singleParentType}</p>}


                </div>


              )}


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



                    {paymentStatus === "SUCCESS" ? (



                      <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-sm font-semibold text-success">



                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">



                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />



                        </svg>



                        Payment Successful



                      </span>



                    ) : paymentStatus === "PENDING" ? (



                      <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">



                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">



                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />



                        </svg>



                        Awaiting Verification



                      </span>



                    ) : (



                      <button



                        type="button"



                        onClick={payApplication}



                        disabled={paying || verifying}



                        className="btn-gold disabled:cursor-not-allowed disabled:opacity-60"



                      >



                        {paying ? "Preparing payment…" : "Pay Application Fee"}



                      </button>



                    )}



                  </div>



                )}



                {/* UPI QR Code - Always visible on Payment step */}

                {fee && fee.enabled && fee.amount > 0 && paymentStatus !== "SUCCESS" && (



                  <div className="mt-6 rounded-xl border border-gold/30 bg-white p-6 dark:border-gold/20 dark:bg-[#131a2e]">



                    <div className="text-center mb-4">



                      <p className="text-sm font-semibold text-navy dark:text-white">Scan the QR code to pay</p>



                      <p className="mt-1 text-sm text-muted-foreground">



                        Application fee: <strong className="text-navy dark:text-gold">₹{Number(fee.amount).toLocaleString("en-IN")}</strong>



                      </p>



                    </div>



                    <div className="flex flex-col items-center gap-4">



                      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">



                        <img



                          src="/assets/upi-qr-code.jpeg"



                          alt="UPI payment QR code"



                          className="h-64 w-64 max-w-full object-contain"



                          referrerPolicy="no-referrer"



                        />



                      </div>



                      <div className="text-center space-y-2 w-full max-w-md">



                        <p className="text-sm font-mono text-navy dark:text-gold bg-gold-soft px-3 py-2 rounded-lg">



                          UPI ID: kavilan.rj@oksbi



                        </p>



                        <p className="text-sm text-muted-foreground">



                          After completing the payment, submit your application.



                        </p>



                      </div>



                    </div>



                    {/* Payment instructions and UTR entry */}



                    <div className="mt-6 pt-6 border-t border-border">



                      <div className="space-y-3 text-sm text-navy-800 dark:text-muted-foreground">



                        <ol className="list-decimal space-y-1.5 pl-5">



                          <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>



                          <li>Choose "Scan & Pay" and scan the QR code above</li>



                          <li>Enter the application fee amount and complete the payment</li>



                          <li>Copy the UPI transaction reference (UTR) and enter it below</li>



                        </ol>



                        <label className="block">



                          <span className="field-label">UPI Transaction Reference (UTR)</span>



                          <input



                            type="text"



                            className="field-input"



                            placeholder="e.g. 4152XXXXXXXX"



                            value={upiTxnId}



                            onChange={(e) => setUpiTxnId(e.target.value)}



                          />



                        </label>



                        <button



                          type="button"



                          onClick={confirmUpiPayment}



                          disabled={verifying || !upiTxnId.trim()}



                          className="btn-gold w-full disabled:cursor-not-allowed disabled:opacity-60"



                        >



                          {verifying ? "Submitting…" : "I Have Paid — Submit for Verification"}



                        </button>



                      </div>



                    </div>



                  </div>



                )}



                {paymentStatus === "PENDING" && fee && fee.enabled && fee.amount > 0 && (



                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">



                    <div className="flex items-center gap-3">



                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-amber-600" aria-hidden="true">



                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />



                      </svg>



                      <div>



                        <p className="font-semibold text-amber-800 dark:text-amber-200">Awaiting Verification</p>



                        <p className="text-sm text-amber-700 dark:text-amber-300">Your payment details have been submitted. Our team will verify your transaction. Once verified, you can submit your application.</p>



                      </div>



                    </div>



                    {paymentRef?.txnId && (



                      <p className="mt-3 text-sm font-mono text-navy dark:text-white">UTR: {paymentRef.txnId}</p>



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





                {paymentStatus === "SUCCESS" && paymentRef?.paymentId && (



                  <div className="mt-5 grid gap-3 rounded-xl border border-border bg-white dark:bg-[#131a2e] p-5 sm:grid-cols-2">



                    <div>



                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment ID</p>



                      <p className="mt-1 font-mono text-sm text-navy dark:text-white">{paymentRef.paymentId}</p>



                    </div>



                    <div>



                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount Paid</p>



                      <p className="mt-1 text-sm font-semibold text-navy dark:text-white">



                        ₹{paymentRef.amount != null ? Number(paymentRef.amount).toLocaleString("en-IN") : ""}



                      </p>



                    </div>



                    {paymentRef?.txnId && (



                      <div>



                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">UPI Transaction Ref</p>



                        <p className="mt-1 font-mono text-sm text-navy dark:text-white">{paymentRef.txnId}</p>



                      </div>



                    )}



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


                    {form.familyStatus === "SINGLE_PARENT" && <ReviewRow label="Single Parent Type" value={form.singleParentType} />}


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


              disabled={submitting || (paymentStatus !== "SUCCESS" && fee?.enabled !== false)}


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


